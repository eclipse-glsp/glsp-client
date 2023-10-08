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
    Bounds,
    BoundsAware,
    Dimension,
    GChildElement,
    Point,
    GModelElement,
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
    let xPos = point.x;
    let yPos = point.y;
    const canvasBounds = target.root.canvasBounds;
    xPos -= canvasBounds.x;
    yPos -= canvasBounds.y;

    const viewport: Viewport | undefined = findParentByFeature(target, isViewport);
    const zoom = viewport ? viewport.zoom : 1;
    if (viewport) {
        const scroll: Point = { x: viewport.scroll.x, y: viewport.scroll.y };
        xPos += scroll.x * zoom;
        yPos += scroll.y * zoom;

        xPos /= zoom;
        yPos /= zoom;
    }

    return {
        x: xPos,
        y: yPos
    };
}

/**
 * Translates the bounds of the diagram element (local coordinates) into the diagram coordinates system
 * (i.e. relative to the Diagram's 0;0 point)
 *
 * @param target  A bounds-aware element from the diagram
 */
export function toAbsoluteBounds(element: GModelElement & BoundsAware): Bounds {
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
export function toAbsolutePosition(target: GModelElement & BoundsAware): Point {
    return toAbsoluteBounds(target);
}

/**
 * Translates the size of the diagram element (local coordinates) into the diagram coordinates system
 * (i.e. relative to the Diagram's 0;0 point)
 *
 * @param target  A bounds-aware element from the diagram
 */
export function toAbsoluteSize(target: GModelElement & BoundsAware): Dimension {
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
    return { x: absolutePoint.x - absoluteElementBounds.x, y: absolutePoint.y - absoluteElementBounds.y };
}
