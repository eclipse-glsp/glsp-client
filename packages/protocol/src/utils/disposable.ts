/********************************************************************************
 * Copyright (c) 2023-2025 EclipseSource and others.
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
import { isArrayOfType, remove } from '../utils/array-util';
import { AnyObject, hasFunctionProp } from '../utils/type-util';

/**
 * Interface for objects that can or need to be disposed properly.
 */
export interface Disposable extends jsonrpc.Disposable {
    /**
     * Dispose this object.
     */
    dispose(): void;
}

export namespace Disposable {
    export function is(value: unknown): value is Disposable {
        return AnyObject.is(value) && hasFunctionProp(value, 'dispose');
    }

    /**
     * Creates a new empty i.e. no-op {@link Disposable}.
     * @returns the newly created disposable
     */
    export function empty(): Disposable {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return { dispose: () => {} };
    }

    /**
     * Creates a new {@link Disposable} that delegates to the given callback.
     * @param cb The callback that should be invoked on dispose
     * @returns the newly created disposable
     */
    export function create(cb: () => void): Disposable {
        return { dispose: cb };
    }

    /**
     * Disposes the given object if it is a {@link Disposable}.
     * @param value The object that should be disposed
     */
    export function dispose(value: unknown): void {
        if (is(value)) {
            value.dispose();
        }
    }
}

/**
 * Reusable base class to manage a collection of {@link Disposable}s.
 */
export class DisposableCollection implements Disposable {
    protected readonly disposables: Disposable[] = [];
    errorHandler?: (err: unknown) => void;

    constructor(...toDispose: Disposable[]) {
        toDispose.forEach(d => this.push(d));
        this.errorHandler = err => console.error(err);
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        try {
            while (!this.disposed) {
                this.disposables.pop()?.dispose();
            }
        } catch (err) {
            this.errorHandler?.(err);
        }
    }

    get disposed(): boolean {
        return this.disposables.length === 0;
    }

    /**
     * Pushes the given disposables to the collection.
     * @param disposables The disposables that should be added
     * @returns A disposable that removes the previously pushed values from the collection when invoked
     */
    push(...disposables: Disposable[]): Disposable;
    push(...disposables: (() => void)[]): Disposable;
    push(...disposables: (() => void)[] | Disposable[]): Disposable {
        const toAdd = isArrayOfType(disposables, Disposable.is) ? disposables : disposables.map(Disposable.create);
        this.disposables.push(...toAdd);
        return Disposable.create(() => remove(this.disposables, ...toAdd));
    }

    get isDisposed(): boolean {
        return this.disposed;
    }

    /**
     * Removes all disposables in this collection WITHOUT triggering their disposal behavior.
     */
    clear(): void {
        this.disposables.length = 0;
    }
}
