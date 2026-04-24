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

export interface DebouncedFunc<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel(): void;
}

export interface DebounceSettings {
    leading?: boolean;
    trailing?: boolean;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number, options: DebounceSettings = {}): DebouncedFunc<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: Parameters<T> | undefined;
    let lastThis: ThisParameterType<T> | undefined;
    let hasPendingCall = false;

    const leading = options.leading ?? false;
    const trailing = options.trailing ?? true;

    const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
        const shouldCallLeading = leading && timeout === undefined;

        lastArgs = args;
        lastThis = this;
        hasPendingCall = true;

        if (shouldCallLeading) {
            func.apply(lastThis, lastArgs);
            hasPendingCall = false;
        }

        if (timeout !== undefined) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            timeout = undefined;
            if (trailing && hasPendingCall && lastArgs !== undefined) {
                func.apply(lastThis, lastArgs);
                hasPendingCall = false;
            }
        }, wait);
    } as DebouncedFunc<T>;

    debounced.cancel = () => {
        if (timeout !== undefined) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        lastArgs = undefined;
        lastThis = undefined;
        hasPendingCall = false;
    };

    return debounced;
}
