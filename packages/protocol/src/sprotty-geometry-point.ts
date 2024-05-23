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

import { Point } from 'sprotty-protocol/lib/utils/geometry';
import { Movement } from './utils/geometry-movement';
import { Vector } from './utils/geometry-vector';
import { equalUpTo } from './utils/math-util';
import { AnyObject, hasNumberProp } from './utils/type-util';

declare module 'sprotty-protocol/lib/utils/geometry' {
    namespace Point {
        /**
         * Type guard to check if the given object is a point.
         * @param point the object to be checked
         */
        function is(point: any): point is Point;
        /**
         * The absolute variant of that point, i.e., each coordinate uses its absolute value.
         *
         * @param point the point
         */
        function isOrigin(point: Point): boolean;
        /**
         * Type guard to check if a point is valid. For a point to be valid it needs to be defined and have valid x and y coordinates.
         *
         * @param point the point to be checked for validity
         */
        function isValid(point?: Point): point is Point;

        /**
         * Checks whether the given points are equal up to a certain epsilon.
         * @param one the first point
         * @param other the second point
         * @param eps @param eps the epsilon for the comparison
         */
        function equals(one: Point, other: Point, eps?: number): boolean;

        /**
         * The absolute variant of that point, i.e., each coordinate uses its absolute value.
         *
         * @param point the point
         */
        function abs(point: Point): Point;
        /**
         * Applys a uniform scaling on the given point with respect to the origin.
         * Functionally, this divides both coordinates by the given scalar.
         *
         * @param point the point to be scaled
         * @param scalar The factor by which the point schould be scaled
         */
        function divideScalar(point: Point, scalar: number): Point;

        /**
         * Applys a uniform scaling on the given point with respect to the origin.
         * Functionally, this multiplies both coordinates by the given scalar.
         *
         * @param point the point to be scaled
         * @param scalar The factor by which the point schould be scaled
         */
        function multiplyScalar(point: Point, scalar: number): Point;
        /**
         * Applies the given function to the `x` and `y` coordinate of the given point to create a new point.
         *
         * @param point source point
         * @param callbackfn function applied to the `x` and `y` coordinate of the given point to create a new point
         * @returns new point
         */
        function map<T extends Point>(point: T, callbackfn: (value: number, key: keyof Point) => number): T;
        /**
         * Snaps the given point to the nearest point on the given grid.
         *
         * @param point point to be snapped
         * @param grid grid
         * @param gridOrigin grid origin
         * @returns a point on the given grid that is closest tot he given point
         */
        function snapToGrid(point: Point, grid: Point, gridOrigin?: Point): Point;

        /**
         * Computes a vector from the given `from` point to the `to` point.
         * @param from the starting point
         * @param to the end point
         * @returns the vector from `from` to `to`
         */
        function vector(from: Point, to: Point): Vector;

        /**
         * Computes the movement from the given `from` point to the `to` point.
         * @param from the starting point
         * @param to the end point
         * @returns the movement from `from` to `to`
         */
        function move(from: Point, to: Point): Movement;

        /**
         * Computes the movement from the given `from` point in the given `vector` direction.
         * @param from the starting point
         * @param vector the vector direction
         * @returns the movement from `from` in the `vector` direction
         */
        function moveTowards(from: Point, vector: Vector): Movement;
    }
}

Point.is = (point: any): point is Point => AnyObject.is(point) && hasNumberProp(point, 'x') && hasNumberProp(point, 'y');
Point.isOrigin = (point: Point): boolean => Point.equals(point, Point.ORIGIN);
Point.isValid = (point?: Point): point is Point => point !== undefined && !isNaN(point.x) && !isNaN(point.y);
Point.abs = (point: Point): Point => Point.map(point, Math.abs);
Point.divideScalar = (point: Point, scalar: number): Point => Point.map(point, coordinate => coordinate / scalar);
Point.multiplyScalar = (point: Point, scalar: number): Point => Point.map(point, coordinate => coordinate * scalar);
Point.map = <T extends Point>(point: T, callbackfn: (value: number, key: keyof Point) => number): T => ({
    ...point,
    x: callbackfn(point.x, 'x'),
    y: callbackfn(point.y, 'y')
});
Point.snapToGrid = (point: Point, grid: Point, gridOrigin?: Point): Point => {
    if (gridOrigin) {
        // move point relative to grid origin and then restore after snapping
        const relative = Point.subtract(point, gridOrigin);
        const snapped = Point.snapToGrid(relative, grid);
        return Point.add(gridOrigin, snapped);
    } else {
        return { x: Math.round(point.x / grid.x) * grid.x, y: Math.round(point.y / grid.y) * grid.y };
    }
};
Point.vector = (from: Point, to: Point): Vector => Point.subtract(to, from);

Point.move = (from: Point, to: Point): Movement => {
    const vector = Point.vector(from, to);
    const direction = Vector.direction(vector);
    return { from, to, vector, direction };
};

Point.moveTowards = (from: Point, vector: Vector): Movement => {
    const to = Point.add(from, vector);
    const dir = Vector.direction(vector);
    return { from, to, vector, direction: dir };
};

Point.equals = (one: Point, other: Point, eps?: number): boolean => equalUpTo(one.x, other.x, eps) && equalUpTo(one.y, other.y, eps);

export { Point };
