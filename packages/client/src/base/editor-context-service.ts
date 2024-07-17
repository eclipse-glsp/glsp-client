/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
import {
    Action,
    AnyObject,
    Args,
    CommandStack,
    Disposable,
    DisposableCollection,
    EditMode,
    EditorContext,
    Emitter,
    Event,
    GModelElement,
    GModelRoot,
    IActionHandler,
    LazyInjector,
    MaybePromise,
    MousePositionTracker,
    SetDirtyStateAction,
    SetEditModeAction,
    TYPES,
    ValueChange
} from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { GLSPActionDispatcher } from './action-dispatcher';
import { FocusChange, FocusTracker } from './focus/focus-tracker';
import { IDiagramOptions, IDiagramStartup } from './model/diagram-loader';
import { SelectionChange, SelectionService } from './selection-service';

/**
 * A hook to listen for model root changes. Will be called after a server update
 * has been processed
 */
export interface IGModelRootListener {
    modelRootChanged(root: Readonly<GModelRoot>): void;
}

/**
 * @deprecated Use {@link IGModelRootListener} instead
 */
export type ISModelRootListener = IGModelRootListener;

/**
 * A hook to listen for edit mode changes. Will be after the {@link EditorContextService}
 * has handled the {@link SetEditModeAction}.
 */
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

    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    @inject(TYPES.IDiagramOptions)
    protected diagramOptions: IDiagramOptions;

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    @inject(FocusTracker)
    protected focusTracker: FocusTracker;

    protected _editMode: string;
    protected onEditModeChangedEmitter = new Emitter<ValueChange<string>>();
    /**
     * Event that is fired when the edit mode of the diagram changes i.e. after a {@link SetEditModeAction} has been handled.
     */
    get onEditModeChanged(): Event<ValueChange<string>> {
        return this.onEditModeChangedEmitter.event;
    }

    protected _isDirty: boolean;
    protected onDirtyStateChangedEmitter = new Emitter<DirtyStateChange>();
    /**
     * Event that is fired when the dirty state of the diagram changes i.e. after a {@link SetDirtyStateAction} has been handled.
     */
    get onDirtyStateChanged(): Event<DirtyStateChange> {
        return this.onDirtyStateChangedEmitter.event;
    }

    protected _modelRoot?: Readonly<GModelRoot>;
    /**
     * Event that is fired when the model root of the diagram changes i.e. after the `CommandStack` has processed a model update.
     */
    protected onModelRootChangedEmitter = new Emitter<Readonly<GModelRoot>>();
    get onModelRootChanged(): Event<Readonly<GModelRoot>> {
        return this.onModelRootChangedEmitter.event;
    }

    /**
     * Event that is fired when the focus state of the diagram changes i.e. after a {@link FocusStateChangedAction} has been handled
     * by the {@link FocusTracker}.
     */
    get onFocusChanged(): Event<FocusChange> {
        return this.focusTracker.onFocusChanged;
    }

    /**
     * Event that is fired when the selection of the diagram changes i.e. a selection change has been handled
     * by the {@link SelectionService}.
     */
    get onSelectionChanged(): Event<SelectionChange> {
        return this.selectionService.onSelectionChanged;
    }

    protected toDispose = new DisposableCollection();

    @postConstruct()
    protected initialize(): void {
        this._editMode = this.diagramOptions.editMode ?? EditMode.EDITABLE;
        this.toDispose.push(this.onEditModeChangedEmitter, this.onDirtyStateChangedEmitter);
    }

    preLoadDiagram(): MaybePromise<void> {
        this.lazyInjector.getAll<IGModelRootListener>(TYPES.IGModelRootListener).forEach(listener => {
            this.onModelRootChanged(event => listener.modelRootChanged(event));
        });
        this.lazyInjector.getAll<IEditModeListener>(TYPES.IEditModeListener).forEach(listener => {
            this.onEditModeChanged(event => listener.editModeChanged(event.newValue, event.oldValue));
        });
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

    /**
     * Notifies the service about a model root change. This method should not be called
     * directly. It is called by the `CommandStack` after a model update has been processed.
     * @throws an error if the notifier is not a `CommandStack`
     * @param root the new model root
     * @param notifier the object that triggered the model root change
     */
    notifyModelRootChanged(root: Readonly<GModelRoot>, notifier: AnyObject): void {
        if (!(notifier instanceof CommandStack)) {
            throw new Error('Invalid model root change notification. Notifier is not an instance of `CommandStack`.');
        }
        this._modelRoot = root;
        this.onModelRootChangedEmitter.fire(root);
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

    get modelRoot(): Readonly<GModelRoot> {
        if (!this._modelRoot) {
            throw new Error('Model root not available yet');
        }
        return this._modelRoot;
    }

    get selectedElements(): Readonly<GModelElement>[] {
        return this.selectionService.getSelectedElements();
    }

    get isReadonly(): boolean {
        return this.editMode === EditMode.READONLY;
    }

    get isDirty(): boolean {
        return this._isDirty;
    }
}

export type EditorContextServiceProvider = () => Promise<EditorContextService>;
