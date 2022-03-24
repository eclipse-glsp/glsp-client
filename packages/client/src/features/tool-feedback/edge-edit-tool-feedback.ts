/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { Action, Point } from '@eclipse-glsp/protocol';
import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import {
    add,
    AnchorComputerRegistry,
    center,
    CommandExecutionContext,
    CommandReturn,
    EdgeRouterRegistry,
    ElementMove,
    euclideanDistance,
    findChildrenAtPosition,
    findParentByFeature,
    isBoundsAware,
    isConnectable,
    ISnapper,
    isSelected,
    isViewport,
    MouseListener,
    MoveAction,
    PolylineEdgeRouter,
    SConnectableElement,
    SModelElement,
    SModelRoot,
    SRoutingHandle,
    SwitchEditModeAction,
    SwitchEditModeCommand,
    TYPES
} from 'sprotty';
import { WriteablePoint } from '../../utils/layout-utils';
import { forEachElement, isNotUndefined, isRoutable, isRoutingHandle } from '../../utils/smodel-util';
import { getAbsolutePosition, toAbsoluteBounds } from '../../utils/viewpoint-util';
import { addReconnectHandles, removeReconnectHandles } from '../reconnect/model';
import { FeedbackEdgeEnd, feedbackEdgeEndId, FeedbackEdgeEndMovingMouseListener, feedbackEdgeId } from './creation-tool-feedback';
import { FeedbackCommand } from './model';

/**
 * RECONNECT HANDLES FEEDBACK
 */

export class ShowEdgeReconnectHandlesFeedbackAction implements Action {
    constructor(readonly elementId?: string, public readonly kind: string = ShowEdgeReconnectHandlesFeedbackCommand.KIND) {}
}

export class HideEdgeReconnectHandlesFeedbackAction implements Action {
    constructor(public readonly kind: string = HideEdgeReconnectHandlesFeedbackCommand.KIND) {}
}

@injectable()
export class ShowEdgeReconnectHandlesFeedbackCommand extends FeedbackCommand {
    static readonly KIND = 'showReconnectHandlesFeedback';

    constructor(@inject(TYPES.Action) protected action: ShowEdgeReconnectHandlesFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        forEachElement(index, isRoutable, removeReconnectHandles);

        if (isNotUndefined(this.action.elementId)) {
            const routableElement = index.getById(this.action.elementId);
            if (isNotUndefined(routableElement) && isRoutable(routableElement)) {
                addReconnectHandles(routableElement);
            }
        }
        return context.root;
    }
}

@injectable()
export class HideEdgeReconnectHandlesFeedbackCommand extends FeedbackCommand {
    static readonly KIND = 'hideReconnectHandlesFeedback';

    constructor(@inject(TYPES.Action) protected action: HideEdgeReconnectHandlesFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        forEachElement(index, isRoutable, removeReconnectHandles);
        return context.root;
    }
}
/**
 * ROUTING FEEDBACK
 */

export class SwitchRoutingModeAction extends SwitchEditModeAction {
    constructor(
        override readonly elementsToActivate: string[] = [],
        override readonly elementsToDeactivate: string[] = [],
        override readonly kind: string = SwitchRoutingModeCommand.KIND
    ) {
        super(elementsToActivate, elementsToDeactivate);
    }
}

@injectable()
export class SwitchRoutingModeCommand extends SwitchEditModeCommand {
    static override KIND = 'switchRoutingMode';
    constructor(@inject(TYPES.Action) action: SwitchRoutingModeAction) {
        super(action);
    }
}

/**
 * SOURCE AND TARGET EDGE FEEDBACK
 */

export class DrawFeedbackEdgeSourceAction implements Action {
    constructor(
        readonly elementTypeId: string,
        readonly targetId: string,
        public readonly kind: string = DrawFeedbackEdgeSourceCommand.KIND
    ) {}
}

@injectable()
export class DrawFeedbackEdgeSourceCommand extends FeedbackCommand {
    static readonly KIND = 'drawFeedbackEdgeSource';

    constructor(@inject(TYPES.Action) protected action: DrawFeedbackEdgeSourceAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        drawFeedbackEdgeSource(context, this.action.targetId, this.action.elementTypeId);
        return context.root;
    }
}

/**
 * SOURCE AND TARGET MOUSE MOVE LISTENER
 */

export class FeedbackEdgeTargetMovingMouseListener extends FeedbackEdgeEndMovingMouseListener {
    constructor(protected override anchorRegistry: AnchorComputerRegistry) {
        super(anchorRegistry);
    }
}

export class FeedbackEdgeSourceMovingMouseListener extends MouseListener {
    constructor(protected anchorRegistry: AnchorComputerRegistry) {
        super();
    }

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const root = target.root;
        const edgeEnd = root.index.getById(feedbackEdgeEndId(root));
        if (!(edgeEnd instanceof FeedbackEdgeEnd) || !edgeEnd.feedbackEdge) {
            return [];
        }

        const edge = edgeEnd.feedbackEdge;
        const position = getAbsolutePosition(edgeEnd, event);
        const endAtMousePosition = findChildrenAtPosition(target.root, position).find(
            e => isConnectable(e) && e.canConnect(edge, 'source')
        );

        if (endAtMousePosition instanceof SConnectableElement && edge.target && isBoundsAware(edge.target)) {
            const anchor = this.computeAbsoluteAnchor(endAtMousePosition, center(edge.target.bounds));
            if (euclideanDistance(anchor, edgeEnd.position) > 1) {
                return [new MoveAction([{ elementId: edgeEnd.id, toPosition: anchor }], false)];
            }
        } else {
            return [new MoveAction([{ elementId: edgeEnd.id, toPosition: position }], false)];
        }

        return [];
    }

    protected computeAbsoluteAnchor(element: SConnectableElement, referencePoint: Point, offset?: number): Point {
        const anchorComputer = this.anchorRegistry.get(PolylineEdgeRouter.KIND, element.anchorKind);
        let anchor = anchorComputer.getAnchor(element, referencePoint, offset);
        // The anchor is computed in the local coordinate system of the element.
        // If the element is a nested child element we have to add the absolute position of its parent to the anchor.
        if (element.parent !== element.root) {
            const parent = findParentByFeature(element.parent, isBoundsAware);
            if (parent) {
                const absoluteParentPosition = toAbsoluteBounds(parent);
                anchor = add(absoluteParentPosition, anchor);
            }
        }
        return anchor;
    }
}

export class FeedbackEdgeRouteMovingMouseListener extends MouseListener {
    protected lastDragPosition: Point | undefined;
    protected positionDelta: WriteablePoint = { x: 0, y: 0 };

    constructor(protected edgeRouterRegistry?: EdgeRouterRegistry, protected snapper?: ISnapper) {
        super();
    }

    override mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            const routingHandle = findParentByFeature(target, isRoutingHandle);
            if (routingHandle !== undefined) {
                result.push(new SwitchRoutingModeAction([target.id], []));
                this.lastDragPosition = { x: event.pageX, y: event.pageY };
            } else {
                this.lastDragPosition = undefined;
            }
        }
        return result;
    }

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0) {
            return this.mouseUp(target, event);
        }
        const positionUpdate = this.updatePosition(target, event);
        if (positionUpdate) {
            const moveActions = this.handleMoveOnClient(target, positionUpdate);
            result.push(...moveActions);
        }
        return result;
    }

    protected updatePosition(target: SModelElement, event: MouseEvent): Point | undefined {
        if (this.lastDragPosition) {
            const newDragPosition = { x: event.pageX, y: event.pageY };

            const viewport = findParentByFeature(target, isViewport);
            const zoom = viewport ? viewport.zoom : 1;
            const dx = (event.pageX - this.lastDragPosition.x) / zoom;
            const dy = (event.pageY - this.lastDragPosition.y) / zoom;
            const deltaToLastPosition = { x: dx, y: dy };
            this.lastDragPosition = newDragPosition;

            // update position delta with latest delta
            this.positionDelta.x += deltaToLastPosition.x;
            this.positionDelta.y += deltaToLastPosition.y;

            // snap our delta and only send update if the position actually changes
            // otherwise accumulate delta until we do snap to an update
            const positionUpdate = this.snap(this.positionDelta, target, !event.altKey);
            if (positionUpdate.x === 0 && positionUpdate.y === 0) {
                return undefined;
            }

            // we update our position so we update our delta by the snapped position
            this.positionDelta.x -= positionUpdate.x;
            this.positionDelta.y -= positionUpdate.y;
            return positionUpdate;
        }
        return undefined;
    }

    protected snap(position: Point, element: SModelElement, isSnap: boolean): Point {
        return isSnap && this.snapper ? this.snapper.snap(position, element) : { x: position.x, y: position.y };
    }

    protected handleMoveOnClient(target: SModelElement, positionUpdate: Point): Action[] {
        const handleMoves: ElementMove[] = [];
        target.root.index
            .all()
            .filter(element => isSelected(element))
            .forEach(element => {
                if (isRoutingHandle(element)) {
                    const elementMove = this.toElementMove(element, positionUpdate);
                    if (elementMove) {
                        handleMoves.push(elementMove);
                    }
                }
            });
        if (handleMoves.length > 0) {
            return [new MoveAction(handleMoves, false)];
        }
        return [];
    }

    private toElementMove(element: SRoutingHandle, positionDelta: Point): ElementMove | undefined {
        const point = this.getHandlePosition(element);
        if (point !== undefined) {
            return {
                elementId: element.id,
                fromPosition: point,
                toPosition: {
                    x: point.x + positionDelta.x,
                    y: point.y + positionDelta.y
                }
            };
        }
        return undefined;
    }

    protected getHandlePosition(handle: SRoutingHandle): Point | undefined {
        if (this.edgeRouterRegistry) {
            const parent = handle.parent;
            if (!isRoutable(parent)) {
                return undefined;
            }
            const router = this.edgeRouterRegistry.get(parent.routerKind);
            const route = router.route(parent);
            return router.getHandlePosition(parent, route, handle);
        }
        return undefined;
    }

    override mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0) {
            this.mouseUp(target, event);
        }
        return [];
    }

    override mouseUp(_target: SModelElement, event: MouseEvent): Action[] {
        this.lastDragPosition = undefined;
        this.positionDelta = { x: 0, y: 0 };
        return [];
    }

    override decorate(vnode: VNode, _element: SModelElement): VNode {
        return vnode;
    }
}

/**
 * UTILITY FUNCTIONS
 */

function drawFeedbackEdgeSource(context: CommandExecutionContext, targetId: string, elementTypeId: string): void {
    const root = context.root;
    const targetChild = root.index.getById(targetId);
    if (!targetChild) {
        return;
    }

    const target = findParentByFeature(targetChild, isConnectable);
    if (!target || !isBoundsAware(target)) {
        return;
    }

    const edgeEnd = new FeedbackEdgeEnd(target.id, elementTypeId);
    edgeEnd.id = feedbackEdgeEndId(root);
    edgeEnd.position = { x: target.bounds.x, y: target.bounds.y };

    const feedbackEdgeSchema = {
        type: 'edge',
        id: feedbackEdgeId(root),
        sourceId: edgeEnd.id,
        targetId: target.id,
        opacity: 0.3
    };

    const feedbackEdge = context.modelFactory.createElement(feedbackEdgeSchema);
    if (isRoutable(feedbackEdge)) {
        edgeEnd.feedbackEdge = feedbackEdge;
        root.add(edgeEnd);
        root.add(feedbackEdge);
    }
}
