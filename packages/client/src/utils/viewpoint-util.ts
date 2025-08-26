/********************************************************************************
 * Copyright (c) 2019-2025 EclipseSource and others.
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
    Dimension,
    GChildElement,
    GModelElement,
    GModelRoot,
    Point,
    Viewport,
    findParentByFeature,
    isAlignable,
    isBoundsAware,
    isViewport,
    translateBounds
} from '@eclipse-glsp/sprotty';
import { BoundsAwareModelElement } from './gmodel-util';

/**
 * Return the position corresponding to this mouse event (Browser coordinates)
 * in the diagram coordinates system (i.e. relative to the Diagram's 0;0 point)
 *
 * This functions takes into account the following transformations:
 * - Location of the Diagram Canvas inside of the browser's page
 * - Current viewport Scroll and Zoom
 *
 * @param target
 *  An element from the diagram
 * @param mouseEvent
 *  A mouseEvent
 */
export function getAbsolutePosition(target: GModelElement, mouseEvent: MouseEvent): Point {
    return getAbsolutePositionByPoint(target, { x: mouseEvent.pageX, y: mouseEvent.pageY });
}

export function getAbsolutePositionByPoint(target: GModelElement, point: Point): Point {
    let position = Point.subtract(point, target.root.canvasBounds);

    const viewport: Viewport | undefined = findParentByFeature(target, isViewport);
    if (viewport) {
        const zoom = viewport.zoom;
        const zoomedScroll = Point.multiplyScalar(viewport.scroll, zoom);
        position = Point.add(position, zoomedScroll);
        position = Point.divideScalar(position, zoom);
    }

    return position;
}

export function getViewportBounds(target: GModelElement, bounds: Bounds): Bounds {
    const topLeft = getAbsolutePositionByPoint(target, Bounds.topLeft(bounds));
    const bottomRight = getAbsolutePositionByPoint(target, Bounds.bottomRight(bounds));
    return Bounds.from(topLeft, bottomRight);
}

/**
 * Translates the bounds of the diagram element (local coordinates) into the diagram coordinates system
 * (i.e. relative to the Diagram's 0;0 point)
 *
 * @param target  A bounds-aware element from the diagram
 */
export function toAbsoluteBounds(element: BoundsAwareModelElement): Bounds {
    const location = isAlignable(element) ? element.alignment : Point.ORIGIN;
    const x = location.x;
    const y = location.y;
    const width = element.bounds.width;
    const height = element.bounds.height;
    return translateBounds({ x, y, width, height }, element, element.root);
}

/**
 * Translates the position of the diagram element (local coordinates) into the diagram coordinates system
 * (i.e. relative to the Diagram's 0;0 point)
 *
 * @param target  A bounds-aware element from the diagram
 */
export function toAbsolutePosition(target: BoundsAwareModelElement): Point {
    return toAbsoluteBounds(target);
}

/**
 * Translates the size of the diagram element (local coordinates) into the diagram coordinates system
 * (i.e. relative to the Diagram's 0;0 point)
 *
 * @param target  A bounds-aware element from the diagram
 */
export function toAbsoluteSize(target: BoundsAwareModelElement): Dimension {
    return toAbsoluteBounds(target);
}

/**
 * Convert a point, specified in absolute coordinates, to a point relative
 * to the parent of the specified child element.
 *
 * @param element the child element
 * @param absolutePoint a point in absolute coordinates
 * @returns the equivalent point, relative to the element's parent coordinates
 */
export function absoluteToParent(element: BoundsAwareModelElement & GChildElement, absolutePoint: Point): Point {
    if (isBoundsAware(element.parent)) {
        return absoluteToLocal(element.parent, absolutePoint);
    }
    // If the parent is not bounds-aware, assume it's at 0; 0 and proceed
    return absoluteToLocal(element, absolutePoint);
}

/**
 * Convert a point, specified in absolute coordinates, to a point relative
 * to the specified element.
 *
 * @param element the element
 * @param absolutePoint a point in absolute coordinates
 * @returns the equivalent point, relative to the element's coordinates
 */
export function absoluteToLocal(element: BoundsAwareModelElement, absolutePoint: Point): Point {
    const absoluteElementBounds = toAbsoluteBounds(element);
    return Point.subtract(absolutePoint, absoluteElementBounds);
}

/**
 * Returns `true` if `point` is outside of the `viewport`.
 * @param point The point to check.
 * @param viewport The viewport.
 * @returns `true` if `point` is outside, `false` otherwise.
 */
export function outsideOfViewport(point: Point, viewport: GModelRoot & Viewport): boolean {
    return (
        point.x < viewport.scroll.x ||
        point.x > viewport.scroll.x + viewport.canvasBounds.width / viewport.zoom ||
        point.y < viewport.scroll.y ||
        point.y > viewport.scroll.y + viewport.canvasBounds.height / viewport.zoom
    );
}
