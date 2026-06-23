/********************************************************************************
 * Copyright (c) 2023-2026 EclipseSource and others.
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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Disposable, DisposableCollection } from './disposable';

describe('Disposable', () => {
    describe('is', () => {
        it('should return false for a primitive', () => {
            expect(Disposable.is('A')).toBe(false);
        });
        it('should return false for unknown function', () => {
            expect(Disposable.is('A'.toString)).toBe(false);
        });
        it('should return true for the return value of Disposable.create()', () => {
            expect(Disposable.is(Disposable.create(() => 'A'.toString()))).toBe(true);
        });
        it('should return true for the return value of Disposable.empty()', () => {
            expect(Disposable.is(Disposable.empty())).toBe(true);
        });
        it('should return false for an object with conflicting `dispose` property', () => {
            const obj = { dispose: '' };
            expect(Disposable.is(obj)).toBe(false);
        });
        it('disposable object', () => {
            const obj: Disposable = { dispose: () => 'ok' };
            expect(Disposable.is(obj)).toBe(true);
        });
    });
    describe('DisposableCollection', () => {
        let disposableCollection: DisposableCollection;
        beforeEach(() => (disposableCollection = new DisposableCollection()));
        describe('push', () => {
            it('should add one disposable to the collection and remove it again', () => {
                const disposable = Disposable.empty();
                const toRemove = disposableCollection.push(disposable);
                expect(disposableCollection['disposables'].length).toBe(1);
                expect(disposableCollection['disposables'][0]).toBe(disposable);
                toRemove.dispose();
                expect(disposableCollection['disposables'].length).toBe(0);
            });
            it('should add multiple disposable to the collection and remove them again', () => {
                const disposable1 = Disposable.empty();
                const disposable2 = Disposable.empty();
                const disposable3 = Disposable.empty();

                const toRemove = disposableCollection.push(disposable1, disposable2, disposable3);
                expect(disposableCollection['disposables'].length).toBe(3);
                expect(disposableCollection['disposables'][0]).toBe(disposable1);
                expect(disposableCollection['disposables'][1]).toBe(disposable2);
                expect(disposableCollection['disposables'][2]).toBe(disposable3);
                toRemove.dispose();
                expect(disposableCollection['disposables'].length).toBe(0);
            });
            it('should add one disposable function to the collection and remove it again', () => {
                const disposable = (): void => {};
                const toRemove = disposableCollection.push(disposable);
                expect(disposableCollection['disposables'].length).toBe(1);
                toRemove.dispose();
                expect(disposableCollection['disposables'].length).toBe(0);
            });
        });
        describe('dispose', () => {
            it('should invoke dispose on all elements of the collection exactly once', () => {
                const disposable1 = Disposable.empty();
                const disposable2 = Disposable.empty();
                const disposable1Spy = vi.spyOn(disposable1, 'dispose');
                const disposable2Spy = vi.spyOn(disposable2, 'dispose');

                disposableCollection = new DisposableCollection(disposable1, disposable2);

                disposableCollection.dispose();
                disposableCollection.dispose();
                disposableCollection.dispose();

                expect(disposable1Spy).toHaveBeenCalledOnce();
                expect(disposable2Spy).toHaveBeenCalledOnce();
                expect(disposableCollection['disposables'].length).toBe(0);
            });
        });
    });
});
