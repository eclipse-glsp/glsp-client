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
import { inject, injectable, optional } from 'inversify';

import {
    Action,
    BoundsAware,
    ChangeBoundsOperation,
    ChangeRoutingPointsOperation,
    CompoundOperation,
    Dimension,
    Disposable,
    EdgeRouterRegistry,
    ElementAndBounds,
    ElementAndRoutingPoints,
    GChildElement,
    GConnectableElement,
    GModelElement,
    GModelRoot,
    GParentElement,
    MouseListener,
    Operation,
    Point,
    TYPES,
    findParentByFeature
} from '@eclipse-glsp/sprotty';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { ISelectionListener, SelectionService } from '../../../base/selection-service';
import {
    BoundsAwareModelElement,
    ResizableModelElement,
    SelectableBoundsAware,
    calcElementAndRoutingPoints,
    getMatchingElements,
    isNonRoutableSelectedMovableBoundsAware,
    toElementAndBounds
} from '../../../utils/gmodel-util';
import { LocalRequestBoundsAction } from '../../bounds/local-bounds';
import { SetBoundsFeedbackAction } from '../../bounds/set-bounds-feedback-command';
import { GResizeHandle, isResizable } from '../../change-bounds/model';
import { IMovementRestrictor } from '../../change-bounds/movement-restrictor';
import { BaseEditTool } from '../base-tools';
import { CSS_ACTIVE_HANDLE, ChangeBoundsManager } from './change-bounds-manager';
import {
    HideChangeBoundsToolResizeFeedbackAction,
    MoveFinishedEventAction,
    ShowChangeBoundsToolResizeFeedbackAction
} from './change-bounds-tool-feedback';
import { FeedbackMoveMouseListener } from './change-bounds-tool-move-feedback';
import { ChangeBoundsTracker, TrackedElementResize, TrackedResize } from './change-bounds-tracker';

/**
 * The change bounds tool has the license to move multiple elements or resize a single element by implementing the ChangeBounds operation.
 * In contrast to Sprotty's implementation this tool only sends a `ChangeBoundsOperationAction` when an operation has finished and does not
 * provide client-side live updates to improve performance.
 *
 * | Operation | Client Update    | Server Update
 * +-----------+------------------+----------------------------
 * | Move      | MoveAction       | ChangeBoundsOperationAction
 * | Resize    | SetBoundsAction  | ChangeBoundsOperationAction
 *
 * To provide a visual client updates during move we install the `FeedbackMoveMouseListener` and to provide visual client updates during
 * resize and send the server updates we install the `ChangeBoundsListener`.
 */
@injectable()
export class ChangeBoundsTool extends BaseEditTool {
    static ID = 'glsp.change-bounds-tool';

    @inject(SelectionService) protected selectionService: SelectionService;
    @inject(EdgeRouterRegistry) @optional() readonly edgeRouterRegistry?: EdgeRouterRegistry;
    @inject(TYPES.IMovementRestrictor) @optional() readonly movementRestrictor?: IMovementRestrictor;
    @inject(ChangeBoundsManager) readonly changeBoundsManager: ChangeBoundsManager;

    get id(): string {
        return ChangeBoundsTool.ID;
    }

    enable(): void {
        // install feedback move mouse listener for client-side move updates
        const feedbackMoveMouseListener = this.createMoveMouseListener();
        if (Disposable.is(feedbackMoveMouseListener)) {
            this.toDisposeOnDisable.push(feedbackMoveMouseListener);
        }

        // install change bounds listener for client-side resize updates and server-side updates
        const changeBoundsListener = this.createChangeBoundsListener();
        if (Disposable.is(changeBoundsListener)) {
            this.toDisposeOnDisable.push(changeBoundsListener);
        }

        this.toDisposeOnDisable.push(
            this.mouseTool.registerListener(feedbackMoveMouseListener),
            this.mouseTool.registerListener(changeBoundsListener),
            this.selectionService.onSelectionChanged(change => changeBoundsListener.selectionChanged(change.root, change.selectedElements))
        );
    }

    createChangeBoundsTracker(): ChangeBoundsTracker {
        return this.changeBoundsManager.createTracker();
    }

    protected createMoveMouseListener(): MouseListener {
        return new FeedbackMoveMouseListener(this);
    }

    protected createChangeBoundsListener(): MouseListener & ISelectionListener {
        return new ChangeBoundsListener(this);
    }
}

export class ChangeBoundsListener extends DragAwareMouseListener implements ISelectionListener {
    static readonly CSS_CLASS_ACTIVE = CSS_ACTIVE_HANDLE;

    // members for calculating the correct position change
    protected initialBounds: ElementAndBounds | undefined;
    protected tracker: ChangeBoundsTracker;

    // members for resize mode
    protected activeResizeElement?: ResizableModelElement;
    protected activeResizeHandle?: GResizeHandle;
    protected handleFeedback: FeedbackEmitter;
    protected resizeFeedback: FeedbackEmitter;

    constructor(protected tool: ChangeBoundsTool) {
        super();
        this.tracker = tool.createChangeBoundsTracker();
        this.handleFeedback = tool.createFeedbackEmitter();
        this.resizeFeedback = tool.createFeedbackEmitter();
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseDown(target, event);
        // If another button than the left mouse button was clicked or we are
        // still on the root element we don't need to execute the tool behavior
        if (event.button !== 0 || target instanceof GModelRoot) {
            return [];
        }
        // check if we have a resize handle (only single-selection)
        this.updateResizeElement(target, event);
        return [];
    }

    protected updateResizeElement(target: GModelElement, event?: MouseEvent): boolean {
        this.activeResizeHandle = target instanceof GResizeHandle ? target : undefined;
        this.activeResizeElement = this.activeResizeHandle?.parent ?? this.findResizeElement(target);
        if (this.activeResizeElement) {
            if (event) {
                this.tracker.startTracking();
            }
            this.initialBounds = {
                newSize: this.activeResizeElement.bounds,
                newPosition: this.activeResizeElement.bounds,
                elementId: this.activeResizeElement.id
            };
            // we trigger the local bounds calculation once to get the correct layout information for reszing
            // for any sub-sequent calls the layout information will be updated automatically
            this.tool
                .createFeedbackEmitter()
                .add(LocalRequestBoundsAction.create(target.root, [this.activeResizeElement.id]))
                .submit()
                .dispose();
            this.handleFeedback.add(
                ShowChangeBoundsToolResizeFeedbackAction.create({ elementId: this.activeResizeElement.id }),
                HideChangeBoundsToolResizeFeedbackAction.create()
            );
            this.handleFeedback.submit();
            return true;
        } else {
            this.disposeResize();
            return false;
        }
    }

    protected findResizeElement(target: GModelElement): ResizableModelElement | undefined {
        // check if we have a selected, moveable element (multi-selection allowed)
        // but only allow one element to have the element resize handles
        return findParentByFeature(target, isResizable);
    }

    protected override draggingMouseMove(target: GModelElement, event: MouseEvent): Action[] {
        // rely on the FeedbackMoveMouseListener to update the element bounds of selected elements
        // consider resize handles ourselves
        if (this.activeResizeHandle && this.tracker.isTracking()) {
            const resize = this.tracker.resizeElements(this.activeResizeHandle, { snap: event, symmetric: event, restrict: event });
            const resizeAction = this.resizeBoundsAction(resize);
            if (resizeAction.bounds.length > 0) {
                this.resizeFeedback.add(resizeAction, () => this.resetBounds());
                this.tracker.updateTrackingPosition(resize.handleMove.moveVector);
                this.addResizeFeedback(resize, target, event);
                this.resizeFeedback.submit();
            }
        }
        return super.draggingMouseMove(target, event);
    }

    protected resizeBoundsAction(resize: TrackedResize): SetBoundsFeedbackAction {
        // we do not want to resize elements beyond their valid size, not even for feedback, as the next layout cycle usually corrects this
        const elementResizes = resize.elementResizes.filter(elementResize => elementResize.valid.size);
        return SetBoundsFeedbackAction.create(elementResizes.map(elementResize => this.toElementAndBounds(elementResize)));
    }

    protected toElementAndBounds(elementResize: TrackedElementResize): ElementAndBounds {
        return {
            elementId: elementResize.element.id,
            newSize: elementResize.toBounds,
            newPosition: elementResize.toBounds
        };
    }

    protected addResizeFeedback(resize: TrackedResize, target: GModelElement, event: MouseEvent): void {
        this.tool.changeBoundsManager.addResizeFeedback(this.resizeFeedback, resize, target, event);
    }

    protected resetBounds(): Action[] {
        // reset the bounds to the initial bounds and ensure that we do not show helper line feedback anymore (MoveFinishedEventAction)
        return this.initialBounds
            ? [SetBoundsFeedbackAction.create([this.initialBounds]), MoveFinishedEventAction.create()]
            : [MoveFinishedEventAction.create()];
    }

    override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        const actions: Action[] = [];
        if (this.activeResizeHandle) {
            actions.push(...this.handleResizeOnServer(this.activeResizeHandle));
        } else {
            // since the move feedback is handled by another class we just see whether there is something to move
            actions.push(...this.handleMoveOnServer(target));
        }
        this.disposeResize({ keepHandles: true });
        return actions;
    }

    override nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        this.disposeResize({ keepHandles: true });
        return super.nonDraggingMouseUp(element, event);
    }

    protected handleMoveOnServer(target: GModelElement): Action[] {
        const operations: Operation[] = [];
        const elementToMove = this.getElementsToMove(target);
        operations.push(...this.handleMoveElementsOnServer(elementToMove));
        operations.push(...this.handleMoveRoutingPointsOnServer(elementToMove));
        return operations.length > 0 ? [CompoundOperation.create(operations)] : [];
    }

    protected getElementsToMove(target: GModelElement): SelectableBoundsAware[] {
        const selectedElements = getMatchingElements(target.index, isNonRoutableSelectedMovableBoundsAware);
        const selectionSet: Set<BoundsAwareModelElement> = new Set(selectedElements);
        return selectedElements.filter(element => this.isValidMove(element, selectionSet));
    }

    protected handleMoveElementsOnServer(elementsToMove: SelectableBoundsAware[]): Operation[] {
        const newBounds = elementsToMove.map(toElementAndBounds);
        return newBounds.length > 0 ? [ChangeBoundsOperation.create(newBounds)] : [];
    }

    protected isValidMove(element: BoundsAwareModelElement, selectedElements: Set<BoundsAwareModelElement> = new Set()): boolean {
        return this.tool.changeBoundsManager.hasValidPosition(element) && !this.isChildOfSelected(selectedElements, element);
    }

    protected isChildOfSelected(selectedElements: Set<GModelElement>, element: GModelElement): boolean {
        if (selectedElements.size === 0) {
            return false;
        }
        while (element instanceof GChildElement) {
            element = element.parent;
            if (selectedElements.has(element)) {
                return true;
            }
        }
        return false;
    }

    protected handleMoveRoutingPointsOnServer(elementsToMove: SelectableBoundsAware[]): Operation[] {
        const newRoutingPoints: ElementAndRoutingPoints[] = [];
        const routerRegistry = this.tool.edgeRouterRegistry;
        if (routerRegistry) {
            //  If client routing is enabled -> delegate routing points of connected edges to server
            elementsToMove.forEach(element => {
                if (element instanceof GConnectableElement) {
                    element.incomingEdges
                        .map(connectable => calcElementAndRoutingPoints(connectable, routerRegistry))
                        .forEach(ear => newRoutingPoints.push(ear));
                    element.outgoingEdges
                        .map(connectable => calcElementAndRoutingPoints(connectable, routerRegistry))
                        .forEach(ear => newRoutingPoints.push(ear));
                }
            });
        }
        return newRoutingPoints.length > 0 ? [ChangeRoutingPointsOperation.create(newRoutingPoints)] : [];
    }

    protected handleResizeOnServer(activeResizeHandle: GResizeHandle): Action[] {
        if (this.initialBounds && this.isValidResize(activeResizeHandle.parent)) {
            const elementAndBounds = toElementAndBounds(activeResizeHandle.parent);
            if (!this.initialBounds.newPosition || !elementAndBounds.newPosition) {
                return [];
            }
            if (
                !Point.equals(this.initialBounds.newPosition, elementAndBounds.newPosition) ||
                !Dimension.equals(this.initialBounds.newSize, elementAndBounds.newSize)
            ) {
                // UX: we do not want the element positions to be reset to their start as they will be moved to their start and
                // only afterwards moved by the move action again, leading to a ping-pong movement.
                // We therefore clear our element map so that they cannot be reset.
                this.initialBounds = undefined;
                return [ChangeBoundsOperation.create([elementAndBounds])];
            }
        }
        return [];
    }

    protected isValidResize(element: BoundsAwareModelElement): boolean {
        return this.tool.changeBoundsManager.isValid(element);
    }

    selectionChanged(root: GModelRoot, selectedElements: string[]): void {
        if (this.activeResizeElement && selectedElements.includes(this.activeResizeElement.id)) {
            // our active element is still selected, nothing to do
            return;
        }

        // try to find some other selected element and mark that active
        for (const elementId of selectedElements.reverse()) {
            const element = root.index.getById(elementId);
            if (element && this.updateResizeElement(element)) {
                return;
            }
        }
        this.dispose();
    }

    protected isActiveResizeElement(element?: GModelElement): element is GParentElement & BoundsAware {
        return element !== undefined && this.activeResizeElement !== undefined && element.id === this.activeResizeElement.id;
    }

    protected disposeResize(opts: { keepHandles: boolean } = { keepHandles: false }): void {
        if (!opts.keepHandles) {
            this.handleFeedback.dispose();
        }
        this.resizeFeedback.dispose();
        this.tracker.dispose();
        this.activeResizeElement = undefined;
        this.activeResizeHandle = undefined;
        this.initialBounds = undefined;
    }

    override dispose(): void {
        this.disposeResize();
        super.dispose();
    }
}
