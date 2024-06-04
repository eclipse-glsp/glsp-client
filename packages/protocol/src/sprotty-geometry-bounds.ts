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
/* eslint-disable @typescript-eslint/no-shadow */

import { Bounds } from 'sprotty-protocol/lib/utils/geometry';
import { Dimension } from './sprotty-geometry-dimension';
import { Point } from './sprotty-geometry-point';
import { AnyObject, hasNumberProp } from './utils/type-util';

declare module 'sprotty-protocol/lib/utils/geometry' {
    namespace Bounds {
        /**
         * The empty bounds with valid dimensions. It has x, y, width, and height set to 0.
         */
        const ZERO: Bounds;

        /**
         * Type guard to check if the given object is a bound.
         * @param bounds the object to be checked
         */
        function is(bounds: any): bounds is Bounds;

        /**
         * Type guard to check if a bound is valid. For a bound to be valid it needs to be defined and have valid
         * coordinates and dimensions.
         *
         * @param bounds the bounds to be checked for validity
         */
        function isValid(bounds?: Bounds): bounds is Bounds;

        /**
         * Checks whether the inner bounds are compeletely encompassed by the outer bounds.
         *
         * @param outer outer bounds
         * @param inner inner bounds
         * @returns true if the outer bounds completely encompass the inner bounds
         */
        function encompasses(outer: Bounds, inner: Bounds): boolean;

        /**
         * Checks whether the two bounds overlap.
         *
         * @param left left bounds
         * @param right right bounds
         * @param touch if true the bounds are considered to overlap if they touch each other
         * @returns true if the two bounds overlap
         */
        function overlap(left: Bounds, right: Bounds, touch?: boolean): boolean;

        /**
         * Checks whether the two bounds are equal.
         * @param left left bounds
         * @param right right bounds
         * @param eps the epsilon for the comparison
         * @returns true if the two bounds are equal
         */
        function equals(left: Bounds, right: Bounds, eps?: number): boolean;

        /**
         * Returns the x-coordinate of the left edge of the bounds.
         * @param bounds the bounds
         * @returns the x-coordinate of the left edge
         */
        function left(bounds: Bounds): number;

        /**
         * Returns the x-coordinate of the center of the bounds.
         * @param bounds the bounds
         * @returns the x-coordinate of the center
         */
        function centerX(bounds: Bounds): number;

        /**
         * Returns the x-coordinate of the right edge of the bounds.
         * @param bounds the bounds
         * @returns the x-coordinate of the right edge
         */
        function right(bounds: Bounds): number;

        /**
         * Returns the y-coordinate of the top edge of the bounds.
         * @param bounds the bounds
         * @returns the y-coordinate of the top edge
         */
        function top(bounds: Bounds): number;

        /**
         * Returns the y-coordinate of the middle of the bounds.
         * @param bounds the bounds
         * @returns the y-coordinate of the middle
         */
        function middle(bounds: Bounds): number;

        /**
         * Returns the y-coordinate of the center of the bounds.
         * @param bounds the bounds
         * @returns the y-coordinate of the center
         */
        function centerY(bounds: Bounds): number;

        /**
         * Returns the y-coordinate of the bottom edge of the bounds.
         * @param bounds the bounds
         * @returns the y-coordinate of the bottom edge
         */
        function bottom(bounds: Bounds): number;

        /**
         * Returns the top left corner of the bounds.
         * @param bounds the bounds
         * @returns the top left corner
         */
        function topLeft(bounds: Bounds): Point;

        /**
         * Returns the top center point of the bounds.
         * @param bounds the bounds
         * @returns the top center point
         */
        function topCenter(bounds: Bounds): Point;

        /**
         * Returns the top right corner of the bounds.
         * @param bounds the bounds
         * @returns the top right corner
         */
        function topRight(bounds: Bounds): Point;

        /**
         * Returns the middle left point of the bounds.
         * @param bounds the bounds
         * @returns the middle left point
         */
        function middleLeft(bounds: Bounds): Point;

        /**
         * Returns the middle center point of the bounds.
         * @param bounds the bounds
         * @returns the middle center point
         */
        function middleCenter(bounds: Bounds): Point;

        /**
         * Returns the middle right point of the bounds.
         * @param bounds the bounds
         * @returns the middle right point
         */
        function middleRight(bounds: Bounds): Point;

        /**
         * Returns the bottom left corner of the bounds.
         * @param bounds the bounds
         * @returns the bottom left corner
         */
        function bottomLeft(bounds: Bounds): Point;

        /**
         * Returns the bottom center point of the bounds.
         * @param bounds the bounds
         * @returns the bottom center point
         */
        function bottomCenter(bounds: Bounds): Point;

        /**
         * Returns the bottom right corner of the bounds.
         * @param bounds the bounds
         * @returns the bottom right corner
         */
        function bottomRight(bounds: Bounds): Point;

        /**
         * Checks if the left bounds are above the right bounds, i.e., the top edge of the left bounds is
         * above the top edge of the right bounds.
         * @param leftBounds the left bounds
         * @param rightBounds the right bounds
         * @returns true if the left bounds are above the right bounds
         */
        function isAbove(leftBounds: Bounds, rightBounds: Bounds): boolean;

        /**
         * Checks if the left bounds are below the right bounds, i.e., the top edge of the left bounds is
         * below the top edge of the right bounds.
         * @param leftBounds the left bounds
         * @param rightBounds the right bounds
         * @returns true if the left bounds are below the right bounds
         */
        function isBelow(leftBounds: Bounds, rightBounds: Bounds): boolean;

        /**
         * Checks if the left bounds are before the right bounds, i.e., the left edge of the left bounds is
         * before the left edge of the right bounds.
         * @param leftBounds the left bounds
         * @param rightBounds the right bounds
         * @returns true if the left bounds are before the right bounds
         */
        function isBefore(leftBounds: Bounds, rightBounds: Bounds): boolean;

        /**
         * Checks if the left bounds are after the right bounds, i.e., the left edge of the left bounds is
         * after the left edge of the right bounds.
         * @param leftBounds the left bounds
         * @param rightBounds the right bounds
         * @returns true if the left bounds are after the right bounds
         */
        function isAfter(leftBounds: Bounds, rightBounds: Bounds): boolean;

        /**
         * Creates a bounds from the given top left and bottom right points.
         * @param topLeft top left point
         * @param bottomRight bottom right point
         * @returns the bounds
         */
        function from(topLeft: Point, bottomRight: Point): Bounds;

        /**
         * Creates a new point from the given bounds by removing the `width` and `height` of the bounds.
         * This is the same as the top-left point but this method may carry more semantics.
         * @param bounds the bounds
         * @returns new point
         */
        function position(bounds: Bounds): Point;

        /**
         * Creates a new dimension from the given bounds by removing the `x` and `y` of the bounds.
         * @param bounds the bounds
         * @returns new dimension
         */
        function dimension(bounds: Bounds): Dimension;

        /**
         * Sorts the given bounds by the given rank function.
         * @param rankFunc the rank function
         * @param bounds the bounds to sort
         * @returns the sorted bounds
         */
        function sortBy<T>(rankFunc: (elem: T) => number, ...bounds: T[]): T[];

        /**
         * Moves the bounds by the given delta.
         * @param bounds the bounds to move
         * @param delta the delta to move the bounds by
         * @returns the moved bounds
         */
        function move(bounds: Bounds, delta: Point): Bounds;

        /**
         * Resizes the bounds by the given delta.
         * @param bounds the bounds to resize
         * @param delta the delta to resize the bounds by
         * @returns the resized bounds
         */
        function resize(bounds: Bounds, delta: Dimension): Bounds;
    }
}

(Bounds as any).ZERO = Object.freeze({
    x: 0,
    y: 0,
    width: 0,
    height: 0
});

Bounds.is = (bounds: any): bounds is Bounds =>
    AnyObject.is(bounds) &&
    hasNumberProp(bounds, 'x') &&
    hasNumberProp(bounds, 'y') &&
    hasNumberProp(bounds, 'width') &&
    hasNumberProp(bounds, 'height');

Bounds.isValid = (bounds?: Bounds): bounds is Bounds => bounds !== undefined && Dimension.isValid(bounds) && Point.isValid(bounds);

Bounds.encompasses = (outer: Bounds, inner: Bounds): boolean =>
    Bounds.includes(outer, Bounds.topLeft(inner)) && Bounds.includes(outer, Bounds.bottomRight(inner));

Bounds.overlap = (one: Bounds, other: Bounds, touch?: boolean): boolean => {
    const oneTopLeft: Point = Bounds.topLeft(one);
    const oneBottomRight = Bounds.bottomRight(one);
    const otherTopLeft: Point = Bounds.topLeft(other);
    const otherBottomRight = Bounds.bottomRight(other);
    return touch
        ? oneTopLeft.x <= otherBottomRight.x &&
              otherTopLeft.x <= oneBottomRight.x &&
              oneBottomRight.y >= otherTopLeft.y &&
              otherBottomRight.y >= oneTopLeft.y
        : oneTopLeft.x < otherBottomRight.x &&
              otherTopLeft.x < oneBottomRight.x &&
              oneBottomRight.y > otherTopLeft.y &&
              otherBottomRight.y > oneTopLeft.y;
};

Bounds.equals = (left: Bounds, right: Bounds, eps?: number): boolean =>
    Point.equals(left, right, eps) && Dimension.equals(left, right, eps);

Bounds.left = (bounds: Bounds): number => bounds.x;

Bounds.centerX = (bounds: Bounds): number => bounds.x + (bounds.width >= 0 ? bounds.width * 0.5 : 0);

Bounds.right = (bounds: Bounds): number => bounds.x + bounds.width;

Bounds.top = (bounds: Bounds): number => bounds.y;

Bounds.middle = (bounds: Bounds): number => bounds.y + (bounds.height >= 0 ? bounds.height * 0.5 : 0);

Bounds.centerY = Bounds.middle;

Bounds.bottom = (bounds: Bounds): number => bounds.y + bounds.height;

Bounds.topLeft = (bounds: Bounds): Point => ({ x: Bounds.left(bounds), y: Bounds.top(bounds) });

Bounds.topCenter = (bounds: Bounds): Point => ({ x: Bounds.centerX(bounds), y: Bounds.top(bounds) });

Bounds.topRight = (bounds: Bounds): Point => ({ x: Bounds.right(bounds), y: Bounds.top(bounds) });

Bounds.middleLeft = (bounds: Bounds): Point => ({ x: Bounds.left(bounds), y: Bounds.middle(bounds) });

Bounds.middleCenter = (bounds: Bounds): Point => ({ x: Bounds.centerX(bounds), y: Bounds.middle(bounds) });

Bounds.middleRight = (bounds: Bounds): Point => ({ x: Bounds.right(bounds), y: Bounds.middle(bounds) });

Bounds.bottomLeft = (bounds: Bounds): Point => ({ x: Bounds.left(bounds), y: Bounds.bottom(bounds) });

Bounds.bottomCenter = (bounds: Bounds): Point => ({ x: Bounds.centerX(bounds), y: Bounds.bottom(bounds) });

Bounds.bottomRight = (bounds: Bounds): Point => ({ x: Bounds.right(bounds), y: Bounds.bottom(bounds) });

Bounds.isAbove = (leftBounds: Bounds, rightBounds: Bounds): boolean => Bounds.top(leftBounds) <= Bounds.top(rightBounds);

Bounds.isBelow = (leftBounds: Bounds, rightBounds: Bounds): boolean => Bounds.top(leftBounds) >= Bounds.top(rightBounds);

Bounds.isBefore = (leftBounds: Bounds, rightBounds: Bounds): boolean => Bounds.left(leftBounds) < Bounds.left(rightBounds);

Bounds.isAfter = (leftBounds: Bounds, rightBounds: Bounds): boolean => Bounds.left(leftBounds) >= Bounds.left(rightBounds);

Bounds.sortBy = <T>(rankFunc: (elem: T) => number, ...bounds: T[]): T[] => bounds.sort((left, right) => rankFunc(left) - rankFunc(right));

Bounds.from = (topLeft: Point, bottomRight: Point): Bounds => ({
    ...topLeft,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
});

Bounds.position = Bounds.topLeft;

Bounds.dimension = (bounds: Bounds): Dimension => ({ width: bounds.width, height: bounds.height });

Bounds.move = Bounds.translate;

Bounds.resize = (bounds: Bounds, delta: Dimension): Bounds => ({
    ...bounds,
    width: bounds.width + delta.width,
    height: bounds.height + delta.height
});

export { Bounds };
