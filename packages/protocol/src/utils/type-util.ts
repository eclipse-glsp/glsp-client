/********************************************************************************
 * Copyright (c) 2021-2022 EclipseSource and others.
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

/**
 * The built-in 'object' & 'Object' types are currently hard to use
 * an should be avoided. It's recommended to use Record instead to describe the
 * type meaning of "any object";
 */
export type AnyObject = Record<PropertyKey, unknown>;

export namespace AnyObject {
    /**
     * Type guard to check wether a given object is of type {@link AnyObject}.
     * @param object The object to check.
     * @returns The given object as {@link AnyObject} or `false`.
     */
    export function is(object: unknown): object is AnyObject {
        // eslint-disable-next-line no-null/no-null
        return object !== null && typeof object === 'object';
    }
}

/**
 * Utility type to describe typeguard functions.
 */
export type TypeGuard<T> = (element: any, ...args: any[]) => element is T;

/**
 * Validates whether the given object as a property of type `string` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @returns `true` if the object has property with matching key of type `string`.
 */
export function hasStringProp(object: AnyObject, propertyKey: string): boolean {
    return propertyKey in object && typeof object[propertyKey] === 'string';
}

/**
 * Validates whether the given object as a property of type `boolean` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @returns `true` if the object has property with matching key of type `boolean`.
 */
export function hasBooleanProp(object: AnyObject, propertyKey: string): boolean {
    return propertyKey in object && typeof object[propertyKey] === 'boolean';
}

/**
 * Validates whether the given object as a property of type `number` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @returns `true` if the object has property with matching key of type `number`.
 */
export function hasNumberProp(object: AnyObject, propertyKey: string): boolean {
    return propertyKey in object && typeof object[propertyKey] === 'number';
}

/**
 * Validates whether the given object as a property of type `object` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @returns `true` if the object has property with matching key of type `object`.
 */
export function hasObjectProp(object: AnyObject, propertyKey: string): boolean {
    return propertyKey in object && AnyObject.is(object[propertyKey]);
}

/**
 * Validates whether the given object as a property of type `Array` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @returns `true` if the object has property with matching key of type `Array`.
 */
export function hasArrayProp(object: AnyObject, propertyKey: string): boolean {
    return propertyKey in object && Array.isArray(object[propertyKey]);
}
