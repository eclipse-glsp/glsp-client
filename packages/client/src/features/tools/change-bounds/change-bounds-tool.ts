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
    Bounds,
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
    findParentByFeature,
    isSelected
} from '@eclipse-glsp/sprotty';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, applyCssClasses, cursorFeedbackAction, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { ISelectionListener, SelectionService } from '../../../base/selection-service';
import { PointPositionUpdater } from '../../../features/change-bounds/point-position-updater';
import {
    calcElementAndRoutingPoints,
    forEachElement,
    isNonRoutableSelectedMovableBoundsAware,
    toElementAndBounds
} from '../../../utils/gmodel-util';
import { isValidMove, isValidSize } from '../../../utils/layout-utils';
import { SetBoundsFeedbackAction } from '../../bounds/set-bounds-feedback-command';
import { Resizable, ResizeHandleLocation, SResizeHandle, isBoundsAwareMoveable, isResizable } from '../../change-bounds/model';
import {
    IMovementRestrictor,
    createMovementRestrictionFeedback,
    removeMovementRestrictionFeedback
} from '../../change-bounds/movement-restrictor';
import { PositionSnapper } from '../../change-bounds/position-snapper';
import { getDirectionFrom } from '../../helper-lines/model';
import { BaseEditTool } from '../base-tools';
import {
    FeedbackMoveMouseListener,
    HideChangeBoundsToolResizeFeedbackAction,
    ShowChangeBoundsToolResizeFeedbackAction
} from './change-bounds-tool-feedback';

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
            Disposable.create(() => this.deregisterFeedback(feedbackMoveMouseListener)),
            Disposable.create(() => this.deregisterFeedback(changeBoundsListener, [HideChangeBoundsToolResizeFeedbackAction.create()])),
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

export class ChangeBoundsListener extends DragAwareMouseListener implements ISelectionListener, Disposable {
    static readonly CSS_CLASS_ACTIVE = 'active';

    // members for calculating the correct position change
    protected initialBounds: Bounds | undefined;
    protected pointPositionUpdater: PointPositionUpdater;

    // members for resize mode
    protected activeResizeElement?: GModelElement;
    protected activeResizeHandle?: SResizeHandle;

    constructor(protected tool: ChangeBoundsTool) {
        super();
        this.pointPositionUpdater = new PointPositionUpdater(tool.positionSnapper);
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseDown(target, event);
        // If another button than the left mouse button was clicked or we are
        // still on the root element we don't need to execute the tool behavior
        if (event.button !== 0 || target instanceof GModelRoot) {
            return [];
        }
        // check if we have a resize handle (only single-selection)
        if (this.activeResizeElement && target instanceof SResizeHandle) {
            this.activeResizeHandle = target;
        } else {
            this.setActiveResizeElement(target);
        }
        if (this.activeResizeElement) {
            this.initPosition(event);
        } else {
            this.reset();
        }
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        super.mouseMove(target, event);
        if (this.isMouseDrag && this.activeResizeHandle) {
            // rely on the FeedbackMoveMouseListener to update the element bounds of selected elements
            // consider resize handles ourselves
            const actions: Action[] = [
                cursorFeedbackAction(this.activeResizeHandle.isNwSeResize() ? CursorCSS.RESIZE_NWSE : CursorCSS.RESIZE_NESW),
                applyCssClasses(this.activeResizeHandle, ChangeBoundsListener.CSS_CLASS_ACTIVE)
            ];
            const positionUpdate = this.pointPositionUpdater.updatePosition(
                target,
                event,
                getDirectionFrom(this.activeResizeHandle.location)
            );
            if (positionUpdate) {
                const resizeActions = this.handleResizeOnClient(positionUpdate);
                actions.push(...resizeActions);
            }
            this.tool.registerFeedback(actions, this);
        }
        return [];
    }

    override draggingMouseUp(target: GModelElement, _event: MouseEvent): Action[] {
        if (this.pointPositionUpdater.isLastDragPositionUndefined()) {
            this.resetPosition();
            return [];
        }
        const actions: Action[] = [];

        if (this.activeResizeHandle) {
            // Resize
            actions.push(...this.handleResize(this.activeResizeHandle));
        } else {
            // Move
            actions.push(...this.handleMoveOnServer(target));
        }
        this.resetPosition();
        this.tool.deregisterFeedback(this, [cursorFeedbackAction(CursorCSS.DEFAULT)]);
        return actions;
    }

    protected handleMoveOnServer(target: GModelElement): Action[] {
        const operations: Operation[] = [];

        operations.push(...this.handleMoveElementsOnServer(target));
        operations.push(...this.handleMoveRoutingPointsOnServer(target));
        if (operations.length > 0) {
            return [CompoundOperation.create(operations)];
        }
        return operations;
    }

    protected handleMoveElementsOnServer(target: GModelElement): Operation[] {
        const result: Operation[] = [];
        const newBounds: ElementAndBounds[] = [];
        const selectedElements: (GModelElement & BoundsAware)[] = [];
        forEachElement(target.index, isNonRoutableSelectedMovableBoundsAware, element => {
            selectedElements.push(element);
        });

        const selectionSet: Set<GModelElement & BoundsAware> = new Set(selectedElements);
        selectedElements
            .filter(element => !this.isChildOfSelected(selectionSet, element))
            .map(element => this.createElementAndBounds(element))
            .forEach(bounds => newBounds.push(...bounds));

        if (newBounds.length > 0) {
            result.push(ChangeBoundsOperation.create(newBounds));
        }
        return result;
    }

    protected isChildOfSelected(selectedElements: Set<GModelElement>, element: GModelElement): boolean {
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

    protected handleResize(activeResizeHandle: SResizeHandle): Action[] {
        const actions: Action[] = [];
        actions.push(cursorFeedbackAction(CursorCSS.DEFAULT));
        actions.push(deleteCssClasses(activeResizeHandle, ChangeBoundsListener.CSS_CLASS_ACTIVE));
        const resizeElement = findParentByFeature(activeResizeHandle, isResizable);
        if (this.isActiveResizeElement(resizeElement)) {
            this.createChangeBoundsAction(resizeElement).forEach(action => actions.push(action));
        }
        return actions;
    }

    selectionChanged(root: GModelRoot, selectedElements: string[]): void {
        if (this.activeResizeElement) {
            if (selectedElements.includes(this.activeResizeElement.id)) {
                // our active element is still selected, nothing to do
                return;
            }

            // try to find some other selected element and mark that active
            for (const elementId of selectedElements.reverse()) {
                const element = root.index.getById(elementId);
                if (element && this.setActiveResizeElement(element)) {
                    return;
                }
            }
            this.reset();
        }
    }

    protected setActiveResizeElement(target: GModelElement): boolean {
        // check if we have a selected, moveable element (multi-selection allowed)
        const moveableElement = findParentByFeature(target, isBoundsAwareMoveable);
        if (isSelected(moveableElement)) {
            // only allow one element to have the element resize handles
            this.activeResizeElement = moveableElement;
            if (isResizable(this.activeResizeElement)) {
                this.tool.registerFeedback(
                    [ShowChangeBoundsToolResizeFeedbackAction.create(this.activeResizeElement.id)],
                    this.activeResizeElement
                );
            }
            return true;
        }
        return false;
    }

    protected isActiveResizeElement(element?: GModelElement): element is GParentElement & BoundsAware {
        return element !== undefined && this.activeResizeElement !== undefined && element.id === this.activeResizeElement.id;
    }

    protected initPosition(event: MouseEvent): void {
        this.pointPositionUpdater.updateLastDragPosition(event);
        if (this.activeResizeHandle) {
            const resizeElement = findParentByFeature(this.activeResizeHandle, isResizable);
            this.initialBounds = {
                x: resizeElement!.bounds.x,
                y: resizeElement!.bounds.y,
                width: resizeElement!.bounds.width,
                height: resizeElement!.bounds.height
            };
        }
    }

    dispose(): void {
        this.reset(true);
    }

    protected reset(resetBounds = false): void {
        this.resetFeedback(resetBounds);
        this.resetPosition();
    }

    protected resetFeedback(resetBounds = false): void {
        const resetFeedback: Action[] = [];
        if (this.activeResizeElement && isResizable(this.activeResizeElement)) {
            if (this.initialBounds && this.activeResizeHandle && resetBounds) {
                // we only reset the bounds if an active resize operation was cancelled due to the tool being disabled
                resetFeedback.push(
                    SetBoundsFeedbackAction.create([
                        {
                            elementId: this.activeResizeElement.id,
                            newPosition: this.initialBounds,
                            newSize: this.initialBounds
                        }
                    ])
                );
            }
            this.tool.deregisterFeedback(this.activeResizeElement, [HideChangeBoundsToolResizeFeedbackAction.create()]);
        }
        resetFeedback.push(cursorFeedbackAction(CursorCSS.DEFAULT));
        this.tool.deregisterFeedback(this, resetFeedback);
    }

    protected resetPosition(): void {
        this.activeResizeHandle = undefined;
        this.pointPositionUpdater.resetPosition();
    }

    protected handleResizeOnClient(positionUpdate: Point): Action[] {
        if (!this.activeResizeHandle) {
            return [];
        }

        const resizeElement = findParentByFeature(this.activeResizeHandle, isResizable);
        if (this.isActiveResizeElement(resizeElement)) {
            switch (this.activeResizeHandle.location) {
                case ResizeHandleLocation.TopLeft:
                    return this.handleTopLeftResize(resizeElement, positionUpdate);
                case ResizeHandleLocation.TopRight:
                    return this.handleTopRightResize(resizeElement, positionUpdate);
                case ResizeHandleLocation.BottomLeft:
                    return this.handleBottomLeftResize(resizeElement, positionUpdate);
                case ResizeHandleLocation.BottomRight:
                    return this.handleBottomRightResize(resizeElement, positionUpdate);
            }
        }
        return [];
    }

    protected handleTopLeftResize(resizeElement: GParentElement & Resizable, positionUpdate: Point): Action[] {
        return this.createSetBoundsAction(
            resizeElement,
            resizeElement.bounds.x + positionUpdate.x,
            resizeElement.bounds.y + positionUpdate.y,
            resizeElement.bounds.width - positionUpdate.x,
            resizeElement.bounds.height - positionUpdate.y
        );
    }

    protected handleTopRightResize(resizeElement: GParentElement & Resizable, positionUpdate: Point): Action[] {
        return this.createSetBoundsAction(
            resizeElement,
            resizeElement.bounds.x,
            resizeElement.bounds.y + positionUpdate.y,
            resizeElement.bounds.width + positionUpdate.x,
            resizeElement.bounds.height - positionUpdate.y
        );
    }

    protected handleBottomLeftResize(resizeElement: GParentElement & Resizable, positionUpdate: Point): Action[] {
        return this.createSetBoundsAction(
            resizeElement,
            resizeElement.bounds.x + positionUpdate.x,
            resizeElement.bounds.y,
            resizeElement.bounds.width - positionUpdate.x,
            resizeElement.bounds.height + positionUpdate.y
        );
    }

    protected handleBottomRightResize(resizeElement: GParentElement & Resizable, positionUpdate: Point): Action[] {
        return this.createSetBoundsAction(
            resizeElement,
            resizeElement.bounds.x,
            resizeElement.bounds.y,
            resizeElement.bounds.width + positionUpdate.x,
            resizeElement.bounds.height + positionUpdate.y
        );
    }

    protected createChangeBoundsAction(element: GModelElement & BoundsAware): Action[] {
        if (this.isValidBoundChange(element, element.bounds, element.bounds)) {
            return [ChangeBoundsOperation.create([toElementAndBounds(element)])];
        } else if (this.initialBounds) {
            const actions: Action[] = [];
            if (this.tool.movementRestrictor) {
                actions.push(removeMovementRestrictionFeedback(element, this.tool.movementRestrictor));
            }
            actions.push(
                SetBoundsFeedbackAction.create([{ elementId: element.id, newPosition: this.initialBounds, newSize: this.initialBounds }])
            );
            return actions;
        }
        return [];
    }

    protected createElementAndBounds(element: GModelElement & BoundsAware): ElementAndBounds[] {
        if (this.isValidBoundChange(element, element.bounds, element.bounds)) {
            return [toElementAndBounds(element)];
        }
        return [];
    }

    protected createSetBoundsAction(element: GModelElement & BoundsAware, x: number, y: number, width: number, height: number): Action[] {
        const newPosition = { x, y };
        const newSize = { width, height };
        const result: Action[] = [];

        if (this.isValidBoundChange(element, newPosition, newSize)) {
            if (this.tool.movementRestrictor) {
                result.push(removeMovementRestrictionFeedback(element, this.tool.movementRestrictor));
            }
            result.push(SetBoundsFeedbackAction.create([{ elementId: element.id, newPosition, newSize }]));
        } else if (this.isValidSize(element, newSize)) {
            if (this.tool.movementRestrictor) {
                result.push(createMovementRestrictionFeedback(element, this.tool.movementRestrictor));
            }
            result.push(SetBoundsFeedbackAction.create([{ elementId: element.id, newPosition, newSize }]));
        }

        return result;
    }

    protected isValidBoundChange(element: GModelElement & BoundsAware, newPosition: Point, newSize: Dimension): boolean {
        return this.isValidSize(element, newSize) && this.isValidMove(element, newPosition);
    }

    protected isValidSize(element: GModelElement & BoundsAware, size: Dimension): boolean {
        return isValidSize(element, size);
    }

    protected isValidMove(element: GModelElement & BoundsAware, newPosition: Point): boolean {
        return isValidMove(element, newPosition, this.tool.movementRestrictor);
    }
}
