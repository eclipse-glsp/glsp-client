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

import { Point } from '@eclipse-glsp/protocol';
import { injectable } from 'inversify';
import {
    SConnectableElementImpl,
    SParentElementImpl,
    SRoutableElementImpl,
    AbstractEdgeRouter as SprottyAbstractEdgeRouter,
    BezierEdgeRouter as SprottyBezierEdgeRouter,
    ManhattanEdgeRouter as SprottyManhattanEdgeRouter,
    PolylineEdgeRouter as SprottyPolylineEdgeRouter
} from 'sprotty';
import { GConnectableElement, GParentElement, GRoutableElement } from './re-exports';

@injectable()
export abstract class AbstractEdgeRouter extends SprottyAbstractEdgeRouter {
    override getTranslatedAnchor(
        connectable: SConnectableElementImpl,
        refPoint: Point,
        refContainer: SParentElementImpl,
        edge: SRoutableElementImpl,
        anchorCorrection?: number | undefined
    ): Point {
        // users may define all kinds of anchors and anchor computers, we want to make sure we return a valid one in any case
        const anchor = super.getTranslatedAnchor(connectable, refPoint, refContainer, edge, anchorCorrection);
        return Point.isValid(anchor) ? anchor : refPoint;
    }
}

@injectable()
export class PolylineEdgeRouter extends SprottyPolylineEdgeRouter {
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
}

@injectable()
export class ManhattanEdgeRouter extends SprottyManhattanEdgeRouter {
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
}

@injectable()
export class BezierEdgeRouter extends SprottyBezierEdgeRouter {
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
}
