/********************************************************************************
 * Copyright (c) 2022 Imixs Software Solutions GmbH.
 * Copyright (c) 2026 EclipseSource and others.
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
    Bounds,
    DefaultAnchors,
    GRoutableElement,
    GRoutingHandle,
    LinearRouteOptions,
    Point,
    ResolvedHandleMove,
    RoutedPoint,
    Side
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { GLSPAbstractEdgeRouter, ensureBounds } from './edge-router';

export interface StickyManhattanRouterOptions extends LinearRouteOptions {
    /**
     * Tolerance in pixels for deciding whether a segment is strictly vertical or
     * horizontal. Defaults to `1` to accommodate the sub-pixel drift typical for
     * Manhattan-routed coordinates.
     */
    axisTolerance: number;
}

/**
 * An alternative Manhattan-style edge router that preserves existing bend points.
 *
 * In contrast to the standard {@link GLSPManhattanEdgeRouter} which recomputes the
 * full route whenever a connected node moves, this router only adjusts the corner
 * adjacent to the moved endpoint. Intermediate bend points are kept in place, which
 * results in more predictable routing when users reposition nodes in complex
 * diagrams.
 *
 * Opt-in per edge by setting `edge.routerKind = 'sticky-manhattan'`.
 *
 * @experimental The API surface and implementation details of this router may
 * change in future releases, potentially in breaking ways, as we iterate on the
 * initial implementation.
 *
 * Based on the original `BPMNManhattanRouter` by Ralph Soika (Imixs Software
 * Solutions GmbH), contributed via https://github.com/eclipse-glsp/glsp/discussions/1642.
 */
@injectable()
export class GLSPStickyManhattanEdgeRouter extends GLSPAbstractEdgeRouter {
    static readonly KIND = 'sticky-manhattan';

    /**
     * Snapshot of the last known source/target bounds per edge, used to detect
     * node moves between render cycles. A `WeakMap` keyed on the edge instance
     * keeps entries tied to the model-element lifecycle.
     */
    protected readonly elementPositions = new WeakMap<
        GRoutableElement,
        { sourceX: number; sourceY: number; targetX: number; targetY: number }
    >();

    get kind(): string {
        return GLSPStickyManhattanEdgeRouter.KIND;
    }

    protected getOptions(edge: GRoutableElement): StickyManhattanRouterOptions {
        return {
            standardDistance: 20,
            minimalPointDistance: 3,
            selfEdgeOffset: 0.25,
            axisTolerance: 1
        };
    }

    override route(edge: GRoutableElement): RoutedPoint[] {
        if (!edge.source || !edge.target || !edge.source.bounds || !edge.target.bounds) {
            return [];
        }

        const routedCorners = this.createRoutedCorners(edge);
        const sourceRefPoint = routedCorners[0] ?? Bounds.center(edge.target.bounds);
        const targetRefPoint = routedCorners[routedCorners.length - 1] ?? Bounds.center(edge.source.bounds);

        const sourceAnchor = this.getTranslatedAnchor(edge.source, sourceRefPoint, edge.parent, edge, edge.sourceAnchorCorrection);
        const targetAnchor = this.getTranslatedAnchor(edge.target, targetRefPoint, edge.parent, edge, edge.targetAnchorCorrection);

        if (!sourceAnchor || !targetAnchor) {
            return [];
        }

        const result: RoutedPoint[] = [];
        result.push({ kind: 'source', ...sourceAnchor });
        routedCorners.forEach(corner => result.push(corner));
        result.push({ kind: 'target', ...targetAnchor });

        // Guard against NaN coordinates which would break path rendering downstream.
        const sanitized = result.filter(p => !isNaN(p.x) && !isNaN(p.y));
        if (sanitized.length < 2) {
            return [];
        }
        return sanitized;
    }

    /**
     * Computes the intermediate corner points between source and target anchors.
     *
     * If the edge already has routing points and the connected nodes have moved
     * since the previous route, the existing corners are preserved and only the
     * endpoints closest to the moved node(s) slide along their constrained axis.
     * Otherwise the corners are recomputed from scratch based on the current node
     * geometry.
     */
    protected createRoutedCorners(edge: GRoutableElement): RoutedPoint[] {
        if (!edge.source?.bounds || !edge.target?.bounds) {
            return [];
        }

        if (edge.routingPoints && edge.routingPoints.length > 0) {
            const srcBounds = edge.source.bounds;
            const tgtBounds = edge.target.bounds;
            const lastPos = this.elementPositions.get(edge);
            const elementMoved =
                lastPos !== undefined &&
                (lastPos.sourceX !== srcBounds.x ||
                    lastPos.sourceY !== srcBounds.y ||
                    lastPos.targetX !== tgtBounds.x ||
                    lastPos.targetY !== tgtBounds.y);

            this.elementPositions.set(edge, {
                sourceX: srcBounds.x,
                sourceY: srcBounds.y,
                targetX: tgtBounds.x,
                targetY: tgtBounds.y
            });

            const points = edge.routingPoints.slice();

            if (elementMoved) {
                // Slide the endpoints of the existing route to follow the moved node(s),
                // then clean up without reintroducing corners.
                this.applyFollowLogic(points, edge);
                this.cleanupRoutingPoints(edge, points, false, false);
                // Write back so subsequent route() calls in the same frame see the
                // updated corner positions.
                edge.routingPoints = points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
            } else {
                this.cleanupRoutingPoints(edge, points, false, true);
            }

            if (points.length > 0) {
                return points.map((rp, index) => ({
                    kind: 'linear' as const,
                    pointIndex: index,
                    x: Math.round(rp.x),
                    y: Math.round(rp.y)
                }));
            }
        }

        const sourceAnchors = new DefaultAnchors(edge.source, edge.parent, 'source');
        const targetAnchors = new DefaultAnchors(edge.target, edge.parent, 'target');
        const options = this.getOptions(edge);
        const bestAnchors = this.getBestConnectionAnchors(sourceAnchors, targetAnchors, options);
        const corners = this.calculateCorners(sourceAnchors, targetAnchors, bestAnchors, options);
        return corners.map((corner, index) => ({
            kind: 'linear' as const,
            pointIndex: index,
            x: Math.round(corner.x),
            y: Math.round(corner.y)
        }));
    }

    /**
     * Adjusts the endpoints of the existing route so they follow the moved node(s).
     * The corner adjacent to a moved endpoint slides along its constrained axis so
     * that the route stays orthogonal without discarding intermediate bend points.
     */
    protected applyFollowLogic(points: Point[], edge: GRoutableElement): void {
        const sourceAnchor = this.getTranslatedAnchor(edge.source!, points[0], edge.parent, edge, edge.sourceAnchorCorrection);
        const targetAnchor = this.getTranslatedAnchor(
            edge.target!,
            points[points.length - 1],
            edge.parent,
            edge,
            edge.targetAnchorCorrection
        );
        if (!sourceAnchor || !targetAnchor) {
            return;
        }

        const { axisTolerance } = this.getOptions(edge);

        if (points.length === 1) {
            // Classify the first segment via the source side closest to the bend — this
            // matches how the Manhattan anchor computer picks the source anchor.
            const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, 'source');
            const side = sourceAnchors.getNearestSide(points[0]);
            const isVertical = side === Side.TOP || side === Side.BOTTOM;
            if (isVertical) {
                points[0] = { x: sourceAnchor.x, y: Math.round(Bounds.center(edge.target!.bounds).y) };
            } else {
                points[0] = { x: Math.round(Bounds.center(edge.target!.bounds).x), y: sourceAnchor.y };
            }
            return;
        }

        // First corner follows the source element.
        if (Point.isVerticalAligned(points[0], points[1], axisTolerance)) {
            points[0] = { x: points[0].x, y: Math.round(Bounds.center(edge.source!.bounds).y) };
        } else {
            points[0] = { x: Math.round(Bounds.center(edge.source!.bounds).x), y: points[0].y };
        }

        // Last corner follows the target element.
        const last = points.length - 1;
        if (Point.isVerticalAligned(points[last], points[last - 1], axisTolerance)) {
            points[last] = { x: points[last].x, y: Math.round(Bounds.center(edge.target!.bounds).y) };
        } else {
            points[last] = { x: Math.round(Bounds.center(edge.target!.bounds).x), y: points[last].y };
        }
    }

    override createRoutingHandles(edge: GRoutableElement): void {
        const routedPoints = this.route(edge);
        this.commitRoute(edge, routedPoints);
        if (routedPoints.length > 0) {
            this.addHandle(edge, 'source', 'routing-point', -2);
            for (let i = 0; i < routedPoints.length - 1; i++) {
                this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', i - 1);
            }
            this.addHandle(edge, 'target', 'routing-point', routedPoints.length - 2);
        }
    }

    protected getInnerHandlePosition(edge: GRoutableElement, route: RoutedPoint[], handle: GRoutingHandle): Point | undefined {
        if (handle.kind === 'manhattan-50%') {
            const { start, end } = this.findRouteSegment(edge, route, handle.pointIndex);
            if (start !== undefined && end !== undefined) {
                return Point.linear(start, end, 0.5);
            }
        }
        return undefined;
    }

    protected applyInnerHandleMoves(edge: GRoutableElement, moves: ResolvedHandleMove[]): void {
        const route = this.route(edge);
        const routingPoints = edge.routingPoints;
        const { minimalPointDistance, axisTolerance } = this.getOptions(edge);

        moves.forEach(move => {
            const handle = move.handle;
            const index = handle.pointIndex;

            if (handle.kind !== 'manhattan-50%') {
                return;
            }

            const correctedX = this.correctX(routingPoints, index, move.toPosition.x, minimalPointDistance);
            const correctedY = this.correctY(routingPoints, index, move.toPosition.y, minimalPointDistance);

            if (index < 0) {
                // First segment: source anchor → first corner.
                if (routingPoints.length === 0) {
                    routingPoints.push({ x: correctedX, y: correctedY });
                    handle.pointIndex = 0;
                } else if (Point.isVerticalAligned(route[0], route[1], axisTolerance)) {
                    this.alignX(routingPoints, 0, correctedX);
                } else {
                    this.alignY(routingPoints, 0, correctedY);
                }
            } else if (index < routingPoints.length - 1) {
                // Inner segment: move both endpoints of the segment in lockstep.
                if (Point.isVerticalAligned(routingPoints[index], routingPoints[index + 1], axisTolerance)) {
                    this.alignX(routingPoints, index, correctedX);
                    this.alignX(routingPoints, index + 1, correctedX);
                } else {
                    this.alignY(routingPoints, index, correctedY);
                    this.alignY(routingPoints, index + 1, correctedY);
                }
            } else {
                // Last segment: last corner → target anchor.
                if (routingPoints.length === 0) {
                    routingPoints.push({ x: correctedX, y: correctedY });
                    handle.pointIndex = 0;
                } else if (Point.isVerticalAligned(route[route.length - 2], route[route.length - 1], axisTolerance)) {
                    this.alignX(routingPoints, routingPoints.length - 1, correctedX);
                } else {
                    this.alignY(routingPoints, routingPoints.length - 1, correctedY);
                }
            }
        });
    }

    override cleanupRoutingPoints(edge: GRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean): void {
        if (!ensureBounds(edge.source) || !ensureBounds(edge.target)) {
            return;
        }
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, 'source');
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, 'target');
        const options = this.getOptions(edge);

        if (this.resetRoutingPointsOnReconnect(edge, routingPoints, updateHandles, sourceAnchors, targetAnchors)) {
            return;
        }

        // Remove leading routing points that fall inside the source bounds.
        for (let i = 0; i < routingPoints.length; i++) {
            if (Bounds.includes(sourceAnchors.bounds, routingPoints[i])) {
                routingPoints.splice(0, 1);
                if (updateHandles) {
                    this.removeHandle(edge, -1);
                }
                i--;
            } else {
                break;
            }
        }

        // Remove trailing routing points that fall inside the target bounds.
        for (let i = routingPoints.length - 1; i >= 0; i--) {
            if (Bounds.includes(targetAnchors.bounds, routingPoints[i])) {
                routingPoints.splice(i, 1);
                if (updateHandles) {
                    this.removeHandle(edge, i);
                }
            } else {
                break;
            }
        }

        // Collapse degenerate segments shorter than minimalPointDistance.
        if (routingPoints.length >= 2) {
            for (let i = routingPoints.length - 2; i >= 0; i--) {
                if (Point.manhattanDistance(routingPoints[i], routingPoints[i + 1]) < options.minimalPointDistance) {
                    routingPoints.splice(i, 2);
                    i--;
                    if (updateHandles) {
                        this.removeHandle(edge, i - 1);
                        this.removeHandle(edge, i);
                    }
                }
            }
        }

        if (addRoutingPoints) {
            this.addAdditionalCorner(edge, routingPoints, sourceAnchors, targetAnchors, updateHandles);
            this.addAdditionalCorner(edge, routingPoints, targetAnchors, sourceAnchors, updateHandles);
            this.manhattanify(routingPoints, edge);
        }
    }

    protected removeHandle(edge: GRoutableElement, pointIndex: number): void {
        const toBeRemoved: GRoutingHandle[] = [];
        edge.children.forEach(child => {
            if (child instanceof GRoutingHandle) {
                if (child.pointIndex > pointIndex) {
                    child.pointIndex--;
                } else if (child.pointIndex === pointIndex) {
                    toBeRemoved.push(child);
                }
            }
        });
        toBeRemoved.forEach(child => edge.remove(child));
    }

    /**
     * Inserts an additional corner when the first/last routing point is outside
     * the node bounds in the direction of the adjacent segment. This keeps the
     * route orthogonal after routing points have been dragged outside the node.
     */
    protected addAdditionalCorner(
        edge: GRoutableElement,
        points: Point[],
        currentAnchors: DefaultAnchors,
        otherAnchors: DefaultAnchors,
        updateHandles: boolean
    ): void {
        if (points.length === 0) {
            return;
        }

        const isSource = currentAnchors.kind === 'source';
        const refPoint = isSource ? points[0] : points[points.length - 1];
        const insertIndex = isSource ? 0 : points.length;
        const shiftIndex = insertIndex - (isSource ? 1 : 0);
        const { axisTolerance } = this.getOptions(edge);

        let isHorizontal: boolean;
        if (points.length > 1) {
            isHorizontal = isSource
                ? Point.isVerticalAligned(points[0], points[1], axisTolerance)
                : Point.isVerticalAligned(points[points.length - 1], points[points.length - 2], axisTolerance);
        } else {
            const nearestSide = otherAnchors.getNearestSide(refPoint);
            isHorizontal = nearestSide === Side.TOP || nearestSide === Side.BOTTOM;
        }

        if (isHorizontal) {
            const topY = currentAnchors.get(Side.TOP).y;
            const bottomY = currentAnchors.get(Side.BOTTOM).y;
            if (refPoint.y < topY || refPoint.y > bottomY) {
                const newPoint: Point = { x: currentAnchors.get(Side.TOP).x, y: refPoint.y };
                points.splice(insertIndex, 0, newPoint);
                if (updateHandles) {
                    edge.children.forEach(child => {
                        if (child instanceof GRoutingHandle && child.pointIndex >= shiftIndex) {
                            child.pointIndex++;
                        }
                    });
                    this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', shiftIndex);
                }
            }
        } else {
            const leftX = currentAnchors.get(Side.LEFT).x;
            const rightX = currentAnchors.get(Side.RIGHT).x;
            if (refPoint.x < leftX || refPoint.x > rightX) {
                const newPoint: Point = { x: refPoint.x, y: currentAnchors.get(Side.LEFT).y };
                points.splice(insertIndex, 0, newPoint);
                if (updateHandles) {
                    edge.children.forEach(child => {
                        if (child instanceof GRoutingHandle && child.pointIndex >= shiftIndex) {
                            child.pointIndex++;
                        }
                    });
                    this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', shiftIndex);
                }
            }
        }
    }

    /** Inserts intermediate corner points so every segment is strictly orthogonal. */
    protected manhattanify(points: Point[], edge: GRoutableElement): void {
        const { axisTolerance } = this.getOptions(edge);
        for (let i = 1; i < points.length; i++) {
            if (!Point.isAxisAligned(points[i - 1], points[i], axisTolerance)) {
                points.splice(i, 0, { x: points[i - 1].x, y: points[i].y });
                i++;
            }
        }
    }

    /**
     * Picks the sides on source and target for a fresh default route, preferring
     * (in order) direct, one-corner, and finally two-corner connections.
     */
    protected getBestConnectionAnchors(
        sourceAnchors: DefaultAnchors,
        targetAnchors: DefaultAnchors,
        options: StickyManhattanRouterOptions
    ): { source: Side; target: Side } {
        const sd = options.standardDistance;

        // Direct connections (no corners).
        if (targetAnchors.get(Side.LEFT).x - sourceAnchors.get(Side.RIGHT).x > sd) {
            return { source: Side.RIGHT, target: Side.LEFT };
        }
        if (sourceAnchors.get(Side.LEFT).x - targetAnchors.get(Side.RIGHT).x > sd) {
            return { source: Side.LEFT, target: Side.RIGHT };
        }
        if (sourceAnchors.get(Side.TOP).y - targetAnchors.get(Side.BOTTOM).y > sd) {
            return { source: Side.TOP, target: Side.BOTTOM };
        }
        if (targetAnchors.get(Side.TOP).y - sourceAnchors.get(Side.BOTTOM).y > sd) {
            return { source: Side.BOTTOM, target: Side.TOP };
        }

        // One-corner connections.
        if (
            targetAnchors.get(Side.TOP).x - sourceAnchors.get(Side.RIGHT).x > 0.5 * sd &&
            targetAnchors.get(Side.TOP).y - sourceAnchors.get(Side.RIGHT).y > sd
        ) {
            return { source: Side.RIGHT, target: Side.TOP };
        }
        if (
            targetAnchors.get(Side.BOTTOM).x - sourceAnchors.get(Side.RIGHT).x > 0.5 * sd &&
            sourceAnchors.get(Side.RIGHT).y - targetAnchors.get(Side.BOTTOM).y > sd
        ) {
            return { source: Side.RIGHT, target: Side.BOTTOM };
        }
        if (
            sourceAnchors.get(Side.LEFT).x - targetAnchors.get(Side.BOTTOM).x > 0.5 * sd &&
            sourceAnchors.get(Side.LEFT).y - targetAnchors.get(Side.BOTTOM).y > sd
        ) {
            return { source: Side.LEFT, target: Side.BOTTOM };
        }
        if (
            sourceAnchors.get(Side.LEFT).x - targetAnchors.get(Side.TOP).x > 0.5 * sd &&
            targetAnchors.get(Side.TOP).y - sourceAnchors.get(Side.LEFT).y > sd
        ) {
            return { source: Side.LEFT, target: Side.TOP };
        }
        if (
            targetAnchors.get(Side.RIGHT).y - sourceAnchors.get(Side.BOTTOM).y > 0.5 * sd &&
            sourceAnchors.get(Side.BOTTOM).x - targetAnchors.get(Side.RIGHT).x > sd
        ) {
            return { source: Side.BOTTOM, target: Side.RIGHT };
        }
        if (
            targetAnchors.get(Side.LEFT).y - sourceAnchors.get(Side.BOTTOM).y > 0.5 * sd &&
            targetAnchors.get(Side.LEFT).x - sourceAnchors.get(Side.BOTTOM).x > sd
        ) {
            return { source: Side.BOTTOM, target: Side.LEFT };
        }

        // Two-corner connections (fallback).
        const srcTop = sourceAnchors.get(Side.TOP);
        const tgtTop = targetAnchors.get(Side.TOP);
        if (!Bounds.includes(targetAnchors.bounds, srcTop) && !Bounds.includes(sourceAnchors.bounds, tgtTop)) {
            return { source: Side.TOP, target: Side.TOP };
        }
        const srcRight = sourceAnchors.get(Side.RIGHT);
        const tgtRight = targetAnchors.get(Side.RIGHT);
        if (!Bounds.includes(targetAnchors.bounds, srcRight) && !Bounds.includes(sourceAnchors.bounds, tgtRight)) {
            return { source: Side.RIGHT, target: Side.RIGHT };
        }

        return { source: Side.RIGHT, target: Side.LEFT };
    }

    /** Computes 0, 1, or 2 corner points for a fresh default route between the given sides. */
    protected calculateCorners(
        sourceAnchors: DefaultAnchors,
        targetAnchors: DefaultAnchors,
        sides: { source: Side; target: Side },
        options: StickyManhattanRouterOptions
    ): Point[] {
        const src = sourceAnchors.get(sides.source);
        const tgt = targetAnchors.get(sides.target);
        const sd = options.standardDistance;

        switch (sides.source) {
            case Side.RIGHT:
                switch (sides.target) {
                    case Side.LEFT: {
                        if (src.y !== tgt.y) {
                            const midX = Math.round((src.x + tgt.x) / 2);
                            return [
                                { x: midX, y: src.y },
                                { x: midX, y: tgt.y }
                            ];
                        }
                        return [];
                    }
                    case Side.TOP:
                    case Side.BOTTOM:
                        return [{ x: tgt.x, y: src.y }];
                    case Side.RIGHT: {
                        const maxX = Math.round(Math.max(src.x, tgt.x) + 1.5 * sd);
                        return [
                            { x: maxX, y: src.y },
                            { x: maxX, y: tgt.y }
                        ];
                    }
                }
                break;

            case Side.LEFT:
                switch (sides.target) {
                    case Side.RIGHT: {
                        if (src.y !== tgt.y) {
                            const midX = Math.round((src.x + tgt.x) / 2);
                            return [
                                { x: midX, y: src.y },
                                { x: midX, y: tgt.y }
                            ];
                        }
                        return [];
                    }
                    case Side.TOP:
                    case Side.BOTTOM:
                        return [{ x: tgt.x, y: src.y }];
                    default: {
                        const minX = Math.round(Math.min(src.x, tgt.x) - 1.5 * sd);
                        return [
                            { x: minX, y: src.y },
                            { x: minX, y: tgt.y }
                        ];
                    }
                }

            case Side.TOP:
                switch (sides.target) {
                    case Side.BOTTOM: {
                        if (src.x !== tgt.x) {
                            const midY = Math.round((src.y + tgt.y) / 2);
                            return [
                                { x: src.x, y: midY },
                                { x: tgt.x, y: midY }
                            ];
                        }
                        return [];
                    }
                    case Side.TOP: {
                        const minY = Math.round(Math.min(src.y, tgt.y) - 1.5 * sd);
                        return [
                            { x: src.x, y: minY },
                            { x: tgt.x, y: minY }
                        ];
                    }
                    case Side.RIGHT:
                    case Side.LEFT:
                        return [{ x: src.x, y: tgt.y }];
                }
                break;

            case Side.BOTTOM:
                switch (sides.target) {
                    case Side.TOP: {
                        if (src.x !== tgt.x) {
                            const midY = Math.round((src.y + tgt.y) / 2);
                            return [
                                { x: src.x, y: midY },
                                { x: tgt.x, y: midY }
                            ];
                        }
                        return [];
                    }
                    case Side.BOTTOM: {
                        const maxY = Math.round(Math.max(src.y, tgt.y) + 1.5 * sd);
                        return [
                            { x: src.x, y: maxY },
                            { x: tgt.x, y: maxY }
                        ];
                    }
                    case Side.RIGHT:
                    case Side.LEFT:
                        return [{ x: src.x, y: tgt.y }];
                }
                break;
        }

        const midX = Math.round((src.x + tgt.x) / 2);
        return [
            { x: midX, y: src.y },
            { x: midX, y: tgt.y }
        ];
    }

    protected correctX(routingPoints: Point[], index: number, x: number, minimalPointDistance: number): number {
        if (index > 0 && Math.abs(x - routingPoints[index - 1].x) < minimalPointDistance) {
            return routingPoints[index - 1].x;
        }
        if (index < routingPoints.length - 2 && Math.abs(x - routingPoints[index + 2].x) < minimalPointDistance) {
            return routingPoints[index + 2].x;
        }
        return x;
    }

    protected correctY(routingPoints: Point[], index: number, y: number, minimalPointDistance: number): number {
        if (index > 0 && Math.abs(y - routingPoints[index - 1].y) < minimalPointDistance) {
            return routingPoints[index - 1].y;
        }
        if (index < routingPoints.length - 2 && Math.abs(y - routingPoints[index + 2].y) < minimalPointDistance) {
            return routingPoints[index + 2].y;
        }
        return y;
    }

    protected alignX(points: Point[], index: number, x: number): void {
        if (index >= 0 && index < points.length) {
            points[index] = { x, y: points[index].y };
        }
    }

    protected alignY(points: Point[], index: number, y: number): void {
        if (index >= 0 && index < points.length) {
            points[index] = { x: points[index].x, y };
        }
    }
}
