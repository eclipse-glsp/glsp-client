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
import { Movement } from './geometry-movement';
import { Direction } from './geometry-util';

describe('Movement', () => {
    describe('is', () => {
        it('should check if the given object is a movement', () => {
            const movement: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 2 },
                direction: [Direction.Right, Direction.Up]
            };
            const result = Movement.is(movement);
            expect(result).to.be.true;
        });
        it('should check if the given object is not a movement', () => {
            const obj = { x: 1, y: 2 };
            const result = Movement.is(obj);
            expect(result).to.be.false;
        });
    });

    describe('isStationary', () => {
        it('should check if the movement is stationary', () => {
            const movement: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 1, y: 2 },
                vector: { x: 0, y: 0 },
                direction: []
            };
            const result = Movement.isStationary(movement);
            expect(result).to.be.true;
        });
        it('should check if the movement is not stationary', () => {
            const movement: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 2 },
                direction: [Direction.Right, Direction.Up]
            };
            const result = Movement.isStationary(movement);
            expect(result).to.be.false;
        });
    });

    describe('isZero', () => {
        it('should check if the movement is zero', () => {
            const movement: Movement = {
                from: { x: 0, y: 0 },
                to: { x: 0, y: 0 },
                vector: { x: 0, y: 0 },
                direction: []
            };
            const result = Movement.isZero(movement);
            expect(result).to.be.true;
        });
        it('should check if the movement is not zero', () => {
            const movement: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 2 },
                direction: [Direction.Right, Direction.Up]
            };
            const result = Movement.isZero(movement);
            expect(result).to.be.false;
        });
    });

    describe('equals', () => {
        it('should check if two movements are equal', () => {
            const movement1: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 2 },
                direction: [Direction.Right, Direction.Up]
            };
            const movement2: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 2 },
                direction: [Direction.Right, Direction.Up]
            };
            const result = Movement.equals(movement1, movement2);
            expect(result).to.be.true;
        });
        it('should check if two movements are not equal', () => {
            const movement1: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 2 },
                direction: [Direction.Right, Direction.Up]
            };
            const movement2: Movement = {
                from: { x: 1, y: 2 },
                to: { x: 3, y: 4 },
                vector: { x: 2, y: 3 },
                direction: [Direction.Right, Direction.Up]
            };
            const result = Movement.equals(movement1, movement2);
            expect(result).to.be.false;
        });
    });
});
