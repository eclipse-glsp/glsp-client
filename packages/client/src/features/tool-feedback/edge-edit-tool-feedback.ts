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
import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import {
    Action,
    AnchorComputerRegistry,
    Bounds,
    CommandExecutionContext,
    CommandReturn,
    EdgeRouterRegistry,
    ElementMove,
    ISnapper,
    MouseListener,
    MoveAction,
    Point,
    PolylineEdgeRouter,
    SConnectableElement,
    SModelElement,
    SRoutingHandle,
    SwitchEditModeAction,
    SwitchEditModeCommand,
    TYPES,
    findChildrenAtPosition,
    findParentByFeature,
    hasStringProp,
    isBoundsAware,
    isConnectable,
    isSelected
} from '~glsp-sprotty';
import { forEachElement, isRoutable, isRoutingHandle } from '../../utils/smodel-util';
import { getAbsolutePosition, toAbsoluteBounds } from '../../utils/viewpoint-util';
import { PointPositionUpdater } from '../change-bounds/snap';
import { addReconnectHandles, removeReconnectHandles } from '../reconnect/model';
import { FeedbackEdgeEnd, FeedbackEdgeEndMovingMouseListener, feedbackEdgeEndId, feedbackEdgeId } from './creation-tool-feedback';
import { FeedbackCommand } from './model';

/**
 * RECONNECT HANDLES FEEDBACK
 */
export interface ShowEdgeReconnectHandlesFeedbackAction extends Action {
    kind: typeof ShowEdgeReconnectHandlesFeedbackAction.KIND;
    readonly elementId: string;
}

export namespace ShowEdgeReconnectHandlesFeedbackAction {
    export const KIND = 'showReconnectHandlesFeedback';

    export function is(object: any): object is ShowEdgeReconnectHandlesFeedbackAction {
        return Action.hasKind(object, KIND);
    }

    export function create(elementId: string): ShowEdgeReconnectHandlesFeedbackAction {
        return { kind: KIND, elementId };
    }
}
export interface HideEdgeReconnectHandlesFeedbackAction extends Action {
    kind: typeof HideEdgeReconnectHandlesFeedbackAction.KIND;
}

export namespace HideEdgeReconnectHandlesFeedbackAction {
    export const KIND = 'hideReconnectHandlesFeedback';

    export function is(object: any): object is HideEdgeReconnectHandlesFeedbackAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): HideEdgeReconnectHandlesFeedbackAction {
        return { kind: KIND };
    }
}

@injectable()
export class ShowEdgeReconnectHandlesFeedbackCommand extends FeedbackCommand {
    static readonly KIND = ShowEdgeReconnectHandlesFeedbackAction.KIND;

    constructor(@inject(TYPES.Action) protected action: ShowEdgeReconnectHandlesFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        forEachElement(index, isRoutable, removeReconnectHandles);

        const routableElement = index.getById(this.action.elementId);
        if (routableElement && isRoutable(routableElement)) {
            addReconnectHandles(routableElement);
        }

        return context.root;
    }
}

@injectable()
export class HideEdgeReconnectHandlesFeedbackCommand extends FeedbackCommand {
    static readonly KIND = HideEdgeReconnectHandlesFeedbackAction.KIND;

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

export interface SwitchRoutingModeAction extends Omit<SwitchEditModeAction, 'kind'> {
    kind: typeof SwitchRoutingModeAction.KIND;
}

export namespace SwitchRoutingModeAction {
    export const KIND = 'switchRoutingMode';
    export function create(options: { elementsToActivate?: string[]; elementsToDeactivate?: string[] }): SwitchRoutingModeAction {
        return {
            ...SwitchEditModeAction.create(options),
            kind: KIND
        };
    }
}
@injectable()
export class SwitchRoutingModeCommand extends SwitchEditModeCommand {
    static override KIND = SwitchRoutingModeAction.KIND;
    constructor(@inject(TYPES.Action) action: SwitchRoutingModeAction) {
        super({ ...action, kind: SwitchEditModeAction.KIND });
    }
}

/**
 * SOURCE AND TARGET EDGE FEEDBACK
 */

export interface DrawFeedbackEdgeSourceAction extends Action {
    kind: typeof DrawFeedbackEdgeSourceAction.KIND;
    elementTypeId: string;
    targetId: string;
}

export namespace DrawFeedbackEdgeSourceAction {
    export const KIND = 'drawFeedbackEdgeSource';

    export function is(object: any): object is DrawFeedbackEdgeSourceAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'elementTypeId') && hasStringProp(object, 'targetId');
    }

    export function create(options: { elementTypeId: string; targetId: string }): DrawFeedbackEdgeSourceAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawFeedbackEdgeSourceCommand extends FeedbackCommand {
    static readonly KIND = DrawFeedbackEdgeSourceAction.KIND;

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
            const anchor = this.computeAbsoluteAnchor(endAtMousePosition, Bounds.center(edge.target.bounds));
            if (Point.euclideanDistance(anchor, edgeEnd.position) > 1) {
                return [MoveAction.create([{ elementId: edgeEnd.id, toPosition: anchor }], { animate: false })];
            }
        } else {
            return [MoveAction.create([{ elementId: edgeEnd.id, toPosition: position }], { animate: false })];
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
                anchor = Point.add(absoluteParentPosition, anchor);
            }
        }
        return anchor;
    }
}

export class FeedbackEdgeRouteMovingMouseListener extends MouseListener {
    protected pointPositionUpdater: PointPositionUpdater;

    constructor(protected edgeRouterRegistry?: EdgeRouterRegistry, protected snapper?: ISnapper) {
        super();
        this.pointPositionUpdater = new PointPositionUpdater(snapper);
    }

    override mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            const routingHandle = findParentByFeature(target, isRoutingHandle);
            if (routingHandle !== undefined) {
                result.push(SwitchRoutingModeAction.create({ elementsToActivate: [target.id] }));
                this.pointPositionUpdater.updateLastDragPosition({ x: event.pageX, y: event.pageY });
            } else {
                this.pointPositionUpdater.resetPosition();
            }
        }
        return result;
    }

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0) {
            return this.mouseUp(target, event);
        }
        const positionUpdate = this.pointPositionUpdater.updatePosition(target, { x: event.pageX, y: event.pageY }, !event.altKey);
        if (positionUpdate) {
            const moveActions = this.handleMoveOnClient(target, positionUpdate, !event.altKey);
            result.push(...moveActions);
        }
        return result;
    }

    protected handleMoveOnClient(target: SModelElement, positionUpdate: Point, isSnap: boolean): Action[] {
        const handleMoves: ElementMove[] = [];
        target.root.index
            .all()
            .filter(element => isSelected(element))
            .forEach(element => {
                if (isRoutingHandle(element)) {
                    const elementMove = this.toElementMove(element, positionUpdate, isSnap);
                    if (elementMove) {
                        handleMoves.push(elementMove);
                    }
                }
            });
        if (handleMoves.length > 0) {
            return [MoveAction.create(handleMoves, { animate: false })];
        }
        return [];
    }

    protected toElementMove(element: SRoutingHandle, positionDelta: Point, isSnap: boolean): ElementMove | undefined {
        const point = this.getHandlePosition(element);
        if (point !== undefined) {
            const snappedPoint = this.getSnappedHandlePosition(element, point, isSnap);
            return {
                elementId: element.id,
                fromPosition: point,
                toPosition: {
                    x: snappedPoint.x + positionDelta.x,
                    y: snappedPoint.y + positionDelta.y
                }
            };
        }
        return undefined;
    }

    protected getSnappedHandlePosition(element: SRoutingHandle, point: Point, isSnap: boolean): Point {
        if (this.snapper && isSnap) {
            return this.snapper.snap(point, element);
        }
        return point;
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

    override mouseUp(_target: SModelElement, _event: MouseEvent): Action[] {
        this.pointPositionUpdater.resetPosition();
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
