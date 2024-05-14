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
import { Dimension } from './sprotty-geometry-dimension';

describe('Dimension', () => {
    describe('map', () => {
        it('should apply the given function to width and height', () => {
            const dimension: Dimension = { width: 10, height: 20 };
            const mappedDimension = Dimension.map(dimension, value => value * 2);
            expect(mappedDimension).to.deep.equal({ width: 20, height: 40 });
        });
    });

    describe('center', () => {
        it('should return the center point of the dimension', () => {
            const dimension: Dimension = { width: 100, height: 200 };
            const centerPoint = Dimension.center(dimension);
            expect(centerPoint).to.deep.equal({ x: 50, y: 100 });
        });
    });

    describe('add', () => {
        it('should compute the sum of two dimensions', () => {
            const dimension1: Dimension = { width: 10, height: 20 };
            const dimension2: Dimension = { width: 5, height: 10 };
            const sum = Dimension.add(dimension1, dimension2);
            expect(sum).to.deep.equal({ width: 15, height: 30 });
        });
    });

    describe('subtract', () => {
        it('should compute the difference of two dimensions', () => {
            const dimension1: Dimension = { width: 10, height: 20 };
            const dimension2: Dimension = { width: 5, height: 10 };
            const difference = Dimension.subtract(dimension1, dimension2);
            expect(difference).to.deep.equal({ width: 5, height: 10 });
        });
    });

    describe('multiplyMeasure', () => {
        it('should compute the product of a dimension and a measure', () => {
            const dimension: Dimension = { width: 10, height: 20 };
            const measure = 2;
            const product = Dimension.multiplyMeasure(dimension, measure);
            expect(product).to.deep.equal({ width: 20, height: 40 });
        });
    });

    describe('divideMeasure', () => {
        it('should compute the quotient of a dimension and a measure', () => {
            const dimension: Dimension = { width: 10, height: 20 };
            const measure = 2;
            const quotient = Dimension.divideMeasure(dimension, measure);
            expect(quotient).to.deep.equal({ width: 5, height: 10 });
        });
    });

    describe('equals', () => {
        it('should return true if two dimensions are equal', () => {
            const dimension1: Dimension = { width: 10, height: 20 };
            const dimension2: Dimension = { width: 10, height: 20 };
            const isEqual = Dimension.equals(dimension1, dimension2);
            expect(isEqual).to.be.true;
        });

        it('should return false if two dimensions are not equal', () => {
            const dimension1: Dimension = { width: 10, height: 20 };
            const dimension2: Dimension = { width: 5, height: 10 };
            const isEqual = Dimension.equals(dimension1, dimension2);
            expect(isEqual).to.be.false;
        });
    });

    describe('fromPoint', () => {
        it('should create a new dimension from the given point', () => {
            const point = { x: 10, y: 20 };
            const dimension = Dimension.fromPoint(point);
            expect(dimension).to.deep.equal({ width: 10, height: 20 });
        });
    });
});
