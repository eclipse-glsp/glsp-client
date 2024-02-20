/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
import * as jsonrpc from 'vscode-jsonrpc';
import { Disposable } from './disposable';
import { SafeFunction } from './type-util';

/**
 * GLSP event/emitter API. Reuses the API provided by
 * `vscode-jsonrpc` and overrides certain type definitions to match the type
 * definitions provided by GLSP (Event, Disposable)
 */

/**
 * Represents a typed event. Listener functions can subscribe for a event
 * and will be called when the event is fired. Typically events are provided by services via
 * public property. For example assume we have a service `myService` that exposes a
 * `onStartupComplete` event. Then a listener could be registered like this
 * ```ts
 *      const disposable= this.myService.onStartupComplete(event=> doSomething(event));
 *
 *     // If the listener should be unregistered again, simply call
 *      disposable.dispose()
 * ```
 */
export interface Event<T> extends jsonrpc.Event<T> {
    /**
     *
     * @param listener The listener function will be called when the event happens.
     * @param thisArgs The 'this' which will be used when calling the event listener.
     * @param disposables An array to which the {@link Disposable} for removing the listener will be added.
     * @returns a {@link Disposable} to remove the listener again.
     */
    (listener: (e: T) => unknown, thisArgs?: unknown, disposables?: Disposable[]): Disposable;
}

/**
 * Optional options that can be passed to the constructor
 * of an {@link Emitter}.
 */
export interface EmitterOptions {
    /**
     * Callback function that will be invoked after the first
     * listener has been registered for the emitter
     */
    onFirstListenerAdd?: SafeFunction<void>;
    /**
     * Callback function that will be invoked after the last
     * listener has been removed from the emitter
     */
    onLastListenerRemove?: SafeFunction<void>;
}

export class Emitter<T> extends jsonrpc.Emitter<T> implements Disposable {
    constructor(options: EmitterOptions = {}) {
        super(options);
    }

    /**
     * The even that is managed by this emitter.
     * Intended for the public to allow to subscribe to the emitter`s events.
     */
    override get event(): Event<T> {
        return super.event;
    }

    /**
     * Fires and event and notifies all registered listeners
     */
    override fire(event: T): void {
        super.fire(event);
    }
}

/**
 * Common interface for events that are fired on a single value change
 */
export interface ValueChange<T> {
    oldValue: T;
    newValue: T;
}
