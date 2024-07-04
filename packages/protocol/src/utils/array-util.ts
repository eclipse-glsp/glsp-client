/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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

import { Constructor, Primitive, TypeGuard } from './type-util';

/**
 * A union type for for objects that can either be a single element or and array of elements.
 */
export type MaybeArray<T> = T | T[];

/**
 * Returns the first element of the given array.
 * @param array the array.
 * @returns the element at index 0.
 */
export function first<T>(array: T[]): T;

/**
 * Returns the first n elements of the given array.
 * @param array The array.
 * @param n The number of elements that should be returned
 * @returns The first n elements of the array
 */
export function first<T>(array: T[], n: number): T[];
export function first<T>(array: T[], n?: number): T[] | T {
    if (n) {
        return array.filter((_, index) => index < n);
    }
    return array[0];
}

/**
 * Returns the last element of the given array.
 * @param array The array.
 * @returns The last element in the array.
 */
export function last<T>(array: T[]): T;

/**
 * Returns the last n elements of the given array.
 * @param array The array.
 * @param n The number of elements that should be returned
 * @returns The last n elements of the array
 */
export function last<T>(array: T[], n: number): T[];
export function last<T>(array: T[], n?: number): T[] | T {
    if (n) {
        return array.filter((_, index) => array.length - index <= n);
    }
    return array[array.length - 1];
}

/**
 * Plucks (i.e. extracts) the property value that corresponds to the given key from all objects of the array.
 * @param array The array which should be plucked.
 * @param key  The key of the property that should be extracted.
 * @returns A new array containing the plugged property for each element of the array.
 */
export function pluck<T, K extends keyof T>(array: T[], key: K): Array<T[K]> {
    return array.map(element => element[key]);
}

/**
 * Removes the given values from the given array (if present).
 * @param array The array to execute the remove operation on.
 * @param values The values that should be removed from the array.
 */
export function remove<T>(array: T[], ...values: T[]): void {
    values.forEach(value => {
        const index = array.indexOf(value);
        if (index >= 0) {
            array.splice(index, 1);
        }
    });
}

/**
 * Push an array of values to the given array. The values can either be single objects of a concrete type `T`
 * or can also be nested arrays of T. If nested arrays are passed the they will be destructured (i.e. flattened)
 * so that they can be pushed to the given array.
 * @param array The array to push to.
 * @param toPush The values of {@link MaybeArray}s that should be pushed.
 */
export function flatPush<T>(array: T[], toPush: MaybeArray<T>[]): void {
    toPush.forEach(value => (Array.isArray(value) ? array.push(...value) : array.push(value)));
}

/**
 * Helper function to convert a {@link MaybeArray} into an array.
 * @param maybe The MaybeArray to convert
 * @returns The corresponding array
 */
export function asArray<T>(maybe: MaybeArray<T>): T[] {
    if (Array.isArray(maybe)) {
        return maybe;
    }
    return [maybe];
}
/**
 * Adds the given values to the given array. The add operation is executed distinct meaning
 * a value will not be pushed to the array if its already present in the array.
 * @param array The array to push to.
 * @param values The values that should be added distinctively.
 */
export function distinctAdd<T>(array: T[], ...values: T[]): void {
    values.forEach(value => {
        if (!array.includes(value)) {
            array.push(value);
        }
    });
}

/**
 * A typeguard function to check wether a given object is an array of a specific type `T`. As it checks the type of each individual
 * array element this guard check is expensive and should only be used in cases where complete type-safety is required.
 * @param object The object to check.
 * @param typeGuard A typeguard to check the type of the individual elements.
 * @param supportEmpty A flag to determine wether empty arrays should pass the typeguard check.
 * @returns A type predicate indicating wether the given object has passed the type guard check.
 */
export function isArrayOfType<T>(object: unknown, typeGuard: (elem: unknown) => elem is T, supportEmpty = false): object is T[] {
    return isArrayMatching(object, element => typeGuard(element), supportEmpty);
}

/**
 * A typeguard function to check wether a given object is an array of a class`T`. As it checks the wether each individual element
 * is an instance of the given class this  guard check is expensive and should only be used in cases where complete type-safety is required.
 * @param object The object to check.
 * @param constructor The constructor for the class under test.
 * @param supportEmpty A flag to determine wether empty arrays should pass the typeguard check.
 * @returns A type predicate indicating wether the given object has passed the type guard check.
 */
export function isArrayOfClass<T>(object: unknown, constructor: Constructor<T>, supportEmpty = false): object is T[] {
    return isArrayMatching(object, element => element instanceof constructor, supportEmpty);
}

/**
 * A typeguard function to check wether a given object is an array of a {@link PrimitiveType} `T. As it checks the type of each individual
 * array element this guard check is expensive and should only be used in cases where complete type-safety is required.
 * @param object The object to check.
 * @param primitiveType The expected primitive type of the elements.
 * @param supportEmpty A flag to determine wether empty arrays should pass the typeguard check.
 * @returns A type predicate indicating wether the given object has passed the type guard check.
 */
export function isArrayOfPrimitive<T>(object: unknown, primitiveType: Primitive, supportEmpty = false): object is T[] {
    return isArrayMatching(object, element => typeof element === primitiveType, supportEmpty);
}

/**
 * A typeguard function to check wether a given object is an array of a strings. As it checks the type of each individual
 * array element this guard check is expensive and should only be used in cases where complete type-safety is required.
 * @param object The object to check.
 * @param supportEmpty A flag to determine wether empty arrays should pass the typeguard check.
 * @returns A type predicate indicating wether the given object has passed the type guard check.
 */
export function isStringArray(object: unknown, supportEmpty = false): object is string[] {
    return isArrayOfPrimitive(object, 'string', supportEmpty);
}

/**
 * A typeguard function to check wether a given object is an array where each element matches the given predicate.
 * @param object The object to check.
 * @param predicate The predicate to test with.
 * @param supportEmpty A flag to determine wether empty arrays be matched by the predicate..
 * @returns `true` if the given object is an array and all elements match the given predicate. `false` otherwise.
 */
export function isArrayMatching(object: unknown, predicate: (elem: unknown) => boolean, supportEmpty = false): boolean {
    return Array.isArray(object) && object.every(predicate) && (supportEmpty || object.length > 0);
}

export function partition<T>(source: T[], matchGuard: TypeGuard<T>): { match: T[]; rest: T[] } {
    const match: T[] = [];
    const rest: T[] = [];
    source.forEach(element => {
        if (matchGuard(element)) {
            match.push(element);
        } else {
            rest.push(element);
        }
    });
    return { match, rest };
}

/**
 * Helper function to create an array of values without any undefined values.
 * @param values The values to create the array from.
 * @returns The array of values without any undefined values.
 */
export function arrayOf<T>(...values: (T | undefined)[]): T[] {
    return values.filter(element => element !== undefined) as T[];
}
