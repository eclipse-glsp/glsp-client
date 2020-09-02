/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { inject, injectable, multiInject, optional } from "inversify";
import { Action, IActionHandler, ModelSource, MousePositionTracker, Point, SModelElement, SModelRoot, TYPES } from "sprotty";

import { SelectionService } from "../features/select/selection-service";
import { distinctAdd, remove } from "../utils/array-utils";
import { EditMode, isSetEditModeAction } from "./actions/edit-mode-action";
import { Args } from "./args";
import { isSourceUriAware } from "./source-uri-aware";
import { GLSP_TYPES } from "./types";

export interface EditorContext {
    readonly selectedElementIds: string[];
    readonly lastMousePosition?: Point;
    readonly args?: Args;
}

export interface EditModeListener {
    editModeChanged(newValue: string, oldvalue: string): void;
}
@injectable()
export class EditorContextService implements IActionHandler {

    @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService;
    @inject(MousePositionTracker) protected mousePositionTracker: MousePositionTracker;
    @inject(TYPES.ModelSourceProvider) protected modelSource: () => Promise<ModelSource>;
    editMode: string;

    constructor(@multiInject(GLSP_TYPES.IEditModeListener) @optional() protected editModeListeners: EditModeListener[] = []) { }

    register(editModeListener: EditModeListener) {
        distinctAdd(this.editModeListeners, editModeListener);
    }

    deregister(editModeListener: EditModeListener) {
        remove(this.editModeListeners, editModeListener);
    }

    get(args?: Args): EditorContext {
        return {
            selectedElementIds: Array.from(this.selectionService.getSelectedElementIDs()),
            lastMousePosition: this.mousePositionTracker.lastPositionOnDiagram,
            args
        };
    }

    getWithSelection(selectedElementIds: string[], args?: Args): EditorContext {
        return {
            selectedElementIds,
            lastMousePosition: this.mousePositionTracker.lastPositionOnDiagram,
            args
        };
    }

    handle(action: Action) {
        if (isSetEditModeAction(action)) {
            const oldValue = this.editMode;
            this.editMode = action.editMode;
            this.notifiyEditModeListeners(oldValue);
        }
    }

    protected notifiyEditModeListeners(oldValue: string) {
        this.editModeListeners.forEach(listener => listener.editModeChanged(oldValue, this.editMode));
    }

    async getSourceUri() {
        const modelSource = await this.modelSource();
        if (isSourceUriAware(modelSource)) {
            return modelSource.getSourceURI();
        }
        return undefined;
    }

    get modelRoot(): Readonly<SModelRoot> {
        return this.selectionService.getModelRoot();
    }

    get selectedElements(): Readonly<SModelElement>[] {
        return this.selectionService.getSelectedElements();
    }

    get isReadonly(): boolean {
        return this.editMode === EditMode.READONLY;
    }
}

export type EditorContextServiceProvider = () => Promise<EditorContextService>;

