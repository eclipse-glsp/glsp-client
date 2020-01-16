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
    AnchorComputerRegistry,
    canEditRouting,
    Connectable,
    EdgeRouterRegistry,
    findParentByFeature,
    isConnectable,
    isSelected,
    MouseListener,
    SModelElement,
    SModelRoot,
    SRoutableElement,
    SRoutingHandle,
    Tool
} from "sprotty/lib";

import { GLSP_TYPES } from "../../types";
import { isRoutable, isRoutingHandle } from "../../utils/smodel-util";
import { IMouseTool } from "../mouse-tool/mouse-tool";
import { ChangeRoutingPointsOperation, ReconnectConnectionOperationAction } from "../operation/operation-actions";
import {
    isReconnectable,
    isReconnectHandle,
    isSourceRoutingHandle,
    isTargetRoutingHandle,
    SReconnectHandle
} from "../reconnect/model";
import { SelectionListener, SelectionService } from "../select/selection-service";
import { DrawFeedbackEdgeAction, feedbackEdgeId, RemoveFeedbackEdgeAction } from "../tool-feedback/creation-tool-feedback";
import { ApplyCursorCSSFeedbackAction, CursorCSS } from "../tool-feedback/cursor-feedback";
import {
    DrawFeedbackEdgeSourceAction,
    FeedbackEdgeRouteMovingMouseListener,
    FeedbackEdgeSourceMovingMouseListener,
    FeedbackEdgeTargetMovingMouseListener,
    HideEdgeReconnectHandlesFeedbackAction,
    ShowEdgeReconnectHandlesFeedbackAction,
    SwitchRoutingModeAction
} from "../tool-feedback/edge-edit-tool-feedback";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";

@injectable()
export class EdgeEditTool implements Tool {
    static ID = "glsp.edge-edit-tool";
    readonly id = EdgeEditTool.ID;

    protected feedbackEdgeSourceMovingListener: FeedbackEdgeSourceMovingMouseListener;
    protected feedbackEdgeTargetMovingListener: FeedbackEdgeTargetMovingMouseListener;
    protected feedbackMovingListener: FeedbackEdgeRouteMovingMouseListener;
    protected reconnectEdgeListener: ReconnectEdgeListener;

    constructor(@inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService,
        @inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher,
        @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry,
        @inject(EdgeRouterRegistry) @optional() protected edgeRouterRegistry?: EdgeRouterRegistry) {
    }

    enable(): void {
        this.reconnectEdgeListener = new ReconnectEdgeListener(this);
        this.mouseTool.register(this.reconnectEdgeListener);
        this.selectionService.register(this.reconnectEdgeListener);

        // install feedback move mouse listener for client-side move updates
        this.feedbackEdgeSourceMovingListener = new FeedbackEdgeSourceMovingMouseListener(this.anchorRegistry);
        this.feedbackEdgeTargetMovingListener = new FeedbackEdgeTargetMovingMouseListener(this.anchorRegistry);
        this.feedbackMovingListener = new FeedbackEdgeRouteMovingMouseListener(this.edgeRouterRegistry);
        this.mouseTool.register(this.feedbackEdgeSourceMovingListener);
        this.mouseTool.register(this.feedbackEdgeTargetMovingListener);
        this.mouseTool.register(this.feedbackMovingListener);
    }

    disable(): void {
        this.reconnectEdgeListener.reset();
        this.selectionService.deregister(this.reconnectEdgeListener);
        this.mouseTool.deregister(this.feedbackEdgeSourceMovingListener);
        this.mouseTool.deregister(this.feedbackEdgeTargetMovingListener);
        this.mouseTool.deregister(this.feedbackMovingListener);
        this.mouseTool.deregister(this.reconnectEdgeListener);
    }

    dispatchFeedback(actions: Action[]) {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }
}

class ReconnectEdgeListener extends MouseListener implements SelectionListener {
    protected isMouseDown: boolean;

    // active selection data
    protected edge?: SRoutableElement;
    protected routingHandle?: SRoutingHandle;

    // new connectable (source or target) for edge
    protected newConnectable?: SModelElement & Connectable;

    // active reconnect handle data
    protected reconnectMode?: 'NEW_SOURCE' | 'NEW_TARGET';

    constructor(protected tool: EdgeEditTool) {
        super();
    }

    protected isValidEdge(edge?: SRoutableElement): edge is SRoutableElement {
        return edge !== undefined && edge.id !== feedbackEdgeId(edge.root) && isSelected(edge);
    }

    protected setEdgeSelected(edge: SRoutableElement) {
        if (this.edge && this.edge.id !== edge.id) {
            // reset from a previously selected edge
            this.reset();
        }

        this.edge = edge;
        // note: order is important here as we want the reconnect handles to cover the routing handles
        const feedbackActions = [];
        if (canEditRouting(edge)) {
            feedbackActions.push(new SwitchRoutingModeAction([this.edge.id], []));
        }
        if (isReconnectable(edge)) {
            feedbackActions.push(new ShowEdgeReconnectHandlesFeedbackAction(this.edge.id));
        }
        this.tool.dispatchFeedback(feedbackActions);
    }

    protected isEdgeSelected(): boolean {
        return this.edge !== undefined && isSelected(this.edge);
    }

    protected setReconnectHandleSelected(edge: SRoutableElement, reconnectHandle: SReconnectHandle) {
        if (this.edge && this.edge.target && this.edge.source) {
            if (isSourceRoutingHandle(edge, reconnectHandle)) {
                this.tool.dispatchFeedback([new HideEdgeReconnectHandlesFeedbackAction(),
                new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_RECONNECT),
                new DrawFeedbackEdgeSourceAction(this.edge.type, this.edge.targetId)]);
                this.reconnectMode = "NEW_SOURCE";
            } else if (isTargetRoutingHandle(edge, reconnectHandle)) {
                this.tool.dispatchFeedback([new HideEdgeReconnectHandlesFeedbackAction(),
                new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_CREATION_TARGET),
                new DrawFeedbackEdgeAction(this.edge.type, this.edge.sourceId)]);
                this.reconnectMode = "NEW_TARGET";
            }
        }
    }

    protected isReconnecting(): boolean {
        return this.reconnectMode !== undefined;
    }

    protected isReconnectingNewSource(): boolean {
        return this.reconnectMode === "NEW_SOURCE";
    }

    protected setRoutingHandleSelected(edge: SRoutableElement, routingHandle: SRoutingHandle) {
        if (this.edge && this.edge.target && this.edge.source) {
            this.routingHandle = routingHandle;
        }
    }

    protected requiresReconnect(sourceId: string, targetId: string): boolean {
        return this.edge !== undefined && (this.edge.sourceId !== sourceId || this.edge.targetId !== targetId);
    }

    protected setNewConnectable(connectable?: SModelElement & Connectable) {
        this.newConnectable = connectable;
    }

    protected isReadyToReconnect() {
        return this.edge && this.isReconnecting() && this.newConnectable !== undefined;
    }

    protected isReadyToReroute() {
        return this.routingHandle !== undefined;
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        this.isMouseDown = true;
        if (event.button === 0) {
            const reconnectHandle = findParentByFeature(target, isReconnectHandle);
            const routingHandle = !reconnectHandle ? findParentByFeature(target, isRoutingHandle) : undefined;
            const edge = findParentByFeature(target, isRoutable);
            if (this.isEdgeSelected() && edge && reconnectHandle) {
                // PHASE 2 Reconnect: Select reconnect handle on selected edge
                this.setReconnectHandleSelected(edge, reconnectHandle);
            } else if (this.isEdgeSelected() && edge && routingHandle) {
                // PHASE 2 Reroute: Select routing handle on selected edge
                this.setRoutingHandleSelected(edge, routingHandle);
            } else if (this.isValidEdge(edge)) {
                // PHASE 1: Select edge
                this.setEdgeSelected(edge);
            }
        } else if (event.button === 2) {
            this.reset();
        }
        return result;
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (this.isMouseDown) {
            // reset any selected connectables when we are dragging, maybe the user is just panning
            this.setNewConnectable(undefined);
        }
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        this.isMouseDown = false;
        if (!this.isReadyToReconnect() && !this.isReadyToReroute()) {
            return [];
        }

        const result: Action[] = [];
        if (this.edge && this.newConnectable) {
            const sourceId = this.isReconnectingNewSource() ? this.newConnectable.id : this.edge.sourceId;
            const targetId = this.isReconnectingNewSource() ? this.edge.targetId : this.newConnectable.id;
            if (this.requiresReconnect(sourceId, targetId)) {
                result.push(new ReconnectConnectionOperationAction(this.edge.id, sourceId, targetId));
            }
            this.reset();
        } else if (this.edge && this.routingHandle) {
            // we need to re-retrieve the edge as it might have changed due to a server udpate since we do not reset the state between reroute actions
            const latestEdge = target.index.getById(this.edge.id);
            if (latestEdge && isRoutable(latestEdge)) {
                result.push(new ChangeRoutingPointsOperation([{ elementId: latestEdge.id, newRoutingPoints: latestEdge.routingPoints }]));
                this.routingHandle = undefined;
            }
        }
        return result;
    }

    mouseOver(target: SModelElement, event: MouseEvent): Action[] {
        if (this.edge && this.isReconnecting()) {
            const currentTarget = findParentByFeature(target, isConnectable);
            if (!this.newConnectable || currentTarget !== this.newConnectable) {
                this.setNewConnectable(currentTarget);
                if (currentTarget) {
                    if ((this.reconnectMode === 'NEW_SOURCE' && currentTarget.canConnect(this.edge, "source")) ||
                        (this.reconnectMode === 'NEW_TARGET' && currentTarget.canConnect(this.edge, "target"))) {

                        this.tool.dispatchFeedback([new ApplyCursorCSSFeedbackAction(CursorCSS.EDGE_RECONNECT)]);
                        return [];
                    }
                }
                this.tool.dispatchFeedback([new ApplyCursorCSSFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)]);
            }
        }
        return [];
    }

    selectionChanged(root: Readonly<SModelRoot>, selectedElements: string[]): void {
        if (this.edge) {
            if (selectedElements.indexOf(this.edge.id) > -1) {
                // our active edge is still selected, nothing to do
                return;
            }

            if (this.isReconnecting()) {
                // we are reconnecting, so we may have clicked on a potential target
                return;
            }

            // try to find some other selected element and mark that active
            for (const elementId of selectedElements.reverse()) {
                const element = root.index.getById(elementId);
                if (element) {
                    const edge = findParentByFeature(element, isRoutable);
                    if (this.isValidEdge(edge)) {
                        // PHASE 1: Select edge
                        this.setEdgeSelected(edge);
                        return;
                    }
                }
            }

            this.reset();
        }
    }

    public reset() {
        this.resetFeedback();
        this.resetData();
    }

    protected resetData() {
        this.isMouseDown = false;
        this.edge = undefined;
        this.reconnectMode = undefined;
        this.newConnectable = undefined;
        this.routingHandle = undefined;
    }

    protected resetFeedback() {
        const result: Action[] = [];
        if (this.edge) {
            result.push(new SwitchRoutingModeAction([], [this.edge.id]));
        }
        result.push(...[new HideEdgeReconnectHandlesFeedbackAction(),
        new ApplyCursorCSSFeedbackAction(), new RemoveFeedbackEdgeAction()]);
        this.tool.dispatchFeedback(result);
    }
}
