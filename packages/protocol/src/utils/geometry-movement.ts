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

import { Point } from '../sprotty-geometry-point';
import { Direction } from './geometry-util';
import { Vector } from './geometry-vector';
import { AnyObject, hasObjectProp } from './type-util';

/**
 * A movement in 2D space. A movement is defined by a starting point, an end point, a vector that describes the direction and magnitude.
 */
export interface Movement {
    /**
     * The starting point of the movement.
     */
    from: Point;
    /**
     * The end point of the movement.
     */
    to: Point;
    /**
     * The vector that describes the direction and magnitude of the movement.
     */
    vector: Vector;
    /**
     * The directions that the movement is composed of, derived from the vector
     */
    direction: Direction[];
}

/**
 * A collection of utility functions for working with movements.

 */
export namespace Movement {
    /**
     * The zero movement. It has from and to set to the origin and the vector set to zero.
     */
    export const ZERO = Object.freeze<Movement>({
        from: Point.ORIGIN,
        to: Point.ORIGIN,
        vector: Vector.ZERO,
        direction: []
    });

    /**
     * A type guard that checks if the given object is a movement.
     * @param obj the object to check
     * @returns true if the object is a movement, false otherwise
     */
    export function is(obj: any): obj is Movement {
        return (
            AnyObject.is(obj) &&
            hasObjectProp(obj, 'from') &&
            Point.is((obj as any).from) &&
            hasObjectProp(obj, 'to') &&
            Point.is((obj as any).to) &&
            hasObjectProp(obj, 'vector') &&
            Vector.is((obj as any).to) &&
            hasObjectProp(obj, 'direction')
        );
    }

    /**
     * Checks if the given movement is stationary, i.e. the starting point and end point are equal and the vector is zero.
     * @param movement the movement to check
     * @returns true if the movement is stationary, false otherwise
     */
    export function isStationary(movement: Movement): boolean {
        return Vector.isZero(movement.vector);
    }

    /**
     * Checks if the given movement is zero, i.e., all values are zero.
     * @param movement the movement to check
     * @returns true if the movement is zero, false otherwise
     */
    export function isZero(movement: Movement): boolean {
        return Movement.equals(movement, ZERO);
    }

    /**
     * Checks if two movements are equal. Two movements are equal if their starting points, end points, and vectors are equal.
     * @param left the left movement
     * @param right the right movement
     * @returns true if the movements are equal, false otherwise
     */
    export function equals(left: Movement, right: Movement): boolean {
        return Point.equals(left.from, right.from) && Point.equals(left.to, right.to) && Vector.equals(left.vector, right.vector);
    }
}
