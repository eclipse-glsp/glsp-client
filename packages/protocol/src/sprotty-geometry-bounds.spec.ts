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
import { Dimension, Point } from 'sprotty-protocol';
import { Bounds } from './sprotty-geometry-bounds';

describe('Bounds', () => {
    describe('is', () => {
        it('should return true if the given object is a bounds', () => {
            const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.is(bounds);
            expect(result).to.be.true;
        });

        it('should return false if the given object is not a bounds', () => {
            const bounds = { y: 0, width: 100, height: 100 };
            const result = Bounds.is(bounds);
            expect(result).to.be.false;
        });
    });

    describe('isValid', () => {
        it('should return true if the bounds are valid', () => {
            const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.isValid(bounds);
            expect(result).to.be.true;
        });

        it('should return false if a dimension is not valid', () => {
            const bounds = { x: 0, y: 0, width: 100, height: -1 };
            const result = Bounds.isValid(bounds);
            expect(result).to.be.false;
        });

        it('should return false if a coordinate is not valid', () => {
            const bounds = { x: 0, y: NaN, width: 100, height: 0 };
            const result = Bounds.isValid(bounds);
            expect(result).to.be.false;
        });
    });

    describe('encompasses', () => {
        it('should return true if the outer bounds completely encompass the inner bounds', () => {
            const outer: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const inner: Bounds = { x: 10, y: 10, width: 50, height: 50 };
            const result = Bounds.encompasses(outer, inner);
            expect(result).to.be.true;
        });

        it('should return false if the outer bounds do not completely encompass the inner bounds', () => {
            const outer: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const inner: Bounds = { x: 110, y: 110, width: 50, height: 50 };
            const result = Bounds.encompasses(outer, inner);
            expect(result).to.be.false;
        });
    });

    describe('overlap', () => {
        it('should return true if the two bounds overlap', () => {
            const bounds1: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const bounds2: Bounds = { x: 50, y: 50, width: 100, height: 100 };
            const result = Bounds.overlap(bounds1, bounds2);
            expect(result).to.be.true;
        });

        it('should return false if the two bounds touch at the right edge of the left bounds', () => {
            const bounds1: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const bounds2: Bounds = { x: 100, y: 0, width: 100, height: 100 };
            const result = Bounds.overlap(bounds1, bounds2);
            expect(result).to.be.false;
        });

        it('should return true if the two bounds touch at the right edge of the left bounds and the touch flag is set', () => {
            const bounds1: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const bounds2: Bounds = { x: 100, y: 0, width: 100, height: 100 };
            const result = Bounds.overlap(bounds1, bounds2, true);
            expect(result).to.be.true;
        });
    });

    describe('equals', () => {
        it('should return true if the two bounds are equal', () => {
            const bounds1: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const bounds2: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.equals(bounds1, bounds2);
            expect(result).to.be.true;
        });

        it('should return false if the two bounds are not equal', () => {
            const bounds1: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const bounds2: Bounds = { x: 50, y: 50, width: 100, height: 100 };
            const result = Bounds.equals(bounds1, bounds2);
            expect(result).to.be.false;
        });
    });

    describe('left', () => {
        it('should return the x-coordinate of the left edge of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.left(bounds);
            expect(result).to.equal(10);
        });
    });

    describe('centerX', () => {
        it('should return the x-coordinate of the center of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.centerX(bounds);
            expect(result).to.equal(60);
        });
    });

    describe('right', () => {
        it('should return the x-coordinate of the right edge of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.right(bounds);
            expect(result).to.equal(110);
        });
    });

    describe('top', () => {
        it('should return the y-coordinate of the top edge of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.top(bounds);
            expect(result).to.equal(20);
        });
    });

    describe('middle', () => {
        it('should return the y-coordinate of the middle of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.middle(bounds);
            expect(result).to.equal(120);
        });
    });

    describe('centerY', () => {
        it('should return the y-coordinate of the center of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.centerY(bounds);
            expect(result).to.equal(120);
        });
    });

    describe('bottom', () => {
        it('should return the y-coordinate of the bottom edge of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.bottom(bounds);
            expect(result).to.equal(220);
        });
    });

    describe('topLeft', () => {
        it('should return the top left corner of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.topLeft(bounds);
            expect(result).to.deep.equal({ x: 10, y: 20 });
        });
    });

    describe('topCenter', () => {
        it('should return the top center point of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.topCenter(bounds);
            expect(result).to.deep.equal({ x: 60, y: 20 });
        });
    });

    describe('topRight', () => {
        it('should return the top right corner of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.topRight(bounds);
            expect(result).to.deep.equal({ x: 110, y: 20 });
        });
    });

    describe('middleLeft', () => {
        it('should return the middle left point of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.middleLeft(bounds);
            expect(result).to.deep.equal({ x: 10, y: 120 });
        });
    });

    describe('middleCenter', () => {
        it('should return the middle center point of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.middleCenter(bounds);
            expect(result).to.deep.equal({ x: 60, y: 120 });
        });
    });

    describe('middleRight', () => {
        it('should return the middle right point of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.middleRight(bounds);
            expect(result).to.deep.equal({ x: 110, y: 120 });
        });
    });

    describe('bottomLeft', () => {
        it('should return the bottom left corner of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.bottomLeft(bounds);
            expect(result).to.deep.equal({ x: 10, y: 220 });
        });
    });

    describe('bottomCenter', () => {
        it('should return the bottom center point of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.bottomCenter(bounds);
            expect(result).to.deep.equal({ x: 60, y: 220 });
        });
    });

    describe('bottomRight', () => {
        it('should return the bottom right corner of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const result = Bounds.bottomRight(bounds);
            expect(result).to.deep.equal({ x: 110, y: 220 });
        });
    });

    describe('isAbove', () => {
        it('should return true if the left bounds are above the right bounds', () => {
            const leftBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 0, y: 200, width: 100, height: 100 };
            const result = Bounds.isAbove(leftBounds, rightBounds);
            expect(result).to.be.true;
        });

        it('should return false if the left bounds are not above the right bounds', () => {
            const leftBounds: Bounds = { x: 0, y: 200, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.isAbove(leftBounds, rightBounds);
            expect(result).to.be.false;
        });
    });

    describe('isBelow', () => {
        it('should return true if the left bounds are below the right bounds', () => {
            const leftBounds: Bounds = { x: 0, y: 200, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.isBelow(leftBounds, rightBounds);
            expect(result).to.be.true;
        });

        it('should return false if the left bounds are not below the right bounds', () => {
            const leftBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 0, y: 200, width: 100, height: 100 };
            const result = Bounds.isBelow(leftBounds, rightBounds);
            expect(result).to.be.false;
        });
    });

    describe('isBefore', () => {
        it('should return true if the left bounds are before the right bounds', () => {
            const leftBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 200, y: 0, width: 100, height: 100 };
            const result = Bounds.isBefore(leftBounds, rightBounds);
            expect(result).to.be.true;
        });

        it('should return false if the left bounds are not before the right bounds', () => {
            const leftBounds: Bounds = { x: 200, y: 0, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.isBefore(leftBounds, rightBounds);
            expect(result).to.be.false;
        });
    });

    describe('isAfter', () => {
        it('should return true if the left bounds are after the right bounds', () => {
            const leftBounds: Bounds = { x: 200, y: 0, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const result = Bounds.isAfter(leftBounds, rightBounds);
            expect(result).to.be.true;
        });

        it('should return false if the left bounds are not after the right bounds', () => {
            const leftBounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const rightBounds: Bounds = { x: 200, y: 0, width: 100, height: 100 };
            const result = Bounds.isAfter(leftBounds, rightBounds);
            expect(result).to.be.false;
        });
    });

    describe('from', () => {
        it('should create a bounds from the given top left and bottom right points', () => {
            const topLeft: Point = { x: 10, y: 20 };
            const bottomRight: Point = { x: 110, y: 220 };
            const result = Bounds.from(topLeft, bottomRight);
            expect(result).to.deep.equal({ x: 10, y: 20, width: 100, height: 200 });
        });
    });

    describe('position', () => {
        it('should return the position of the bounds', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 30, height: 40 };
            const result = Bounds.position(bounds);
            expect(result).to.deep.equal({ x: 10, y: 20 });
        });
    });

    describe('dimension', () => {
        it('should create a new dimension from the given bounds', () => {
            const bounds = { x: 10, y: 20, width: 30, height: 40 };
            const dimension = Bounds.dimension(bounds);
            expect(dimension).to.deep.equal({ width: 30, height: 40 });
        });
    });

    describe('sortBy', () => {
        it('should sort the bounds based on the rank function', () => {
            const bounds1: Bounds = { x: 0, y: 0, width: 100, height: 100 };
            const bounds2: Bounds = { x: 50, y: 50, width: 100, height: 100 };
            const bounds3: Bounds = { x: 200, y: 200, width: 100, height: 100 };
            const rankFunc = (bounds: Bounds): number => bounds.x;
            const sortedBounds = Bounds.sortBy(rankFunc, bounds1, bounds2, bounds3);
            expect(sortedBounds).to.deep.equal([bounds1, bounds2, bounds3]);
        });
    });

    describe('move', () => {
        it('should move the bounds by the given delta', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const delta: Point = { x: 10, y: 20 };
            const result = Bounds.move(bounds, delta);
            expect(result).to.deep.equal({ x: 20, y: 40, width: 100, height: 200 });
        });

        it('should move the bounds by the given delta with negative values', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const delta: Point = { x: -10, y: -20 };
            const result = Bounds.move(bounds, delta);
            expect(result).to.deep.equal({ x: 0, y: 0, width: 100, height: 200 });
        });
    });

    describe('resize', () => {
        it('should resize the bounds by the given delta', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const delta: Dimension = { width: 10, height: 20 };
            const result = Bounds.resize(bounds, delta);
            expect(result).to.deep.equal({ x: 10, y: 20, width: 110, height: 220 });
        });

        it('should resize the bounds by the given delta with negative values', () => {
            const bounds: Bounds = { x: 10, y: 20, width: 100, height: 200 };
            const delta: Dimension = { width: -10, height: -20 };
            const result = Bounds.resize(bounds, delta);
            expect(result).to.deep.equal({ x: 10, y: 20, width: 90, height: 180 });
        });
    });
});
