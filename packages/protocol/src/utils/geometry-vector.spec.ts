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
import { expect } from 'chai';
import { Direction } from './geometry-util';
import { Vector } from './geometry-vector';

describe('Vector', () => {
    describe('abs', () => {
        it('should compute the absolute value of the vector', () => {
            const vector: Vector = { x: -5, y: -10 };
            const result = Vector.abs(vector);
            expect(result).to.deep.equal({ x: 5, y: 10 });
        });
    });

    describe('add', () => {
        it('should compute the sum of two vectors', () => {
            const vector1: Vector = { x: 1, y: 2 };
            const vector2: Vector = { x: 3, y: 4 };
            const result = Vector.add(vector1, vector2);
            expect(result).to.deep.equal({ x: 4, y: 6 });
        });
    });

    describe('equals', () => {
        it('should check if two vectors are equal', () => {
            const vector1: Vector = { x: 1, y: 2 };
            const vector2: Vector = { x: 1, y: 2 };
            const result = Vector.equals(vector1, vector2);
            expect(result).to.be.true;
        });
    });

    describe('isValid', () => {
        it('should check if a vector is valid', () => {
            const vector: Vector = { x: 1, y: 2 };
            const result = Vector.isValid(vector);
            expect(result).to.be.true;
        });
    });

    describe('magnitude', () => {
        it('should compute the magnitude of a vector', () => {
            const vector: Vector = { x: 3, y: 4 };
            const result = Vector.magnitude(vector);
            expect(result).to.equal(5);
        });
    });

    describe('map', () => {
        it('should map each component of the vector', () => {
            const vector: Vector = { x: 1, y: 2 };
            const result = Vector.map(vector, (value, key) => value * 2);
            expect(result).to.deep.equal({ x: 2, y: 4 });
        });
    });

    describe('normalize', () => {
        it('should compute the normalized vector', () => {
            const vector: Vector = { x: 3, y: 4 };
            const result = Vector.normalize(vector);
            expect(result).to.deep.equal({ x: 0.6, y: 0.8 });
        });
        it('should return the zero vector if the vector is the zero vector', () => {
            const vector: Vector = { x: 0, y: 0 };
            const result = Vector.normalize(vector);
            expect(result).to.deep.equal(Vector.ZERO);
        });
    });

    describe('isZero', () => {
        it('should check if a vector is the zero vector', () => {
            const vector: Vector = { x: 0, y: 0 };
            const result = Vector.isZero(vector);
            expect(result).to.be.true;
        });
    });

    describe('is', () => {
        it('should check if the given object is a vector', () => {
            const vector: Vector = { x: 1, y: 2 };
            const result = Vector.is(vector);
            expect(result).to.be.true;
        });
        it('should check if the given object is not a vector', () => {
            const vector = { x: 1, z: 2 };
            const result = Vector.is(vector);
            expect(result).to.be.false;
        });
    });

    describe('divide', () => {
        it('should divide each component of the vector by a scalar', () => {
            const vector: Vector = { x: 4, y: 6 };
            const scalar = 2;
            const result = Vector.divide(vector, scalar);
            expect(result).to.deep.equal({ x: 2, y: 3 });
        });
    });

    describe('multiply', () => {
        it('should multiply each component of the vector by a scalar', () => {
            const vector: Vector = { x: 2, y: 3 };
            const scalar = 2;
            const result = Vector.multiply(vector, scalar);
            expect(result).to.deep.equal({ x: 4, y: 6 });
        });
    });

    describe('subtract', () => {
        it('should subtract the subtrahend from the vector', () => {
            const vector: Vector = { x: 4, y: 6 };
            const subtrahend: Vector = { x: 2, y: 3 };
            const result = Vector.subtract(vector, subtrahend);
            expect(result).to.deep.equal({ x: 2, y: 3 });
        });
    });

    describe('reverse', () => {
        it('should reverse the direction of a vector', () => {
            const vector: Vector = { x: 2, y: 3 };
            const result = Vector.reverse(vector);
            expect(result).to.deep.equal({ x: -2, y: -3 });
        });
    });

    describe('direction', () => {
        it('should return right-up for a vector with positive x and negative y', () => {
            const vector: Vector = { x: 2, y: -3 };
            const result = Vector.direction(vector);
            expect(result).to.deep.equal([Direction.Right, Direction.Up]);
        });
        it('should return left-down for a vector with negative x and positive y', () => {
            const vector: Vector = { x: -2, y: 3 };
            const result = Vector.direction(vector);
            expect(result).to.deep.equal([Direction.Left, Direction.Down]);
        });
    });

    describe('min', () => {
        it('should compute the minimum vector', () => {
            const vector1: Vector = { x: 1, y: 2 };
            const vector2: Vector = { x: 3, y: 4 };
            const result = Vector.min(vector1, vector2);
            expect(result).to.deep.equal({ x: 1, y: 2 });
        });
    });

    describe('max', () => {
        it('should compute the maximum vector', () => {
            const vector1: Vector = { x: 1, y: 2 };
            const vector2: Vector = { x: 3, y: 4 };
            const result = Vector.max(vector1, vector2);
            expect(result).to.deep.equal({ x: 3, y: 4 });
        });
    });

    describe('avg', () => {
        it('should compute the average vector', () => {
            const vector1: Vector = { x: 1, y: 2 };
            const vector2: Vector = { x: 3, y: 4 };
            const result = Vector.avg(vector1, vector2);
            expect(result).to.deep.equal({ x: 2, y: 3 });
        });
        it('should return the zero vector if no vectors are given', () => {
            const result = Vector.avg();
            expect(result).to.deep.equal(Vector.ZERO);
        });
    });
});
