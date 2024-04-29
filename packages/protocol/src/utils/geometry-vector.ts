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

import { Direction } from './geometry-util';
import { AnyObject, hasNumberProp } from './type-util';

/**
 * A vector in two-dimensional space with an x and y component. A vector describes a direction and magnitued
 * epresented by coordinates that describe its endpoint relative to a starting point.
 */
export interface Vector {
    x: number;
    y: number;
}

/**
 * A collection of utility functions for working with vectors.
 */
export namespace Vector {
    /**
     * The zero vector. It has x and y set to 0.
     */
    export const ZERO: Vector = Object.freeze({
        x: 0,
        y: 0
    });

    /**
     * Compute the absolute value of the vector.
     * @param vector the vector to compute the absolute value of
     * @returns the absolute value of the vector
     */
    export function abs(vector: Vector): Vector {
        return { x: Math.abs(vector.x), y: Math.abs(vector.y) };
    }

    /**
     * Computes the sum of two vectors.
     * @param vector the vector to add to
     * @param addend the vector to add
     * @returns the sum of the two vectors
     */
    export function add(vector: Vector, addend: Vector): Vector {
        return { x: vector.x + addend.x, y: vector.y + addend.y };
    }

    /**
     * Check if two vectors are equal.
     * @param left the left vector
     * @param right the right vector
     * @returns true if the vectors are equal, false otherwise
     */
    export function equals(left: Vector, right: Vector): boolean {
        return left.x === right.x && left.y === right.y;
    }

    /**
     * Check if a vector is valid. A vector is valid if it is not undefined and both x and y are numbers.
     * @param vector the vector to check
     * @returns true if the vector is valid, false otherwise
     */
    export function isValid(vector?: Vector): boolean {
        return vector !== undefined && !isNaN(vector.x) && !isNaN(vector.y);
    }

    /**
     * Computes the magnitude of a vector defined as the square root of the sum of the squares of the x and y components.
     * @param point the vector to compute the magnitude of
     * @returns the magnitude of the vector
     */
    export function magnitude(point: Vector): number {
        return Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
    }

    /**
     * Maps each component of the vector to a new value given by the callback function.
     * @param vector the vector to map
     * @param callbackfn the function to map the components
     * @returns the mapped vector
     */
    export function map(vector: Vector, callbackfn: (value: number, key: keyof Vector) => number): Vector {
        return {
            ...vector,
            x: callbackfn(vector.x, 'x'),
            y: callbackfn(vector.y, 'y')
        };
    }

    /**
     * Computes the normalized vector of a given vector.
     * The normalized vector has the same direction as the original vector but a magnitude of 1.
     *
     * @param vector the vector to normalize
     * @returns the normalized vector
     */
    export function normalize(vector: Vector): Vector {
        const mag = magnitude(vector);
        if (mag === 0 || mag === 1) {
            return ZERO;
        }
        return {
            x: vector.x / mag,
            y: vector.y / mag
        };
    }

    /**
     * Check if a vector is the zero vector.
     * @param vector the vector to check
     * @returns true if the vector is the zero vector, false otherwise
     */
    export function isZero(vector: Vector): boolean {
        return Vector.equals(vector, ZERO);
    }

    /**
     * Type guard to check if a value is a vector.
     * @param vector the value to check
     * @returns true if the value is a vector, false otherwise
     */
    export function is(vector: any): vector is Vector {
        return AnyObject.is(vector) && hasNumberProp(vector, 'x') && hasNumberProp(vector, 'y');
    }

    /**
     * Divides each component of the vector by a scalar.
     *
     * @param vector the vector to divide
     * @param scalar the scalar to divide by
     * @returns the divided vector
     */
    export function divide(vector: Vector, scalar: number): Vector {
        return Vector.map(vector, coordinate => coordinate / scalar);
    }

    /**
     * Multiplies each component of the vector by a scalar.
     *
     * @param vector the vector to multiply
     * @param scalar the scalar to multiply by
     * @returns the multiplied vector
     */
    export function multiply(vector: Vector, scalar: number): Vector {
        return Vector.map(vector, coordinate => coordinate * scalar);
    }

    /**
     * Subtracts the subtrahend from the vector.
     *
     * @param vector the vector to subtract from
     * @param subtrahend the vector to subtract
     * @returns the subtracted vector
     */
    export function subtract(vector: Vector, subtrahend: Vector): Vector {
        return { x: vector.x - subtrahend.x, y: vector.y - subtrahend.y };
    }

    /**
     * Reverse the direction of a vector.
     * @param vector the vector to reverse
     * @returns the reversed vector
     */
    export function reverse(vector: Vector): Vector {
        return { x: -vector.x, y: -vector.y };
    }

    /**
     * Computes the direction of a vector
     * @param vector the vector to compute the direction of
     * @returns the direction of the vector
     */
    export function direction(vector: Vector): Direction[] {
        const directions: Direction[] = [];
        if (vector.x < 0) {
            directions.push(Direction.Left);
        } else if (vector.x > 0) {
            directions.push(Direction.Right);
        }
        if (vector.y < 0) {
            directions.push(Direction.Up);
        } else if (vector.y > 0) {
            directions.push(Direction.Down);
        }
        return directions;
    }

    /**
     * Computes a vector that is the minimum of all given vectors.
     * @returns the minimum vector
     */
    export function min(...vectors: Vector[]): Vector {
        return {
            x: Math.min(...vectors.map(vector => vector.x)),
            y: Math.min(...vectors.map(vector => vector.y))
        };
    }

    /**
     * Computes a vector that is the maximum of all given vectors.
     * @returns the maximum vector
     */
    export function max(...vectors: Vector[]): Vector {
        return {
            x: Math.max(...vectors.map(vector => vector.x)),
            y: Math.max(...vectors.map(vector => vector.y))
        };
    }

    /**
     * Computes a vector that is the average of all given vectors.
     * @returns the average vector
     */
    export function avg(...vectors: Vector[]): Vector {
        if (vectors.length === 0) {
            return Vector.ZERO;
        }
        return {
            x: vectors.reduce((prev, cur) => prev + cur.x, 0) / vectors.length,
            y: vectors.reduce((prev, cur) => prev + cur.y, 0) / vectors.length
        };
    }
}
