/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { Action, distinctAdd, pluck, remove, SelectAction, SelectAllAction } from '@eclipse-glsp/protocol';
import { inject, injectable, multiInject, optional } from 'inversify';
import {
    Command,
    CommandExecutionContext,
    ILogger,
    isSelectable,
    SChildElement,
    Selectable,
    SelectAllCommand as SprottySelectAllCommand,
    SelectCommand as SprottySelectCommand,
    SModelElement,
    SModelRoot
} from 'sprotty';
import { SModelRootListener } from '../../base/model/update-model-command';
import { TYPES } from '../../base/types';
import { getElements, getMatchingElements } from '../../utils/smodel-util';
import { IFeedbackActionDispatcher } from '../tool-feedback/feedback-action-dispatcher';
import { SelectFeedbackAction } from './select-feedback-action';

export interface SelectionListener {
    selectionChanged(root: Readonly<SModelRoot>, selectedElements: string[], deselectedElements: string[]): void;
}

@injectable()
export class SelectionService implements SModelRootListener {
    private root: Readonly<SModelRoot>;
    private selectedElementIDs: Set<string> = new Set();

    @inject(TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher;
    @inject(TYPES.ILogger) protected logger: ILogger;

    constructor(@multiInject(TYPES.SelectionListener) @optional() protected selectionListeners: SelectionListener[] = []) {}

    register(selectionListener: SelectionListener): void {
        distinctAdd(this.selectionListeners, selectionListener);
    }

    deregister(selectionListener: SelectionListener): void {
        remove(this.selectionListeners, selectionListener);
    }

    modelRootChanged(root: Readonly<SModelRoot>): void {
        this.updateSelection(root, [], []);
    }

    updateSelection(root: Readonly<SModelRoot>, select: string[], deselect: string[]): void {
        if (root === undefined && select.length === 0 && deselect.length === 0) {
            return;
        }
        const prevRoot = this.root;
        const prevSelectedElementIDs = new Set(this.selectedElementIDs);

        // update root
        this.root = root;

        // update selected element IDs and collect deselected elements
        // - select all elements that are not deselected at the same time (no-op)
        // - deselect all elements that are not selected at the same time (no-op) but was selected
        const toSelect = [...select].filter(selectId => deselect.indexOf(selectId) === -1);
        const toDeselect = [...deselect].filter(deselectId => select.indexOf(deselectId) === -1 && this.selectedElementIDs.has(deselectId));
        for (const id of toDeselect) {
            this.selectedElementIDs.delete(id);
        }
        for (const id of toSelect) {
            this.selectedElementIDs.add(id);
        }

        const deselectedElementIDs = new Set(toDeselect);
        // see if selected elements still exist in the updated root
        for (const id of this.selectedElementIDs) {
            const element = root.index.getById(id);
            if (element === undefined) {
                this.selectedElementIDs.delete(id);
                if (prevRoot !== undefined && prevRoot.index.getById(id)) {
                    deselectedElementIDs.add(id);
                }
            }
        }

        // only send out changes if there actually are changes, i.e., the root or the selected elements changed
        const selectionChanged =
            prevSelectedElementIDs.size !== this.selectedElementIDs.size ||
            ![...prevSelectedElementIDs].every(value => this.selectedElementIDs.has(value));
        if (selectionChanged) {
            // aggregate to feedback action handling all elements as only the last feedback is restored
            this.dispatchFeedback([
                SelectFeedbackAction.create({
                    selectedElementsIDs: [...this.selectedElementIDs],
                    deselectedElementsIDs: [...deselectedElementIDs]
                })
            ]);
        }

        const rootChanged = prevRoot !== root;
        if (rootChanged || selectionChanged) {
            // notify listeners after the feedback action
            this.notifyListeners(this.root, this.selectedElementIDs, deselectedElementIDs);
        }
    }

    dispatchFeedback(actions: Action[]): void {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }

    notifyListeners(root: SModelRoot, selectedElementIDs: Set<string>, deselectedElementIds: Set<string>): void {
        this.selectionListeners.forEach(listener => listener.selectionChanged(root, Array.from(selectedElementIDs), Array.from(deselectedElementIds)));
    }

    getModelRoot(): Readonly<SModelRoot> {
        return this.root;
    }

    getSelectedElements(): Readonly<SModelElement & Selectable>[] {
        return getElements(this.root.index, Array.from(this.selectedElementIDs), isSelectable);
    }

    /**
     * QUERY METHODS
     */

    getSelectedElementIDs(): string[] {
        return [...this.selectedElementIDs];
    }

    hasSelectedElements(): boolean {
        return this.selectedElementIDs.size > 0;
    }

    isSingleSelection(): boolean {
        return this.selectedElementIDs.size === 1;
    }

    isMultiSelection(): boolean {
        return this.selectedElementIDs.size > 1;
    }
}

/**
 * Handles a {@link SelectAction} and propagates the new selection to the {@link SelectionService}.
 * Other tools might be selection-sensitive which means {@link SelectAction}s must be processed as fast as possible.
 * Handling the action with a command ensures that the action is processed before the next render tick.
 */
@injectable()
export class SelectCommand extends Command {
    static readonly KIND = SprottySelectCommand.KIND;

    protected selected: SModelElement[] = [];
    protected deselected: SModelElement[] = [];

    constructor(
        @inject(TYPES.Action) public action: SelectAction,
        @inject(TYPES.SelectionService) public selectionService: SelectionService
    ) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const model = context.root;
        const selectionGuard = (element: any): element is SModelElement => element instanceof SChildElement && isSelectable(element);
        const selectedElements = getElements(model.index, this.action.selectedElementsIDs, selectionGuard);
        const deselectedElements = getElements(model.index, this.action.deselectedElementsIDs, selectionGuard);

        this.selectionService.updateSelection(model, pluck(selectedElements, 'id'), pluck(deselectedElements, 'id'));
        return model;
    }

    // Basically no-op since client-side undo is not supported in GLSP.
    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    // Basically no-op since client-side redo is not supported in GLSP.
    redo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }
}

/**
 * Handles a {@link SelectAllAction} and propagates the new selection to the {@link SelectionService}.
 * Other tools might be selection-sensitive which means {@link SelectionAllAction}s must be processed as fast as possible.
 * Handling the action with a command ensures that the action is processed before the next render tick.
 */
@injectable()
export class SelectAllCommand extends Command {
    static readonly KIND = SprottySelectAllCommand.KIND;
    protected previousSelection: Map<string, boolean> = new Map<string, boolean>();

    constructor(
        @inject(TYPES.Action) public action: SelectAllAction,
        @inject(TYPES.SelectionService) public selectionService: SelectionService
    ) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const model = context.root;
        const selectionGuard = (element: any): element is SModelElement => element instanceof SChildElement && isSelectable(element);

        const selectables = getMatchingElements(model.index, selectionGuard);
        const selectableIds = pluck(selectables, 'id');
        if (this.action.select) {
            this.selectionService.updateSelection(model, selectableIds, []);
        } else {
            this.selectionService.updateSelection(model, [], selectableIds);
        }

        return model;
    }

    // Basically no-op since client-side undo is not supported in GLSP.
    undo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }

    // Basically no-op since client-side redo is not supported in GLSP.
    redo(context: CommandExecutionContext): SModelRoot {
        return context.root;
    }
}
