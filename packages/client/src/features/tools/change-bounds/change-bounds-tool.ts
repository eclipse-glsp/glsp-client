/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { CursorCSS, applyCssClasses, cursorFeedbackAction, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feeback-emitter';
import { ISelectionListener, SelectionService } from '../../../base/selection-service';
import { isValidMove, isValidSize } from '../../../utils';
import {
    BoundsAwareModelElement,
    ResizableModelElement,
    calcElementAndRoutingPoints,
    forEachElement,
    getMatchingElements,
    isNonRoutableSelectedMovableBoundsAware,
    toElementAndBounds
} from '../../../utils/gmodel-util';
import { SetBoundsFeedbackAction } from '../../bounds';
import { PointPositionUpdater } from '../../change-bounds';
import { ResizeHandleLocation, SResizeHandle, isResizable } from '../../change-bounds/model';
import {
    IMovementRestrictor,
    createMovementRestrictionFeedback,
    removeMovementRestrictionFeedback
} from '../../change-bounds/movement-restrictor';
import { PositionSnapper } from '../../change-bounds/position-snapper';
import { getDirectionFrom } from '../../helper-lines';
import { BaseEditTool } from '../base-tools';
import {
    HideChangeBoundsToolResizeFeedbackAction,
    MoveFinishedEventAction,
    ShowChangeBoundsToolResizeFeedbackAction
} from './change-bounds-tool-feedback';
import { FeedbackMoveMouseListener } from './change-bounds-tool-move-feedback';

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
    @inject(PositionSnapper) readonly positionSnapper: PositionSnapper;

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

    protected createMoveMouseListener(): MouseListener {
        return new FeedbackMoveMouseListener(this);
    }

    protected createChangeBoundsListener(): MouseListener & ISelectionListener {
        return new ChangeBoundsListener(this);
    }
}

export interface ValidatedElementAndBounds extends ElementAndBounds {
    valid: boolean;
}

export namespace ValidatedElementAndBounds {
    export function isValid(move: ElementAndBounds): boolean {
        return (move as ValidatedElementAndBounds).valid ?? true;
    }
}

export class ChangeBoundsListener extends DragAwareMouseListener implements ISelectionListener, Disposable {
    static readonly CSS_CLASS_ACTIVE = 'active';

    // members for calculating the correct position change
    protected initialBounds: ElementAndBounds | undefined;
    protected positionUpdater: PointPositionUpdater;

    // members for resize mode
    protected activeResizeElement?: ResizableModelElement;
    protected activeResizeHandle?: SResizeHandle;
    protected handleFeedback: FeedbackEmitter;
    protected resizeFeedback: FeedbackEmitter;

    constructor(protected tool: ChangeBoundsTool) {
        super();
        this.positionUpdater = new PointPositionUpdater(tool.positionSnapper);
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
        this.activeResizeHandle = target instanceof SResizeHandle ? target : undefined;
        this.activeResizeElement = this.activeResizeHandle?.parent ?? this.findResizeElement(target);
        if (this.activeResizeElement) {
            if (event) {
                this.positionUpdater.updateLastDragPosition(event);
            }
            this.initialBounds = {
                newSize: this.activeResizeElement.bounds,
                newPosition: this.activeResizeElement.bounds,
                elementId: this.activeResizeElement.id
            };
            this.handleFeedback.add(
                ShowChangeBoundsToolResizeFeedbackAction.create(this.activeResizeElement.id),
                HideChangeBoundsToolResizeFeedbackAction.create()
            );
            this.handleFeedback.submit();
            return true;
        } else {
            this.positionUpdater.resetPosition();
            this.handleFeedback.dispose();
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
        if (this.activeResizeHandle && !this.positionUpdater.isLastDragPositionUndefined()) {
            if (!this.initialBounds) {
                const element = this.activeResizeHandle.parent;
                this.initialBounds = { elementId: element.id, newSize: element.bounds, newPosition: element.bounds };
            }
            const positionUpdate = this.positionUpdater.updatePosition(target, event, getDirectionFrom(this.activeResizeHandle.location));
            if (positionUpdate) {
                const resizeActions = this.handleResizeOnClient(positionUpdate).filter(action => action);
                if (resizeActions.length > 0) {
                    this.resizeFeedback.add(SetBoundsFeedbackAction.create(resizeActions), () => this.resetBoundsAction());
                    this.addResizeFeedback(resizeActions, this.activeResizeHandle, target, event);
                    this.resizeFeedback.submit();
                }
            }
        }
        return super.draggingMouseMove(target, event);
    }

    protected filterResizeOnClient(resize: ValidatedElementAndBounds, positionUpdate: Point): boolean {
        return true;
    }

    protected addResizeFeedback(
        resizeActions: ValidatedElementAndBounds[],
        handle: SResizeHandle,
        target: GModelElement,
        event: MouseEvent
    ): void {
        // handle feedback
        this.resizeFeedback.add(
            applyCssClasses(handle, ChangeBoundsListener.CSS_CLASS_ACTIVE),
            deleteCssClasses(handle, ChangeBoundsListener.CSS_CLASS_ACTIVE)
        );

        // cursor feedback
        const cursorClass = handle.isNeResize()
            ? CursorCSS.RESIZE_NE
            : handle.isNwResize()
              ? CursorCSS.RESIZE_NW
              : handle.isSeResize()
                ? CursorCSS.RESIZE_SE
                : CursorCSS.RESIZE_SW;
        this.resizeFeedback.add(cursorFeedbackAction(cursorClass), cursorFeedbackAction(CursorCSS.DEFAULT));

        // restriction feedback
        resizeActions.forEach(elementResize => {
            const element = handle.root.index.getById(elementResize.elementId);
            if (element && this.tool.movementRestrictor) {
                if (!elementResize.valid) {
                    this.resizeFeedback.add(createMovementRestrictionFeedback(element, this.tool.movementRestrictor), () =>
                        removeMovementRestrictionFeedback(element, this.tool.movementRestrictor!)
                    );
                } else {
                    this.resizeFeedback.add(removeMovementRestrictionFeedback(element, this.tool.movementRestrictor!));
                }
            }
        });
    }

    protected resetBoundsAction(): Action[] {
        // reset the bounds to the initial bounds and ensure that we do not show helper line feedback anymore (MoveFinishedEventAction)
        return this.initialBounds
            ? [SetBoundsFeedbackAction.create([this.initialBounds]), MoveFinishedEventAction.create()]
            : [MoveFinishedEventAction.create()];
    }

    override draggingMouseUp(target: GModelElement, _event: MouseEvent): Action[] {
        if (this.positionUpdater.isLastDragPositionUndefined()) {
            return [];
        }
        const actions: Action[] = [];
        if (this.activeResizeHandle) {
            actions.push(...this.handleResizeOnServer(this.activeResizeHandle));
        } else {
            actions.push(...this.handleMoveOnServer(target));
        }
        this.disposeAllButHandles();
        return actions;
    }

    override nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
        this.disposeAllButHandles();
        return super.nonDraggingMouseUp(element, event);
    }

    protected handleMoveOnServer(target: GModelElement): Action[] {
        const operations: Operation[] = [];
        operations.push(...this.handleMoveElementsOnServer(target));
        operations.push(...this.handleMoveRoutingPointsOnServer(target));
        return operations.length > 0 ? [CompoundOperation.create(operations)] : [];
    }

    protected handleMoveElementsOnServer(target: GModelElement): Operation[] {
        const selectedElements = getMatchingElements(target.index, isNonRoutableSelectedMovableBoundsAware);
        const selectionSet: Set<BoundsAwareModelElement> = new Set(selectedElements);
        const newBounds: ElementAndBounds[] = selectedElements
            .filter(element => this.isValidElement(element, selectionSet))
            .map(toElementAndBounds);
        return newBounds.length > 0 ? [ChangeBoundsOperation.create(newBounds)] : [];
    }

    protected isValidElement(element: BoundsAwareModelElement, selectedElements: Set<BoundsAwareModelElement> = new Set()): boolean {
        return (
            this.isValidMove(element, element.bounds) &&
            this.isValidSize(element, element.bounds) &&
            !this.isChildOfSelected(selectedElements, element)
        );
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

    protected handleMoveRoutingPointsOnServer(target: GModelElement): Operation[] {
        const newRoutingPoints: ElementAndRoutingPoints[] = [];
        const routerRegistry = this.tool.edgeRouterRegistry;
        if (routerRegistry) {
            //  If client routing is enabled -> delegate routing points of connected edges to server
            forEachElement(target.index, isNonRoutableSelectedMovableBoundsAware, element => {
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

    protected handleResizeOnServer(activeResizeHandle: SResizeHandle): Action[] {
        if (this.isValidElement(activeResizeHandle.parent) && this.initialBounds) {
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
        this.updateResizeElement(root);
        this.disposeAllButHandles();
    }

    protected isActiveResizeElement(element?: GModelElement): element is GParentElement & BoundsAware {
        return element !== undefined && this.activeResizeElement !== undefined && element.id === this.activeResizeElement.id;
    }

    protected handleResizeOnClient(positionUpdate: Point): ValidatedElementAndBounds[] {
        if (!this.activeResizeHandle) {
            return [];
        }

        if (this.isActiveResizeElement(this.activeResizeHandle.parent)) {
            switch (this.activeResizeHandle.location) {
                case ResizeHandleLocation.TopLeft:
                    return this.handleTopLeftResize(this.activeResizeHandle.parent, positionUpdate);
                case ResizeHandleLocation.TopRight:
                    return this.handleTopRightResize(this.activeResizeHandle.parent, positionUpdate);
                case ResizeHandleLocation.BottomLeft:
                    return this.handleBottomLeftResize(this.activeResizeHandle.parent, positionUpdate);
                case ResizeHandleLocation.BottomRight:
                    return this.handleBottomRightResize(this.activeResizeHandle.parent, positionUpdate);
            }
        }
        return [];
    }

    protected handleTopLeftResize(resizeElement: ResizableModelElement, positionUpdate: Point): ValidatedElementAndBounds[] {
        return this.createSetBoundsAction(
            resizeElement,
            { x: resizeElement.bounds.x + positionUpdate.x, y: resizeElement.bounds.y + positionUpdate.y },
            { width: resizeElement.bounds.width - positionUpdate.x, height: resizeElement.bounds.height - positionUpdate.y }
        );
    }

    protected handleTopRightResize(resizeElement: ResizableModelElement, positionUpdate: Point): ValidatedElementAndBounds[] {
        return this.createSetBoundsAction(
            resizeElement,
            { x: resizeElement.bounds.x, y: resizeElement.bounds.y + positionUpdate.y },
            { width: resizeElement.bounds.width + positionUpdate.x, height: resizeElement.bounds.height - positionUpdate.y }
        );
    }

    protected handleBottomLeftResize(resizeElement: ResizableModelElement, positionUpdate: Point): ValidatedElementAndBounds[] {
        return this.createSetBoundsAction(
            resizeElement,
            { x: resizeElement.bounds.x + positionUpdate.x, y: resizeElement.bounds.y },
            { width: resizeElement.bounds.width - positionUpdate.x, height: resizeElement.bounds.height + positionUpdate.y }
        );
    }

    protected handleBottomRightResize(resizeElement: ResizableModelElement, positionUpdate: Point): ValidatedElementAndBounds[] {
        return this.createSetBoundsAction(
            resizeElement,
            { x: resizeElement.bounds.x, y: resizeElement.bounds.y },
            { width: resizeElement.bounds.width + positionUpdate.x, height: resizeElement.bounds.height + positionUpdate.y }
        );
    }

    protected createSetBoundsAction(element: BoundsAwareModelElement, newPosition: Point, newSize: Dimension): ValidatedElementAndBounds[] {
        if (!isValidSize(element, newSize)) {
            // we are not allowing any invalid sizes (breaking min size), not even during client feedback
            return [];
        }
        const valid = this.isValidMove(element, newPosition);
        return [{ elementId: element.id, newPosition, newSize, valid }];
    }

    protected isValidSize(element: BoundsAwareModelElement, size: Dimension): boolean {
        return isValidSize(element, size);
    }

    protected isValidMove(element: BoundsAwareModelElement, newPosition: Point): boolean {
        return isValidMove(element, newPosition, this.tool.movementRestrictor);
    }

    protected disposeAllButHandles(): void {
        // We do not dispose the handle feedback as we want to keep showing the handles on selected elements
        // this.handleFeedback.dispose();
        this.resizeFeedback.dispose();
        this.positionUpdater.resetPosition();
        this.activeResizeElement = undefined;
        this.activeResizeHandle = undefined;
        this.initialBounds = undefined;
        super.dispose();
    }

    override dispose(): void {
        this.handleFeedback.dispose();
        this.disposeAllButHandles();
    }
}
