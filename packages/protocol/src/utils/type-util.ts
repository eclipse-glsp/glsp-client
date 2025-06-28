/********************************************************************************
 * Copyright (c) 2021-2025 EclipseSource and others.
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

import { Action } from '../action-protocol/base-protocol';
import { asArray as toArray } from '../utils/array-util';

/** Helper type to describe any defined object*/
export type AnyObject = object;

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
 * Utility type to capture all primitive types.
 */
export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Utility type to describe objects that have a constructor function i.e. classes.
 */
export interface Constructor<T, A extends any[] = any[]> {
    new (...args: A): T;
}

/**
 * Utility type to declare a given type `T` as writable. Essentially this removes
 * all readonly modifiers of the type`s properties. Please use with care and only in instances
 * where you know that overwriting a readonly property is safe and doesn't cause unknown unintended side effects.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type Writable<T> = { -readonly [P in keyof T]: Writable<T[P]> };

/**
 * Utility type to extract all key of type `V` from a given type `T`.
 */
export type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

/**
 * Utility type to extract all properties of type `V` from a given type `T`.
 */
export type PropertiesOfType<T, V> = Pick<T, KeysOfType<T, V>>;

/**
 * Utility type to describe a value as might be provided as a promise.
 */
export type MaybePromise<T> = T | PromiseLike<T>;

/**
 * Utility type to describe typeguard functions.
 */
export type TypeGuard<T> = (element: any) => element is T;

/** Utility function to combine two type guards */
export function typeGuard<T, G>(one: TypeGuard<T>, other: TypeGuard<G>): TypeGuard<T & G> {
    return (element: any): element is T & G => one(element) && other(element);
}

/** Utility function to combine two type guards with an OR */
export function typeGuardOr<T, G>(one: TypeGuard<T>, other: TypeGuard<G>): TypeGuard<T | G> {
    return (element: any): element is T | G => one(element) || other(element);
}

/**
 * Utility function that create a typeguard function for a given class constructor.
 * Essentially this wraps an instance of check as typeguard function.
 * @param constructor The constructor of the class for which the typeguard should be created.
 * @returns The typeguard for this class.
 */
export function toTypeGuard<G>(constructor: Constructor<G>): TypeGuard<G> {
    return (element: any): element is G => element instanceof constructor;
}

/**
 * Utility type that represents a string value that is augment with proposals for
 * default/common values.Code completion in editors can pick up the proposals while
 * still allowing to also define any other string value.
 * @template T The type of the string proposal as union.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type ProposalString<T extends string> = T | (string & {});

/**
 * Utility type that represents an arbitrary function. Should be used instead
 * of the default `Function` type which is considered to be unsafe.
 */
export type SafeFunction<T = any> = (...args: any[]) => T;

/**
 * Utility type that represents a value that might be a function or a value of type `T`.
 * This is useful to allow functions to be passed as parameters but also allow
 * simple values to be passed.
 * @template T The type of the value that might be returned by the function.
 */
export type MaybeFunction<T = any> = T | SafeFunction<T>;

/**
 * Utility function that calls a given function if it is a function, otherwise returns the value.
 * This is useful to allow functions to be passed as parameters but also allow
 * simple values to be passed.
 * @template T The type of the value that might be returned by the function.
 * @param maybeFun The value that might be a function or a value of type `T`.
 * @param args The arguments to pass to the function if it is called.
 * @returns The result of the function call or the value itself if it is not a function.
 */
export function call<T>(maybeFun: MaybeFunction<T>, ...args: any[]): T {
    return typeof maybeFun === 'function' ? (maybeFun as SafeFunction<T>)(...args) : maybeFun;
}

export type MaybeActions = MaybeFunction<Action[] | Action | undefined>;

export namespace MaybeActions {
    /**
     * Utility function that converts a given `MaybeActions` value into an array of actions.
     * If the value is a function, it will be called to get the actions.
     * If the value is an array, it will be returned as is.
     * If the value is undefined, an empty array will be returned.
     * @param actions The value that might be a function or an array of actions.
     * @returns An array of actions.
     */
    export function asArray(actions?: MaybeActions): Action[] {
        const cleanup = actions ? call(actions) : [];
        return cleanup ? toArray(cleanup) : [];
    }
}

/**
 * Validates whether the given object has a property of type `string` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @param optional Flag to indicate wether the property can be optional i.e. also return true if the given key is undefined
 * @returns `true` if the object has property with matching key of type `string`.
 */
export function hasStringProp(object: AnyObject, propertyKey: string, optional = false): boolean {
    const property = (object as any)[propertyKey];
    return property !== undefined ? typeof property === 'string' : optional;
}

/**
 * Validates whether the given object has a property of type `boolean` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @param optional Flag to indicate wether the property can be optional i.e. also return true if the given key is undefined
 * @returns `true` if the object has property with matching key of type `boolean`.
 */
export function hasBooleanProp(object: AnyObject, propertyKey: string, optional = false): boolean {
    const property = (object as any)[propertyKey];
    return property !== undefined ? typeof property === 'boolean' : optional;
}

/**
 * Validates whether the given object has a property of type `number` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @param optional Flag to indicate wether the property can be optional i.e. also return true if the given key is undefined
 * @returns `true` if the object has property with matching key of type `number`.
 */
export function hasNumberProp(object: AnyObject, propertyKey: string, optional = false): boolean {
    const property = (object as any)[propertyKey];
    return property !== undefined ? typeof property === 'number' : optional;
}

/**
 * Validates whether the given object has a property of type `object` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @param optional Flag to indicate wether the property can be optional i.e. also return true if the given key is undefined
 * @returns `true` if the object has property with matching key of type `object`.
 */
export function hasObjectProp<T extends string>(object: AnyObject, propertyKey: T, optional = false): boolean {
    const property = (object as any)[propertyKey];
    return property !== undefined ? AnyObject.is(property) : optional;
}

/**
 * Validates whether the given object has a property of type `function` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @param optional Flag to indicate wether the property can be optional i.e. also return true if the given key is undefined
 * @returns `true` if the object has property with matching key of type `function`.
 */
export function hasFunctionProp(object: AnyObject, propertyKey: string, optional = false): boolean {
    const property = (object as any)[propertyKey];
    return property !== undefined ? typeof property === 'function' : optional;
}

/**
 * Validates whether the given object has a property of type `Array` with the given key.
 * @param object The object that should be validated
 * @param propertyKey The key of the property
 * @param optional Flag to indicate wether the property can be optional i.e. also return true if the given key is undefined
 * @returns `true` if the object has property with matching key of type `Array`.
 */
export function hasArrayProp(object: AnyObject, propertyKey: string, optional = false): boolean {
    const property = (object as any)[propertyKey];
    return property !== undefined ? Array.isArray(property) : optional;
}
