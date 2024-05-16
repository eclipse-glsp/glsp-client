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
import { Direction } from '../lib';
import { Point } from './sprotty-geometry-point';

describe('Point', () => {
    describe('is', () => {
        it('returns true for a valid point', () => {
            expect(Point.is({ x: 1, y: 2 })).to.be.true;
        });
        it('returns false for an invalid point', () => {
            expect(Point.is({ x: 1 })).to.be.false;
        });
    });

    describe('isOrigin', () => {
        it('returns true for the origin', () => {
            expect(Point.isOrigin({ x: 0, y: 0 })).to.be.true;
        });
        it('returns false for a non-origin point', () => {
            expect(Point.isOrigin({ x: 1, y: 2 })).to.be.false;
        });
    });

    describe('isValid', () => {
        it('returns true for a valid point', () => {
            expect(Point.isValid({ x: 1, y: 2 })).to.be.true;
        });
        it('returns false for an invalid point', () => {
            expect(Point.isValid({ x: 1, y: NaN })).to.be.false;
        });
    });

    describe('abs', () => {
        it('returns the absolute point', () => {
            expect(Point.abs({ x: -1, y: -2 })).to.deep.equal({ x: 1, y: 2 });
        });
    });

    describe('divideScalar', () => {
        it('divides both coordinates by the scalar', () => {
            expect(Point.divideScalar({ x: 4, y: 6 }, 2)).to.deep.equal({ x: 2, y: 3 });
        });
    });

    describe('multiplyScalar', () => {
        it('multiplies both coordinates by the scalar', () => {
            expect(Point.multiplyScalar({ x: 4, y: 6 }, 2)).to.deep.equal({ x: 8, y: 12 });
        });
    });

    describe('map', () => {
        it('applies the function to the coordinates', () => {
            expect(Point.map({ x: 1, y: 2 }, c => c * 2)).to.deep.equal({ x: 2, y: 4 });
        });
    });

    describe('snapToGrid', () => {
        it('snaps the point to the grid', () => {
            expect(Point.snapToGrid({ x: 3, y: 4 }, { x: 2, y: 2 })).to.deep.equal({ x: 4, y: 4 });
        });

        it('snaps the point to the grid with a given origin', () => {
            expect(Point.snapToGrid({ x: 3, y: 4 }, { x: 2, y: 2 }, { x: 1, y: 1 })).to.deep.equal({ x: 3, y: 5 });
        });
    });

    describe('vector', () => {
        it('returns the vector from the origin to the point', () => {
            expect(Point.vector({ x: 3, y: 4 }, { x: 5, y: 8 })).to.deep.equal({ x: 2, y: 4 });
        });
    });

    describe('move', () => {
        it('computes the movement from the starting point to the end point', () => {
            const from = { x: 1, y: 2 };
            const to = { x: 4, y: 6 };
            const expectedMovement = {
                from: { x: 1, y: 2 },
                to: { x: 4, y: 6 },
                vector: { x: 3, y: 4 },
                direction: [Direction.Right, Direction.Down]
            };
            expect(Point.move(from, to)).to.deep.equal(expectedMovement);
        });
    });

    describe('moveTowards', () => {
        it('computes the movement from the starting point in the given vector direction', () => {
            const from = { x: 1, y: 2 };
            const vector = { x: 3, y: 4 };
            const expectedMovement = {
                from: { x: 1, y: 2 },
                to: { x: 4, y: 6 },
                vector: { x: 3, y: 4 },
                direction: [Direction.Right, Direction.Down]
            };
            expect(Point.moveTowards(from, vector)).to.deep.equal(expectedMovement);
        });
    });

    describe('equals', () => {
        it('returns true for equal points', () => {
            expect(Point.equals({ x: 1, y: 2 }, { x: 1, y: 2 })).to.be.true;
        });

        it('returns false for different points', () => {
            expect(Point.equals({ x: 1, y: 2 }, { x: 1, y: 3 })).to.be.false;
        });

        it('returns true up to an epsilon', () => {
            expect(Point.equals({ x: 1, y: 2 }, { x: 1.0001, y: 2.0001 }, 0.001)).to.be.true;
        });
    });
});
