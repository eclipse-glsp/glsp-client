/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable, optional } from "inversify";
import {
    Action,
    BoundsAware,
    Dimension,
    EdgeRouterRegistry,
    ElementAndBounds,
    findParentByFeature,
    isSelected,
    isViewport,
    KeyTool,
    ModelLayoutOptions,
    MouseListener,
    Point,
    SConnectableElement,
    SetBoundsAction,
    SModelElement,
    SModelRoot,
    SParentElement,
    Tool
} from "sprotty/lib";

import { GLSP_TYPES } from "../../types";
import {
    forEachElement,
    isNonRoutableSelectedMovableBoundsAware,
    toElementAndBounds,
    toElementAndRoutingPoints
} from "../../utils/smodel-util";
import { isBoundsAwareMoveable, isResizable, ResizeHandleLocation, SResizeHandle } from "../change-bounds/model";
import { IMovementRestrictor } from "../change-bounds/movement-restrictor";
import { IMouseTool } from "../mouse-tool/mouse-tool";
import {
    ChangeBoundsOperationAction,
    ChangeRoutingPointsOperation,
    ElementAndRoutingPoints
} from "../operation/operation-actions";
import { SelectionListener, SelectionService } from "../select/selection-service";
import {
    FeedbackMoveMouseListener,
    HideChangeBoundsToolResizeFeedbackAction,
    ShowChangeBoundsToolResizeFeedbackAction
} from "../tool-feedback/change-bounds-tool-feedback";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";

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
 * To provide a visual client updates during move we install the `FeedbackMoveMouseListener` and to provide visual client updates during resize
 * and send the server updates we install the `ChangeBoundsListener`.
 */
@injectable()
export class ChangeBoundsTool implements Tool {
    static ID = "glsp.change-bounds-tool";
    readonly id = ChangeBoundsTool.ID;

    protected feedbackMoveMouseListener: MouseListener;
    protected changeBoundsListener: MouseListener & SelectionListener;

    constructor(@inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService,
        @inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool,
        @inject(KeyTool) protected keyTool: KeyTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher,
        @inject(EdgeRouterRegistry) @optional() readonly edgeRouterRegistry?: EdgeRouterRegistry,
        @inject(GLSP_TYPES.IMovementRestrictor) @optional() protected movementRestrictor?: IMovementRestrictor) { }

    enable() {
        // install feedback move mouse listener for client-side move updates
        this.feedbackMoveMouseListener = this.createMoveMouseListener();
        this.mouseTool.register(this.feedbackMoveMouseListener);

        // install change bounds listener for client-side resize updates and server-side updates
        this.changeBoundsListener = this.createChangeBoundsListener();
        this.mouseTool.register(this.changeBoundsListener);
        this.selectionService.register(this.changeBoundsListener);

        // register feedback
        this.feedbackDispatcher.registerFeedback(this, [new ShowChangeBoundsToolResizeFeedbackAction]);
    }

    protected createMoveMouseListener(): MouseListener {
        return new FeedbackMoveMouseListener(this.movementRestrictor);
    }

    protected createChangeBoundsListener(): MouseListener & SelectionListener {
        return new ChangeBoundsListener(this);
    }

    disable() {
        this.mouseTool.deregister(this.changeBoundsListener);
        this.selectionService.deregister(this.changeBoundsListener);
        this.mouseTool.deregister(this.feedbackMoveMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [new HideChangeBoundsToolResizeFeedbackAction]);
    }

    dispatchFeedback(actions: Action[]) {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }
}

export class ChangeBoundsListener extends MouseListener implements SelectionListener {
    // members for calculating the correct position change
    protected lastDragPosition?: Point;
    protected positionDelta: Point = { x: 0, y: 0 };

    // members for resize mode
    protected activeResizeElementId?: string;
    protected activeResizeHandle?: SResizeHandle;

    constructor(protected tool: ChangeBoundsTool) {
        super();
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if (event.button !== 0) {
            return [];
        }
        // check if we have a resize handle (only single-selection)
        if (this.activeResizeElementId && target instanceof SResizeHandle) {
            this.activeResizeHandle = target;
        } else {
            this.setActiveResizeElement(target);
        }
        if (this.activeResizeElementId) {
            this.initPosition(event);
        } else {
            this.reset();
        }
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (this.updatePosition(target, event)) {
            // rely on the FeedbackMoveMouseListener to update the element bounds of selected elements
            // consider resize handles ourselves
            return this.handleElementResize();
        }
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        if (this.lastDragPosition === undefined) {
            this.resetPosition();
            return [];
        }

        const actions: Action[] = [];
        if (this.activeResizeHandle) {
            // Resize, not move
            const resizeElement = findParentByFeature(this.activeResizeHandle, isResizable);
            if (this.isActiveResizeElement(resizeElement)) {
                this.createChangeBoundsAction(resizeElement).forEach(action => actions.push(action));
            }
        } else {
            // Move
            const newBounds: ElementAndBounds[] = [];
            const newRoutingPoints: ElementAndRoutingPoints[] = [];
            forEachElement(target, isNonRoutableSelectedMovableBoundsAware, element => {
                this.createElementAndBounds(element).forEach(bounds => newBounds.push(bounds));
                //  If client routing is enabled -> delegate routingpoints of connected edges to server
                if (this.tool.edgeRouterRegistry && element instanceof SConnectableElement) {
                    element.incomingEdges.map(toElementAndRoutingPoints).forEach(ear => newRoutingPoints.push(ear));
                    element.outgoingEdges.map(toElementAndRoutingPoints).forEach(ear => newRoutingPoints.push(ear));
                }
            });

            if (newBounds.length > 0) {
                actions.push(new ChangeBoundsOperationAction(newBounds));
            }
            if (newRoutingPoints.length > 0) {
                actions.push(new ChangeRoutingPointsOperation(newRoutingPoints));
            }
        }
        this.resetPosition();
        return actions;
    }

    selectionChanged(root: SModelRoot, selectedElements: string[]): void {
        if (this.activeResizeElementId) {
            if (selectedElements.includes(this.activeResizeElementId)) {
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

    protected setActiveResizeElement(target: SModelElement): boolean {
        // check if we have a selected, moveable element (multi-selection allowed)
        const moveableElement = findParentByFeature(target, isBoundsAwareMoveable);
        if (isSelected(moveableElement)) {
            // only allow one element to have the element resize handles
            this.activeResizeElementId = moveableElement.id;
            this.tool.dispatchFeedback([new ShowChangeBoundsToolResizeFeedbackAction(this.activeResizeElementId)]);
            return true;
        }
        return false;
    }

    protected isActiveResizeElement(element?: SModelElement): element is SParentElement & BoundsAware {
        return element !== undefined && element.id === this.activeResizeElementId;
    }

    protected initPosition(event: MouseEvent) {
        this.lastDragPosition = { x: event.pageX, y: event.pageY };
    }

    protected updatePosition(target: SModelElement, event: MouseEvent): boolean {
        if (this.lastDragPosition) {
            const viewport = findParentByFeature(target, isViewport);
            const zoom = viewport ? viewport.zoom : 1;
            const dx = (event.pageX - this.lastDragPosition.x) / zoom;
            const dy = (event.pageY - this.lastDragPosition.y) / zoom;

            this.positionDelta = { x: dx, y: dy };
            this.lastDragPosition = { x: event.pageX, y: event.pageY };
            return true;
        }
        return false;
    }

    protected reset() {
        this.tool.dispatchFeedback([new HideChangeBoundsToolResizeFeedbackAction()]);
        this.resetPosition();
    }

    protected resetPosition() {
        this.activeResizeHandle = undefined;
        this.lastDragPosition = undefined;
        this.positionDelta = { x: 0, y: 0 };
    }

    protected handleElementResize(): Action[] {
        if (!this.activeResizeHandle) {
            return [];
        }

        const actions: Action[] = [];
        const resizeElement = findParentByFeature(this.activeResizeHandle, isResizable);
        if (this.isActiveResizeElement(resizeElement)) {
            switch (this.activeResizeHandle.location) {
                case ResizeHandleLocation.TopLeft:
                    this.createSetBoundsAction(resizeElement,
                        resizeElement.bounds.x + this.positionDelta.x,
                        resizeElement.bounds.y + this.positionDelta.y,
                        resizeElement.bounds.width - this.positionDelta.x,
                        resizeElement.bounds.height - this.positionDelta.y)
                        .forEach(action => actions.push(action));
                    break;
                case ResizeHandleLocation.TopRight:
                    this.createSetBoundsAction(resizeElement,
                        resizeElement.bounds.x,
                        resizeElement.bounds.y + this.positionDelta.y,
                        resizeElement.bounds.width + this.positionDelta.x,
                        resizeElement.bounds.height - this.positionDelta.y)
                        .forEach(action => actions.push(action));
                    break;
                case ResizeHandleLocation.BottomLeft:
                    this.createSetBoundsAction(resizeElement,
                        resizeElement.bounds.x + this.positionDelta.x,
                        resizeElement.bounds.y,
                        resizeElement.bounds.width - this.positionDelta.x,
                        resizeElement.bounds.height + this.positionDelta.y)
                        .forEach(action => actions.push(action));
                    break;
                case ResizeHandleLocation.BottomRight:
                    this.createSetBoundsAction(resizeElement,
                        resizeElement.bounds.x,
                        resizeElement.bounds.y,
                        resizeElement.bounds.width + this.positionDelta.x,
                        resizeElement.bounds.height + this.positionDelta.y)
                        .forEach(action => actions.push(action));
                    break;
            }
        }
        return actions;
    }

    protected createChangeBoundsAction(element: SModelElement & BoundsAware): Action[] {
        if (this.isValidBoundChange(element, element.bounds, element.bounds)) {
            return [new ChangeBoundsOperationAction([toElementAndBounds(element)])];
        }
        return [];
    }

    protected createElementAndBounds(element: SModelElement & BoundsAware): ElementAndBounds[] {
        if (this.isValidBoundChange(element, element.bounds, element.bounds)) {
            return [toElementAndBounds(element)];
        }
        return [];
    }

    protected createSetBoundsAction(element: SModelElement & BoundsAware, x: number, y: number, width: number, height: number): Action[] {
        const newPosition = { x, y };
        const newSize = { width, height };
        if (this.isValidBoundChange(element, newPosition, newSize)) {
            return [new SetBoundsAction([{ elementId: element.id, newPosition, newSize }])];

        }
        return [];
    }

    protected isValidBoundChange(element: SModelElement & BoundsAware, newPosition: Point, newSize: Dimension): boolean {
        return newSize.width >= this.minWidth(element) && newSize.height >= this.minHeight(element);
    }

    protected minWidth(element: SModelElement & BoundsAware): number {
        const layoutOptions = this.getLayoutOptions(element);
        if (layoutOptions !== undefined && typeof layoutOptions.minWidth === 'number') {
            return layoutOptions.minWidth;
        }
        return 1;
    }

    protected minHeight(element: SModelElement & BoundsAware): number {
        const layoutOptions = this.getLayoutOptions(element);
        if (layoutOptions !== undefined && typeof layoutOptions.minHeight === 'number') {
            return layoutOptions.minHeight;
        }
        return 1;
    }

    protected getLayoutOptions(element: SModelElement): ModelLayoutOptions | undefined {
        const layoutOptions = (element as any).layoutOptions;
        if (layoutOptions !== undefined) {
            return layoutOptions as ModelLayoutOptions;
        }
        return undefined;
    }
}
