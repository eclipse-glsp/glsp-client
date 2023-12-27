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
import {
    Action,
    AnchorComputerRegistry,
    ChangeRoutingPointsOperation,
    Connectable,
    Disposable,
    EdgeRouterRegistry,
    GModelElement,
    GModelRoot,
    GRoutableElement,
    GRoutingHandle,
    ReconnectEdgeOperation,
    canEditRouting,
    findParentByFeature,
    isConnectable,
    isSelected
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { ISelectionListener, SelectionService } from '../../../base/selection-service';
import { calcElementAndRoutingPoints, isRoutable, isRoutingHandle } from '../../../utils/gmodel-util';
import { PositionSnapper } from '../../change-bounds/position-snapper';
import { GReconnectHandle, isReconnectHandle, isReconnectable, isSourceRoutingHandle, isTargetRoutingHandle } from '../../reconnect/model';
import { BaseEditTool } from '../base-tools';
import { DrawFeedbackEdgeAction, RemoveFeedbackEdgeAction, feedbackEdgeId } from '../edge-creation/dangling-edge-feedback';
import {
    DrawFeedbackEdgeSourceAction,
    FeedbackEdgeRouteMovingMouseListener,
    FeedbackEdgeSourceMovingMouseListener,
    FeedbackEdgeTargetMovingMouseListener,
    HideEdgeReconnectHandlesFeedbackAction,
    ShowEdgeReconnectHandlesFeedbackAction,
    SwitchRoutingModeAction
} from './edge-edit-tool-feedback';

@injectable()
export class EdgeEditTool extends BaseEditTool {
    static ID = 'glsp.edge-edit-tool';

    @inject(SelectionService) protected selectionService: SelectionService;
    @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry;
    @inject(EdgeRouterRegistry) @optional() readonly edgeRouterRegistry?: EdgeRouterRegistry;
    @inject(PositionSnapper) readonly positionSnapper: PositionSnapper;

    protected feedbackEdgeSourceMovingListener: FeedbackEdgeSourceMovingMouseListener;
    protected feedbackEdgeTargetMovingListener: FeedbackEdgeTargetMovingMouseListener;
    protected feedbackMovingListener: FeedbackEdgeRouteMovingMouseListener;
    protected edgeEditListener: EdgeEditListener;

    get id(): string {
        return EdgeEditTool.ID;
    }

    enable(): void {
        this.edgeEditListener = new EdgeEditListener(this);

        // install feedback move mouse listener for client-side move updates
        this.feedbackEdgeSourceMovingListener = new FeedbackEdgeSourceMovingMouseListener(this.anchorRegistry, this.feedbackDispatcher);
        this.feedbackEdgeTargetMovingListener = new FeedbackEdgeTargetMovingMouseListener(this.anchorRegistry, this.feedbackDispatcher);
        this.feedbackMovingListener = new FeedbackEdgeRouteMovingMouseListener(this.positionSnapper, this.edgeRouterRegistry);

        this.toDisposeOnDisable.push(
            Disposable.create(() => this.edgeEditListener.reset()),
            this.mouseTool.registerListener(this.edgeEditListener),
            this.feedbackEdgeSourceMovingListener,
            this.feedbackEdgeTargetMovingListener,
            this.selectionService.onSelectionChanged(change => this.edgeEditListener.selectionChanged(change.root, change.selectedElements))
        );
    }

    registerFeedbackListeners(): void {
        this.mouseTool.register(this.feedbackMovingListener);
        this.mouseTool.register(this.feedbackEdgeSourceMovingListener);
        this.mouseTool.register(this.feedbackEdgeTargetMovingListener);
    }

    deregisterFeedbackListeners(): void {
        this.feedbackEdgeSourceMovingListener.dispose();
        this.feedbackEdgeTargetMovingListener.dispose();
        this.mouseTool.deregister(this.feedbackEdgeSourceMovingListener);
        this.mouseTool.deregister(this.feedbackEdgeTargetMovingListener);
        this.mouseTool.deregister(this.feedbackMovingListener);
    }
}

export class EdgeEditListener extends DragAwareMouseListener implements ISelectionListener {
    // active selection data
    protected edge?: GRoutableElement;
    protected routingHandle?: GRoutingHandle;

    // new connectable (source or target) for edge
    protected newConnectable?: GModelElement & Connectable;

    // active reconnect handle data
    protected reconnectMode?: 'NEW_SOURCE' | 'NEW_TARGET';

    constructor(protected tool: EdgeEditTool) {
        super();
    }

    protected isValidEdge(edge?: GRoutableElement): edge is GRoutableElement {
        return edge !== undefined && edge.id !== feedbackEdgeId(edge.root) && isSelected(edge);
    }

    protected setEdgeSelected(edge: GRoutableElement): void {
        if (this.edge && this.edge.id !== edge.id) {
            // reset from a previously selected edge
            this.reset();
        }

        this.edge = edge;
        // note: order is important here as we want the reconnect handles to cover the routing handles
        const feedbackActions = [];
        if (canEditRouting(edge)) {
            feedbackActions.push(SwitchRoutingModeAction.create({ elementsToActivate: [this.edge.id] }));
        }
        if (isReconnectable(edge)) {
            feedbackActions.push(ShowEdgeReconnectHandlesFeedbackAction.create(this.edge.id));
        }
        this.tool.registerFeedback(feedbackActions);
    }

    protected isEdgeSelected(): boolean {
        return this.edge !== undefined && isSelected(this.edge);
    }

    protected setReconnectHandleSelected(edge: GRoutableElement, reconnectHandle: GReconnectHandle): void {
        if (this.edge && this.edge.target && this.edge.source) {
            if (isSourceRoutingHandle(edge, reconnectHandle)) {
                this.tool.registerFeedback([
                    HideEdgeReconnectHandlesFeedbackAction.create(),
                    cursorFeedbackAction(CursorCSS.EDGE_RECONNECT),
                    DrawFeedbackEdgeSourceAction.create({ elementTypeId: this.edge.type, targetId: this.edge.targetId })
                ]);
                this.reconnectMode = 'NEW_SOURCE';
            } else if (isTargetRoutingHandle(edge, reconnectHandle)) {
                this.tool.registerFeedback([
                    HideEdgeReconnectHandlesFeedbackAction.create(),
                    cursorFeedbackAction(CursorCSS.EDGE_CREATION_TARGET),
                    DrawFeedbackEdgeAction.create({ elementTypeId: this.edge.type, sourceId: this.edge.sourceId })
                ]);
                this.reconnectMode = 'NEW_TARGET';
            }
        }
    }

    protected isReconnecting(): boolean {
        return this.reconnectMode !== undefined;
    }

    protected isReconnectingNewSource(): boolean {
        return this.reconnectMode === 'NEW_SOURCE';
    }

    protected setRoutingHandleSelected(edge: GRoutableElement, routingHandle: GRoutingHandle): void {
        if (this.edge && this.edge.target && this.edge.source) {
            this.routingHandle = routingHandle;
        }
    }

    protected requiresReconnect(sourceId: string, targetId: string): boolean {
        return this.edge !== undefined && (this.edge.sourceId !== sourceId || this.edge.targetId !== targetId);
    }

    protected setNewConnectable(connectable?: GModelElement & Connectable): void {
        this.newConnectable = connectable;
    }

    protected isReadyToReconnect(): boolean | undefined {
        return this.edge && this.isReconnecting() && this.newConnectable !== undefined;
    }

    protected isReadyToReroute(): boolean {
        return this.routingHandle !== undefined;
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = super.mouseDown(target, event);
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
                this.tool.registerFeedbackListeners();
                this.setEdgeSelected(edge);
            }
        } else if (event.button === 2) {
            this.reset();
        }
        return result;
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        const result = super.mouseMove(target, event);
        if (this.isMouseDrag) {
            // reset any selected connectables when we are dragging, maybe the user is just panning
            this.setNewConnectable(undefined);
        }
        return result;
    }

    override mouseUp(target: GModelElement, event: MouseEvent): Action[] {
        const result = super.mouseUp(target, event);
        if (!this.isReadyToReconnect() && !this.isReadyToReroute()) {
            return result;
        }

        if (this.edge && this.newConnectable) {
            const sourceElementId = this.isReconnectingNewSource() ? this.newConnectable.id : this.edge.sourceId;
            const targetElementId = this.isReconnectingNewSource() ? this.edge.targetId : this.newConnectable.id;
            if (this.requiresReconnect(sourceElementId, targetElementId)) {
                result.push(ReconnectEdgeOperation.create({ edgeElementId: this.edge.id, sourceElementId, targetElementId }));
            }
            this.reset();
        } else if (this.edge && this.routingHandle) {
            // we need to re-retrieve the edge as it might have changed due to a server update since we do not reset the state between
            // reroute actions
            const latestEdge = target.index.getById(this.edge.id);
            if (latestEdge && isRoutable(latestEdge)) {
                const newRoutingPoints = calcElementAndRoutingPoints(latestEdge, this.tool.edgeRouterRegistry);
                result.push(ChangeRoutingPointsOperation.create([newRoutingPoints]));
                this.routingHandle = undefined;
            }
        }
        return result;
    }

    override mouseOver(target: GModelElement, _event: MouseEvent): Action[] {
        if (this.edge && this.isReconnecting()) {
            const currentTarget = findParentByFeature(target, isConnectable);
            if (!this.newConnectable || currentTarget !== this.newConnectable) {
                this.setNewConnectable(currentTarget);
                if (currentTarget) {
                    if (
                        (this.reconnectMode === 'NEW_SOURCE' && currentTarget.canConnect(this.edge, 'source')) ||
                        (this.reconnectMode === 'NEW_TARGET' && currentTarget.canConnect(this.edge, 'target'))
                    ) {
                        this.tool.registerFeedback([cursorFeedbackAction(CursorCSS.EDGE_RECONNECT)]);
                        return [];
                    }
                }
                this.tool.registerFeedback([cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)]);
            }
        }
        return [];
    }

    selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[]): void {
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

    public reset(): void {
        this.resetFeedback();
        this.resetData();
    }

    protected resetData(): void {
        this.edge = undefined;
        this.reconnectMode = undefined;
        this.newConnectable = undefined;
        this.routingHandle = undefined;
    }

    protected resetFeedback(): void {
        const result: Action[] = [];
        if (this.edge) {
            result.push(SwitchRoutingModeAction.create({ elementsToDeactivate: [this.edge.id] }));
        }
        result.push(...[HideEdgeReconnectHandlesFeedbackAction.create(), cursorFeedbackAction(), RemoveFeedbackEdgeAction.create()]);
        this.tool.deregisterFeedback(undefined, result);
        this.tool.deregisterFeedbackListeners();
    }
}
