/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
    AbstractEdgeRouter,
    BezierEdgeRouter,
    GConnectableElement,
    GParentElement,
    GRoutableElement,
    ManhattanEdgeRouter,
    Point,
    PolylineEdgeRouter,
    ResolvedHandleMove,
    almostEquals
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';

@injectable()
export abstract class GLSPAbstractEdgeRouter extends AbstractEdgeRouter {
    override getTranslatedAnchor(
        connectable: GConnectableElement,
        refPoint: Point,
        refContainer: GParentElement,
        edge: GRoutableElement,
        anchorCorrection?: number | undefined
    ): Point {
        // users may define all kinds of anchors and anchor computers, we want to make sure we return a valid one in any case
        const anchor = super.getTranslatedAnchor(connectable, refPoint, refContainer, edge, anchorCorrection);
        return Point.isValid(anchor) ? anchor : refPoint;
    }

    override cleanupRoutingPoints(edge: GRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean): void {
        // sometimes it might happen that the source or target has the bounds not properly set when using the feedback edge
        if (ensureBounds(edge.source) && ensureBounds(edge.target)) {
            super.cleanupRoutingPoints(edge, routingPoints, updateHandles, addRoutingPoints);
        }
    }
}

@injectable()
export class GLSPPolylineEdgeRouter extends PolylineEdgeRouter {
    override getTranslatedAnchor(
        connectable: GConnectableElement,
        refPoint: Point,
        refContainer: GParentElement,
        edge: GRoutableElement,
        anchorCorrection?: number | undefined
    ): Point {
        // users may define all kinds of anchors and anchor computers, we want to make sure we return a valid one in any case
        const anchor = super.getTranslatedAnchor(connectable, refPoint, refContainer, edge, anchorCorrection);
        return Point.isValid(anchor) ? anchor : refPoint;
    }

    override cleanupRoutingPoints(edge: GRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean): void {
        // sometimes it might happen that the source or target has the bounds not properly set when using the feedback edge
        if (ensureBounds(edge.source) && ensureBounds(edge.target)) {
            super.cleanupRoutingPoints(edge, routingPoints, updateHandles, addRoutingPoints);
        }
    }
}

@injectable()
export class GLSPManhattanEdgeRouter extends ManhattanEdgeRouter {
    override getTranslatedAnchor(
        connectable: GConnectableElement,
        refPoint: Point,
        refContainer: GParentElement,
        edge: GRoutableElement,
        anchorCorrection?: number | undefined
    ): Point {
        // users may define all kinds of anchors and anchor computers, we want to make sure we return a valid one in any case
        const anchor = super.getTranslatedAnchor(connectable, refPoint, refContainer, edge, anchorCorrection);
        return Point.isValid(anchor) ? anchor : refPoint;
    }

    protected override applyInnerHandleMoves(edge: GRoutableElement, moves: ResolvedHandleMove[]): void {
        const route = this.route(edge);
        const routingPoints = edge.routingPoints;
        const minimalPointDistance = this.getOptions(edge).minimalPointDistance;
        moves.forEach(move => {
            const handle = move.handle;
            const index = handle.pointIndex;
            const correctedX = this.correctX(routingPoints, index, move.toPosition.x, minimalPointDistance);
            const correctedY = this.correctY(routingPoints, index, move.toPosition.y, minimalPointDistance);
            switch (handle.kind) {
                case 'manhattan-50%':
                    if (index < 0) {
                        if (routingPoints.length === 0) {
                            routingPoints.push({ x: correctedX, y: correctedY });
                            move.handle.pointIndex = 0;
                        } else if (almostEquals(route[0].x, route[1].x)) {
                            this.alignX(routingPoints, 0, correctedX);
                        } else {
                            this.alignY(routingPoints, 0, correctedY);
                        }
                    } else if (index < routingPoints.length - 1) {
                        if (almostEquals(routingPoints[index].x, routingPoints[index + 1].x)) {
                            this.alignX(routingPoints, index, correctedX);
                            this.alignX(routingPoints, index + 1, correctedX);
                        } else {
                            this.alignY(routingPoints, index, correctedY);
                            this.alignY(routingPoints, index + 1, correctedY);
                        }
                    } else {
                        if (almostEquals(route[route.length - 2].x, route[route.length - 1].x)) {
                            this.alignX(routingPoints, routingPoints.length - 1, correctedX);
                        } else {
                            this.alignY(routingPoints, routingPoints.length - 1, correctedY);
                        }
                    }
                    break;
            }
        });
    }

    override cleanupRoutingPoints(edge: GRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean): void {
        // sometimes it might happen that the source or target has the bounds not properly set when using the feedback edge
        if (ensureBounds(edge.source) && ensureBounds(edge.target)) {
            super.cleanupRoutingPoints(edge, routingPoints, updateHandles, addRoutingPoints);
        }
    }
}

@injectable()
export class GLSPBezierEdgeRouter extends BezierEdgeRouter {
    override getTranslatedAnchor(
        connectable: GConnectableElement,
        refPoint: Point,
        refContainer: GParentElement,
        edge: GRoutableElement,
        anchorCorrection?: number | undefined
    ): Point {
        // users may define all kinds of anchors and anchor computers, we want to make sure we return a valid one in any case
        const anchor = super.getTranslatedAnchor(connectable, refPoint, refContainer, edge, anchorCorrection);
        return Point.isValid(anchor) ? anchor : refPoint;
    }

    override cleanupRoutingPoints(edge: GRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean): void {
        // sometimes it might happen that the source or target has the bounds not properly set when using the feedback edge
        if (ensureBounds(edge.source) && ensureBounds(edge.target)) {
            super.cleanupRoutingPoints(edge, routingPoints, updateHandles, addRoutingPoints);
        }
    }
}

function ensureBounds(element?: GConnectableElement): boolean {
    if (!element) {
        return false;
    }
    if (element.bounds) {
        return true;
    }
    if (element.position && element.size) {
        element.bounds = { ...element.position, ...element.size };
        return true;
    }
    return false;
}
