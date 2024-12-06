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
    PolylineEdgeRouter
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
