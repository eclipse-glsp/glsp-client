/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
import { Disposable, Emitter } from '@eclipse-glsp/sprotty';
import * as rawMessages from './messages.json';

// Helper type to allow dynamic properties inside nested objects with known keys
type WithDynamicProperties<T> = T & Record<string, any>;

type DynamicDeepPartial<T> = WithDynamicProperties<{
    [K in keyof T]?: T[K] extends object ? DynamicDeepPartial<T[K]> : T[K];
}>;

const deepUpdate = (target: any, updates: any): void => {
    for (const key in updates) {
        // Guard against prototype pollution and block __proto__ and constructor
        if (!Object.prototype.hasOwnProperty.call(updates, key) || key === '__proto__' || key === 'constructor') {
            continue;
        }

        if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
            if (!target[key]) {
                target[key] = {};
            }
            deepUpdate(target[key], updates[key]);
        } else {
            target[key] = updates[key];
        }
    }
};

/**
 * Type-safe access to the known messages defined within the framework.
 */
export type Messages = WithDynamicProperties<{
    [K in keyof typeof rawMessages]: (typeof rawMessages)[K] extends object
        ? WithDynamicProperties<(typeof rawMessages)[K]>
        : (typeof rawMessages)[K];
}>;

/**
 * The messages object containing all known messages.
 */
export const messages: Messages = rawMessages;
const messagesUpdatedEmitter = new Emitter<Messages>();
/**
 * Event that is fired when the messages are updated.
 */
export const onMessagesUpdated = messagesUpdatedEmitter.event;

/**
 * Update the messages with the given set of messages. This may include overwriting existing messages or adding new ones.
 *
 * @param updates The updates to apply to the messages object.
 */
export const updateMessages = (updates: DynamicDeepPartial<Messages>): void => {
    deepUpdate(messages, updates);
    messagesUpdatedEmitter.fire(messages);
};

/**
 * Executes the given listener with the current messages and re-executes it whenever the messages are updated.
 * If the listener returns a disposable, it will be disposed before the listener is called again.
 *
 * @param listener The listener to re-execute when the messages are updated.
 * @param options Options to control the behavior of the listener execution.
 * @returns A disposable that can be used to clean up the listener.
 */
export function repeatOnMessagesUpdated(
    listener: (messages?: Messages) => unknown,
    options: { initial: boolean } = { initial: true }
): Disposable {
    let cleanup = options.initial ? listener(messages) : {};

    const updateListener = onMessagesUpdated(() => {
        Disposable.dispose(cleanup);
        cleanup = listener();
    });

    return Disposable.create(() => {
        Disposable.dispose(cleanup);
        updateListener.dispose();
    });
}
