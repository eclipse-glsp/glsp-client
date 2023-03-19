/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { Action, Args, distinctAdd, EditMode, EditorContext, remove, SetEditModeAction } from '@eclipse-glsp/protocol';
import { inject, injectable, multiInject, optional } from 'inversify';
import { IActionHandler, MousePositionTracker, SModelElement, SModelRoot } from 'sprotty';
import { SelectionService } from '../features/select/selection-service';
import { GLSPDiagramOptions } from './diagram-options';
import { TYPES } from './types';

export interface EditModeListener {
    editModeChanged(newValue: string, oldValue: string): void;
}

/**
 * The `EditorContextService` is a central injectable component that gives read-only access to
 * certain aspects of the diagram, such as the currently selected elements, the model root,
 * the edit mode, the latest position of the mouse in the diagram.
 *
 * It has been introduced for two main reasons:
 * 1. to simplify accessing the model root and the current selection from components that are
 *    not commands,
 * 2. to conveniently create an EditorContext, which is a context object sent as part of several
 *    actions to the server to describe the current state of the editor (selection, last mouse
 *    position, etc.).
 */
@injectable()
export class EditorContextService implements IActionHandler {
    @inject(TYPES.SelectionService)
    protected selectionService: SelectionService;

    @inject(MousePositionTracker)
    protected mousePositionTracker: MousePositionTracker;

    @multiInject(TYPES.IEditModeListener)
    @optional()
    protected editModeListeners: EditModeListener[] = [];

    @inject(TYPES.GLSPDiagramOptions)
    protected diagramOptions: GLSPDiagramOptions;

    protected _editMode: string;

    register(editModeListener: EditModeListener): void {
        distinctAdd(this.editModeListeners, editModeListener);
    }

    deregister(editModeListener: EditModeListener): void {
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

    handle(action: Action): void {
        if (SetEditModeAction.is(action)) {
            const oldValue = this._editMode;
            this._editMode = action.editMode;
            this.notifyEditModeListeners(oldValue);
        }
    }

    protected notifyEditModeListeners(oldValue: string): void {
        this.editModeListeners.forEach(listener => listener.editModeChanged(oldValue, this.editMode));
    }

    /**
     *
     * @deprecated Use `EditorContextService.sourceUri` instead.
     */
    getSourceUri(): Promise<string | undefined> {
        return Promise.resolve(this.sourceUri);
    }

    get sourceUri(): string | undefined {
        return this.diagramOptions.sourceUri;
    }

    get editMode(): string {
        return this._editMode;
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
