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
import { inject, injectable, multiInject, optional, postConstruct, preDestroy } from 'inversify';
import {
    Action,
    Args,
    Disposable,
    DisposableCollection,
    EditMode,
    EditorContext,
    Emitter,
    Event,
    IActionHandler,
    MaybePromise,
    MousePositionTracker,
    SModelElement,
    SModelRoot,
    SetDirtyStateAction,
    SetEditModeAction,
    TYPES,
    ValueChange
} from '~glsp-sprotty';
import { GLSPActionDispatcher } from './action-dispatcher';
import { IDiagramOptions, IDiagramStartup } from './model/diagram-loader';
import { SelectionService } from './selection-service';

export interface IEditModeListener {
    editModeChanged(newValue: string, oldValue: string): void;
}

export type DirtyStateChange = Pick<SetDirtyStateAction, 'isDirty' | 'reason'>;
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
export class EditorContextService implements IActionHandler, Disposable, IDiagramStartup {
    @inject(SelectionService)
    protected selectionService: SelectionService;

    @inject(MousePositionTracker)
    protected mousePositionTracker: MousePositionTracker;

    @inject(TYPES.IDiagramOptions)
    protected diagramOptions: IDiagramOptions;

    @multiInject(TYPES.IEditModeListener)
    @optional()
    protected editModeListeners: IEditModeListener[] = [];

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    protected _editMode: string;
    protected onEditModeChangedEmitter = new Emitter<ValueChange<string>>();
    get onEditModeChanged(): Event<ValueChange<string>> {
        return this.onEditModeChangedEmitter.event;
    }

    protected _isDirty: boolean;
    protected onDirtyStateChangedEmitter = new Emitter<DirtyStateChange>();
    get onDirtyStateChanged(): Event<DirtyStateChange> {
        return this.onDirtyStateChangedEmitter.event;
    }

    protected toDispose = new DisposableCollection();

    @postConstruct()
    protected initialize(): void {
        this._editMode = this.diagramOptions.editMode ?? EditMode.EDITABLE;
        this.toDispose.push(this.onEditModeChangedEmitter, this.onDirtyStateChangedEmitter);
        this.editModeListeners.forEach(listener =>
            this.onEditModeChanged(change => listener.editModeChanged(change.newValue, change.oldValue))
        );
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
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
            this.handleSetEditModeAction(action);
        } else if (SetDirtyStateAction.is(action)) {
            this.handleSetDirtyStateAction(action);
        }
    }

    protected handleSetEditModeAction(action: SetEditModeAction): void {
        const oldValue = this._editMode;
        this._editMode = action.editMode;
        this.onEditModeChangedEmitter.fire({ newValue: this.editMode, oldValue });
    }

    protected handleSetDirtyStateAction(action: SetDirtyStateAction): void {
        if (action.isDirty !== this._isDirty) {
            this._isDirty = action.isDirty;
            this.onDirtyStateChangedEmitter.fire(action);
        }
    }

    get sourceUri(): string | undefined {
        return this.diagramOptions.sourceUri;
    }

    get editMode(): string {
        return this._editMode;
    }

    get diagramType(): string {
        return this.diagramOptions.diagramType;
    }

    get clientId(): string {
        return this.diagramOptions.clientId;
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

    get isDirty(): boolean {
        return this._isDirty;
    }

    postRequestModel(): MaybePromise<void> {
        this.actionDispatcher.dispatch(SetEditModeAction.create(this.editMode));
    }
}

export type EditorContextServiceProvider = () => Promise<EditorContextService>;
