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

import { Dimension, Point } from 'sprotty-protocol/lib/utils/geometry';
import { equalUpTo } from './utils/math-util';
import { AnyObject, hasNumberProp } from './utils/type-util';

declare module 'sprotty-protocol/lib/utils/geometry' {
    namespace Dimension {
        /**
         * The smallest valid dimension with width, and height set to 0.
         */
        const ZERO: Dimension;

        /**
         * Type guard to check if the given object is a bound.
         * @param dimension the object to be checked
         */
        function is(dimension: any): dimension is Dimension;

        /**
         * Applies the given function to the `width` and `height` of the given dimensional object to create a new dimensional object.
         *
         * @param dimension source dimension
         * @param callbackfn function applied to `width` and `height` to create a new dimension
         * @returns new dimension
         */
        function map<T extends Dimension>(dimension: T, callbackfn: (value: number, key: keyof Dimension) => number): T;

        /**
         * Returns the center point of the given dimension.
         *
         * @param dimension dimension
         * @returns center point
         */
        function center(dimension: Dimension): Point;

        /**
         * Computes the sum of two dimensions. The result has the sum of the `width` and `height` of the two dimensions.
         * @param dimension the first dimension
         * @param add the second dimension
         * @returns the sum of the two dimensions
         */
        function add(dimension: Dimension, add: Dimension): Dimension;

        /**
         * Computes the difference of two dimensions. The result has the difference of the `width` and `height` of the two dimensions.
         * @param dimension the first dimension
         * @param subtract the second dimension
         * @returns the difference of the two dimensions
         */
        function subtract(dimension: Dimension, subtract: Dimension): Dimension;

        /**
         * Computes the product of a dimension and a measure.
         * The result has the `width` and `height` of the dimension multiplied by the measure.
         * @param dimension the dimension
         * @param measure the measure
         * @returns the product of the dimension and the measure
         */
        function multiplyMeasure(dimension: Dimension, measure: number): Dimension;

        /**
         * Computes the quotient of a dimension and a measure.
         * @param dimension the dimension
         * @param measure the measure
         * @returns the quotient of the dimension and the measure
         */
        function divideMeasure(dimension: Dimension, measure: number): Dimension;

        /**
         * Checks if two dimensions are equal. Two dimensions are equal if their `width` and `height` are equal.
         * @param left the left dimension
         * @param right the right dimension
         * @param eps @param eps the epsilon for the comparison
         * @returns true if the dimensions are equal, false otherwise
         */
        function equals(left: Dimension, right: Dimension, eps?: number): boolean;

        /**
         * Creates a new dimension from the given point. The `width` and `height` of the new dimension are the `x` and `y` of the point.
         * @param point the point
         * @returns new dimension
         */
        function fromPoint(point: Point): Dimension;

        /**
         * Computes the area of the given dimension.
         * @param dimension the dimension
         * @returns the area of the dimension
         */
        function area(dimension: Dimension): number;
    }
}

(Dimension as any).ZERO = Object.freeze({
    width: 0,
    height: 0
});

Dimension.is = (dimension: any): dimension is Dimension =>
    AnyObject.is(dimension) && hasNumberProp(dimension, 'width') && hasNumberProp(dimension, 'height');
Dimension.center = (d: Dimension): Point => ({ x: d.width * 0.5, y: d.height * 0.5 });
Dimension.add = (d: Dimension, a: Dimension): Dimension => ({ width: d.width + a.width, height: d.height + a.height });
Dimension.subtract = (d: Dimension, a: Dimension): Dimension => ({ width: d.width - a.width, height: d.height - a.height });
Dimension.multiplyMeasure = (d: Dimension, m: number): Dimension => ({ width: d.width * m, height: d.height * m });
Dimension.divideMeasure = (d: Dimension, m: number): Dimension => ({ width: d.width / m, height: d.height / m });

Dimension.map = <T extends Dimension>(dimension: T, callbackfn: (value: number, key: keyof Dimension) => number): T => ({
    ...dimension,
    width: callbackfn(dimension.width, 'width'),
    height: callbackfn(dimension.height, 'height')
});
Dimension.equals = (left: Dimension, right: Dimension, eps?: number): boolean =>
    equalUpTo(left.width, right.width, eps) && equalUpTo(left.height, right.height, eps);
Dimension.fromPoint = (point: Point): Dimension => ({ width: point.x, height: point.y });
Dimension.area = (dimension: Dimension): number => dimension.width * dimension.height;

export { Dimension };
