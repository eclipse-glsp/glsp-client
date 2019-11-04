/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { inject, injectable } from "inversify";
import {
    Command,
    CommandExecutionContext,
    isSelectable,
    SChildElement,
    SelectAction,
    SelectAllAction,
    SelectAllCommand as SprottySelectAllCommand,
    SelectCommand as SprottySelectCommand,
    SModelElement,
    SModelRoot,
    SParentElement,
    TYPES
} from "sprotty";

import { GLSP_TYPES } from "../../types";
import { SelectionService } from "./selection-service";

export class SelectFeedbackAction {
    kind = SelectFeedbackCommand.KIND;

    constructor(public readonly selectedElementsIDs: string[] = [],
        public readonly deselectedElementsIDs: string[] = []) {
    }
}

export class SelectAllFeedbackAction {
    kind = SelectAllFeedbackCommand.KIND;

    /**
     * If `select` is true, all elements are selected, othewise they are deselected.
     */
    constructor(public readonly select: boolean = true) {
    }
}

@injectable()
export class SelectFeedbackCommand extends Command {
    static readonly KIND = 'elementSelectedFeedback';
    private sprottySelectCommand: SprottySelectCommand;

    constructor(@inject(TYPES.Action) public action: SelectFeedbackAction) {
        super();
        this.sprottySelectCommand = new SprottySelectCommand(action);
    }

    execute(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectCommand.execute(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectCommand.undo(context);
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectCommand.redo(context);
    }
}

@injectable()
export class SelectAllFeedbackCommand extends Command {
    static readonly KIND = 'allSelectedFeedback';
    private sprottySelectAllCommand: SprottySelectAllCommand;

    constructor(@inject(TYPES.Action) public action: SelectAllFeedbackAction) {
        super();
        this.sprottySelectAllCommand = new SprottySelectAllCommand(action);
    }

    execute(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectAllCommand.execute(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectAllCommand.undo(context);
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectAllCommand.redo(context);
    }
}

@injectable()
export class SelectCommand extends Command {
    static readonly KIND = SprottySelectCommand.KIND;

    protected selected: SModelElement[] = [];
    protected deselected: SModelElement[] = [];

    constructor(@inject(TYPES.Action) public action: SelectAction, @inject(GLSP_TYPES.SelectionService) public selectionService: SelectionService) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const model = context.root;
        this.action.selectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElement && isSelectable(element)) {
                this.selected.push(element);
            }
        });
        this.action.deselectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElement && isSelectable(element)) {
                this.deselected.push(element);
            }
        });
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        const select = this.deselected.map(element => element.id);
        const deselect = this.selected.map(element => element.id);
        this.selectionService.updateSelection(context.root, select, deselect);
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        const select = this.selected.map(element => element.id);
        const deselect = this.deselected.map(element => element.id);
        this.selectionService.updateSelection(context.root, select, deselect);
        return context.root;
    }
}

@injectable()
export class SelectAllCommand extends Command {
    static readonly KIND = SprottySelectAllCommand.KIND;
    protected previousSelection: Map<string, boolean> = new Map<string, boolean>();

    constructor(@inject(TYPES.Action) public action: SelectAllAction, @inject(GLSP_TYPES.SelectionService) public selectionService: SelectionService) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        const index = context.root.index;
        for (const previousState of this.previousSelection) {
            const element = index.getById(previousState[0]);
            if (element !== undefined && isSelectable(element)) {
                element.selected = previousState[1];
            }
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        const selectables: string[] = [];
        this.selectAll(context.root, this.action.select, selectables);
        if (this.action.select) {
            this.selectionService.updateSelection(context.root, selectables, []);
        } else {
            this.selectionService.updateSelection(context.root, [], selectables);
        }
        return context.root;
    }

    protected selectAll(element: SParentElement, newState: boolean, selected: string[]): void {
        if (isSelectable(element)) {
            this.previousSelection.set(element.id, element.selected);
            selected.push(element.id);
        }
        for (const child of element.children) {
            this.selectAll(child, newState, selected);
        }
    }
}
