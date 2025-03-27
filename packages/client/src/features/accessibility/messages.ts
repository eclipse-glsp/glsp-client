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

// This will allow dynamic properties on objects but also maintain typing for known keys
export type MessagesType = {
    [K in keyof typeof rawMessages]: (typeof rawMessages)[K] extends object
        ? WithDynamicProperties<(typeof rawMessages)[K]>
        : (typeof rawMessages)[K];
};

export const messages: MessagesType = rawMessages;

const messagesUpdatedEmitter = new Emitter<MessagesType>();
export const onMessagesUpdated = messagesUpdatedEmitter.event;

export const updateMessages = (updates: DynamicDeepPartial<MessagesType>): void => {
    deepUpdate(messages, updates);
    messagesUpdatedEmitter.fire(messages);
};

export function recreateOnMessagesUpdated(action: () => Disposable): Disposable {
    let cleanup = action();

    const updateListener = onMessagesUpdated(() => {
        cleanup.dispose();
        cleanup = action();
    });

    return Disposable.create(() => {
        cleanup.dispose();
        updateListener.dispose();
    });
}
