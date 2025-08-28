/********************************************************************************
 * Copyright (c) 2020-2025 EclipseSource and others.
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
    Args,
    Bounds,
    Disposable,
    DisposableCollection,
    EditMode,
    EditorContext,
    Emitter,
    Event,
    findParentByFeature,
    GModelElement,
    GModelRoot,
    IActionDispatcher,
    IActionHandler,
    isViewport,
    LazyInjector,
    MaybePromise,
    MousePositionTracker,
    Point,
    SetDirtyStateAction,
    SetEditModeAction,
    TYPES,
    ValueChange,
    Viewport
} from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { FocusChange, FocusTracker } from './focus/focus-tracker';
import { IDiagramOptions, IDiagramStartup } from './model/diagram-loader';
import { IModelChangeService, ViewportChange } from './model/model-change-service';
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

    @inject(TYPES.IModelChangeService)
    protected modelChangeService: IModelChangeService;

    @inject(MousePositionTracker)
    protected mousePositionTracker: MousePositionTracker;

    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    @inject(TYPES.IDiagramOptions)
    protected diagramOptions: IDiagramOptions;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

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

    /**
     * Event that is fired when the model root of the diagram changes i.e. after the `CommandStack` has processed a model update.
     */
    get onModelRootChanged(): Event<Readonly<GModelRoot>> {
        return this.modelChangeService.onModelRootChanged;
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

    /**
     * Event that is fired when the viewport of the diagram changes i.e. after the `CommandStack` has processed a viewport update.
     * By default, this event is only fired if the viewport was changed via a `SetViewportCommand` or `BoundsAwareViewportCommand`
     */
    get onViewportChanged(): Event<ViewportChange> {
        return this.modelChangeService.onViewportChanged;
    }

    protected toDispose = new DisposableCollection();

    @postConstruct()
    protected initialize(): void {
        this._editMode = this.diagramOptions.editMode ?? EditMode.EDITABLE;
        this.toDispose.push(this.onEditModeChangedEmitter, this.onDirtyStateChangedEmitter);
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }

    preLoadDiagram(): MaybePromise<void> {
        this.lazyInjector.getAll<IGModelRootListener>(TYPES.IGModelRootListener).forEach(listener => {
            this.onModelRootChanged(event => listener.modelRootChanged(event));
        });
        this.lazyInjector.getAll<IEditModeListener>(TYPES.IEditModeListener).forEach(listener => {
            this.onEditModeChanged(event => listener.editModeChanged(event.newValue, event.oldValue));
        });
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

    get modelRoot(): Readonly<GModelRoot> {
        if (!this.modelChangeService.currentRoot) {
            throw new Error('Model root not available yet');
        }
        return this.modelChangeService.currentRoot;
    }

    get viewport(): Readonly<GModelRoot & Viewport> | undefined {
        return this.modelRoot ? findParentByFeature(this.modelRoot, isViewport) : undefined;
    }

    get viewportData(): Readonly<Viewport> {
        const viewport = this.viewport;
        // default values aligned with GetViewportCommand
        return {
            scroll: viewport?.scroll ?? Point.ORIGIN,
            zoom: viewport?.zoom ?? 1
        };
    }

    get canvasBounds(): Readonly<Bounds> {
        // default value aligned with the initialization of canvasBounds in GModelRoot
        return this.modelRoot?.canvasBounds ?? Bounds.EMPTY;
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
