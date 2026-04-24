/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { TypeGuard } from './type-util';
import {
    arrayOf,
    asArray,
    distinctAdd,
    first,
    flatPush,
    groupBy,
    isArrayOfClass,
    isArrayOfType,
    isStringArray,
    last,
    partition,
    pluck,
    remove
} from './array-util';

describe('ArrayUtil', () => {
    describe('remove', () => {
        it('should remove a present value and leave others intact', () => {
            const arr = [1, 2, 3, 4];
            remove(arr, 2, 4);
            expect(arr).to.deep.equal([1, 3]);
        });
        it('should only remove the first occurrence', () => {
            const arr = [1, 2, 2, 3];
            remove(arr, 2);
            expect(arr).to.deep.equal([1, 2, 3]);
        });
        it('should do nothing for absent values', () => {
            const arr = [1, 2];
            remove(arr, 99);
            expect(arr).to.deep.equal([1, 2]);
        });
    });

    describe('flatPush', () => {
        it('should push single values and nested arrays', () => {
            const arr: number[] = [1];
            flatPush(arr, [2, [3, 4], 5]);
            expect(arr).to.deep.equal([1, 2, 3, 4, 5]);
        });
    });

    describe('distinctAdd', () => {
        it('should add only values not already present', () => {
            const arr = [1, 2];
            distinctAdd(arr, 2, 3, 4, 1);
            expect(arr).to.deep.equal([1, 2, 3, 4]);
        });
    });

    describe('first', () => {
        it('should return the first element without n', () => {
            expect(first([10, 20, 30])).to.equal(10);
        });
        it('should return first n elements', () => {
            expect(first([10, 20, 30], 2)).to.deep.equal([10, 20]);
        });
    });

    describe('last', () => {
        it('should return the last element without n', () => {
            expect(last([10, 20, 30])).to.equal(30);
        });
        it('should return last n elements', () => {
            expect(last([10, 20, 30], 2)).to.deep.equal([20, 30]);
        });
    });

    describe('pluck', () => {
        it('should extract the given property from each element', () => {
            const items = [
                { id: 1, name: 'a' },
                { id: 2, name: 'b' }
            ];
            expect(pluck(items, 'name')).to.deep.equal(['a', 'b']);
        });
    });

    describe('asArray', () => {
        it('should wrap a single value in an array', () => {
            expect(asArray(5)).to.deep.equal([5]);
        });
        it('should return the array as-is', () => {
            const arr = [1, 2];
            expect(asArray(arr)).to.equal(arr);
        });
    });

    describe('isArrayOfType', () => {
        const isNumber: TypeGuard<number> = (v: unknown): v is number => typeof v === 'number';

        it('should return true for a matching array', () => {
            expect(isArrayOfType([1, 2, 3], isNumber)).to.be.true;
        });
        it('should return false for an empty array by default', () => {
            expect(isArrayOfType([], isNumber)).to.be.false;
        });
        it('should return true for an empty array with supportEmpty', () => {
            expect(isArrayOfType([], isNumber, true)).to.be.true;
        });
        it('should return false for a mixed array', () => {
            expect(isArrayOfType([1, 'two'], isNumber)).to.be.false;
        });
    });

    describe('isArrayOfClass', () => {
        it('should return true when all elements are instances of the class', () => {
            expect(isArrayOfClass([new Date(), new Date()], Date)).to.be.true;
        });
        it('should return false for non-instances', () => {
            expect(isArrayOfClass([{}, new Date()], Date)).to.be.false;
        });
    });

    describe('isStringArray', () => {
        it('should return true for a string array', () => {
            expect(isStringArray(['a', 'b'])).to.be.true;
        });
        it('should return false for a mixed array', () => {
            expect(isStringArray(['a', 1])).to.be.false;
        });
    });

    describe('partition', () => {
        const isString = (v: unknown): v is string => typeof v === 'string';

        it('should split elements by predicate', () => {
            const result = partition(['a', 1, 'b', 2] as (string | number)[], isString as TypeGuard<string | number>);
            expect(result.match).to.deep.equal(['a', 'b']);
            expect(result.rest).to.deep.equal([1, 2]);
        });
        it('should handle all-match case', () => {
            const result = partition(['a', 'b'], isString as TypeGuard<string>);
            expect(result.match).to.deep.equal(['a', 'b']);
            expect(result.rest).to.deep.equal([]);
        });
        it('should handle empty array', () => {
            const result = partition([], isString as TypeGuard<string>);
            expect(result.match).to.deep.equal([]);
            expect(result.rest).to.deep.equal([]);
        });
    });

    describe('arrayOf', () => {
        it('should filter out undefined values', () => {
            expect(arrayOf(1, undefined, 2, undefined, 3)).to.deep.equal([1, 2, 3]);
        });
        it('should return empty array when all undefined', () => {
            expect(arrayOf(undefined, undefined)).to.deep.equal([]);
        });
    });

    describe('groupBy', () => {
        it('should group elements by the key function', () => {
            const items = [
                { type: 'fruit', name: 'apple' },
                { type: 'veggie', name: 'carrot' },
                { type: 'fruit', name: 'banana' }
            ];
            const result = groupBy(items, i => i.type);
            expect(result.size).to.equal(2);
            expect(result.get('fruit')!.map(i => i.name)).to.deep.equal(['apple', 'banana']);
            expect(result.get('veggie')!.map(i => i.name)).to.deep.equal(['carrot']);
        });
        it('should return an empty map for an empty array', () => {
            expect(groupBy([], () => 'k').size).to.equal(0);
        });
        it('should support numeric keys', () => {
            const result = groupBy([1, 2, 3, 4, 5], n => n % 2);
            expect(result.get(0)).to.deep.equal([2, 4]);
            expect(result.get(1)).to.deep.equal([1, 3, 5]);
        });
        it('should sort groups by key when sorted is true', () => {
            const items = [
                { rank: 3, name: 'c' },
                { rank: 1, name: 'a' },
                { rank: 2, name: 'b' },
                { rank: 1, name: 'a2' }
            ];
            const result = groupBy(items, i => i.rank, true);
            const keys = [...result.keys()];
            expect(keys).to.deep.equal([1, 2, 3]);
            expect(result.get(1)!.map(i => i.name)).to.deep.equal(['a', 'a2']);
        });
    });
});
