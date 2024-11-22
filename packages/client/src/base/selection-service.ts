/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
    Command,
    CommandExecutionContext,
    Disposable,
    DisposableCollection,
    Emitter,
    Event,
    GChildElement,
    GModelElement,
    GModelRoot,
    ILogger,
    LazyInjector,
    SelectAction,
    SelectAllAction,
    SprottySelectAllCommand,
    SprottySelectCommand,
    TYPES,
    hasArrayProp,
    hasFunctionProp,
    isSelectable,
    pluck
} from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct, preDestroy } from 'inversify';
import { SelectableElement, getElements, getMatchingElements } from '../utils/gmodel-util';
import { IGModelRootListener } from './editor-context-service';
import { IFeedbackActionDispatcher } from './feedback/feedback-action-dispatcher';
import { IDiagramStartup } from './model/diagram-loader';

export interface ISelectionListener {
    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[], deselectedElements?: string[]): void;
}

export namespace ISelectionListener {
    export function is(object: unknown): object is ISelectionListener {
        return AnyObject.is(object) && hasFunctionProp(object, 'selectionChanged');
    }
}

export interface SelectionChange {
    root: Readonly<GModelRoot>;
    selectedElements: string[];
    deselectedElements: string[];
}

@injectable()
export class SelectionService implements IGModelRootListener, Disposable, IDiagramStartup {
    @inject(TYPES.IFeedbackActionDispatcher)
    protected feedbackDispatcher: IFeedbackActionDispatcher;

    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    @inject(TYPES.ILogger)
    protected logger: ILogger;

    protected root: Readonly<GModelRoot>;
    protected selectedElementIDs: Set<string> = new Set();

    protected toDispose = new DisposableCollection();

    @postConstruct()
    protected initialize(): void {
        this.toDispose.push(this.onSelectionChangedEmitter);
    }

    preLoadDiagram(): void {
        this.lazyInjector.getAll<ISelectionListener>(TYPES.ISelectionListener).forEach(listener => this.addListener(listener));
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }

    protected onSelectionChangedEmitter = new Emitter<SelectionChange>();
    get onSelectionChanged(): Event<SelectionChange> {
        return this.onSelectionChangedEmitter.event;
    }

    addListener(listener: ISelectionListener): Disposable {
        return this.onSelectionChanged(change =>
            listener.selectionChanged(change.root, change.selectedElements, change.deselectedElements)
        );
    }

    modelRootChanged(root: Readonly<GModelRoot>): void {
        this.updateSelection(root, [], []);
    }

    updateSelection(newRoot: Readonly<GModelRoot>, select: string[], deselect: string[]): void {
        if (newRoot === undefined && select.length === 0 && deselect.length === 0) {
            return;
        }
        const prevRoot = this.root;
        const prevSelectedElementIDs = new Set(this.selectedElementIDs);

        this.root = newRoot;

        // We only select elements that are not part of the deselection
        const toSelect = [...select].filter(selectId => deselect.indexOf(selectId) === -1);

        // We only need to deselect elements that are not part of the selection
        // If an element is part of both the select and deselect, it's state is not changed
        const toDeselect = [...deselect].filter(deselectId => select.indexOf(deselectId) === -1 && this.selectedElementIDs.has(deselectId));

        // update selected element ids
        toDeselect.forEach(toDeselectId => this.selectedElementIDs.delete(toDeselectId));
        toSelect.forEach(toSelectId => this.selectedElementIDs.add(toSelectId));

        // check if the newly or previously selected elements still exist in the updated root
        const deselectedElementIDs = new Set(toDeselect);
        for (const id of this.selectedElementIDs) {
            const element = newRoot.index.getById(id);
            if (element === undefined) {
                // element to be selected does not exist in the root...
                this.selectedElementIDs.delete(id);
                if (prevRoot?.index.getById(id)) {
                    // ...but existed in the previous root, so we want to consider it deselected
                    deselectedElementIDs.add(id);
                }
            }
        }

        // only send out changes if there actually are changes, i.e., any of the selected elements ids has changed
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
            // notify listeners after the feedback action
            this.notifyListeners(this.root, this.selectedElementIDs, deselectedElementIDs);
        }
    }

    dispatchFeedback(actions: Action[]): void {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }

    notifyListeners(root: GModelRoot, selectedElementIDs: Set<string>, deselectedElementIDs: Set<string>): void {
        this.onSelectionChangedEmitter.fire({
            root,
            selectedElements: Array.from(selectedElementIDs),
            deselectedElements: Array.from(deselectedElementIDs)
        });
    }

    getModelRoot(): Readonly<GModelRoot> {
        return this.root;
    }

    getSelectedElements(): Readonly<SelectableElement>[] {
        return !this.root ? [] : getElements(this.root.index, Array.from(this.selectedElementIDs), isSelectable);
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

    protected selected: GModelElement[] = [];
    protected deselected: GModelElement[] = [];

    constructor(
        @inject(TYPES.Action) public action: SelectAction,
        @inject(SelectionService) public selectionService: SelectionService
    ) {
        super();
    }

    execute(context: CommandExecutionContext): GModelRoot {
        const model = context.root;
        const selectionGuard = (element: any): element is GModelElement => element instanceof GChildElement && isSelectable(element);
        const selectedElements = getElements(model.index, this.action.selectedElementsIDs, selectionGuard);
        const deselectedElements = this.action.deselectAll
            ? this.selectionService.getSelectedElements()
            : getElements(model.index, this.action.deselectedElementsIDs, selectionGuard);

        this.selectionService.updateSelection(model, pluck(selectedElements, 'id'), pluck(deselectedElements, 'id'));
        return model;
    }

    // Basically no-op since client-side undo is not supported in GLSP.
    undo(context: CommandExecutionContext): GModelRoot {
        return context.root;
    }

    // Basically no-op since client-side redo is not supported in GLSP.
    redo(context: CommandExecutionContext): GModelRoot {
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
        @inject(SelectionService) public selectionService: SelectionService
    ) {
        super();
    }

    execute(context: CommandExecutionContext): GModelRoot {
        const model = context.root;
        const selectionGuard = (element: any): element is GModelElement => element instanceof GChildElement && isSelectable(element);

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
    undo(context: CommandExecutionContext): GModelRoot {
        return context.root;
    }

    // Basically no-op since client-side redo is not supported in GLSP.
    redo(context: CommandExecutionContext): GModelRoot {
        return context.root;
    }
}

export interface SelectFeedbackAction extends Omit<SelectAction, 'kind'>, Action {
    kind: typeof SelectFeedbackAction.KIND;
}

export namespace SelectFeedbackAction {
    export const KIND = 'selectFeedback';

    export function is(object: any): object is SelectFeedbackAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'selectedElementsIDs') && hasArrayProp(object, 'deselectedElementsIDs');
    }

    export function create(options?: { selectedElementsIDs?: string[]; deselectedElementsIDs?: string[] | boolean }): SelectFeedbackAction {
        return { ...SelectAction.create(options), kind: KIND };
    }

    export function addSelection(selectedElementsIDs: string[]): SelectFeedbackAction {
        return { ...SelectAction.addSelection(selectedElementsIDs), kind: KIND };
    }

    export function removeSelection(deselectedElementsIDs: string[]): SelectFeedbackAction {
        return { ...SelectAction.removeSelection(deselectedElementsIDs), kind: KIND };
    }

    export function setSelection(selectedElementsIDs: string[]): SelectFeedbackAction {
        return { ...SelectAction.setSelection(selectedElementsIDs), kind: KIND };
    }
}
