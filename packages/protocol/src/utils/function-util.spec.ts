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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './function-util';

describe('FunctionUtil', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('debounce', () => {
        it('should invoke the function after the wait period (trailing by default)', () => {
            const spy = vi.fn();
            const debounced = debounce(spy, 100);
            debounced();
            expect(spy).not.toHaveBeenCalled();
            vi.advanceTimersByTime(100);
            expect(spy).toHaveBeenCalledOnce();
        });

        it('should reset the timer on rapid calls and only invoke once', () => {
            const spy = vi.fn();
            const debounced = debounce(spy, 100);
            debounced();
            vi.advanceTimersByTime(50);
            debounced();
            vi.advanceTimersByTime(50);
            expect(spy).not.toHaveBeenCalled();
            vi.advanceTimersByTime(50);
            expect(spy).toHaveBeenCalledOnce();
        });

        it('should pass the latest arguments', () => {
            const spy = vi.fn();
            const debounced = debounce(spy, 100);
            debounced('a');
            debounced('b');
            vi.advanceTimersByTime(100);
            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]).toEqual(['b']);
        });

        it('should invoke immediately with leading: true', () => {
            const spy = vi.fn();
            const debounced = debounce(spy, 100, { leading: true });
            debounced();
            expect(spy).toHaveBeenCalledOnce();
        });

        it('should not invoke trailing call when leading: true, trailing: false', () => {
            const spy = vi.fn();
            const debounced = debounce(spy, 100, { leading: true, trailing: false });
            debounced();
            debounced();
            expect(spy).toHaveBeenCalledOnce();
            vi.advanceTimersByTime(100);
            expect(spy).toHaveBeenCalledOnce();
        });

        it('should invoke both leading and trailing when both are true', () => {
            const spy = vi.fn();
            const debounced = debounce(spy, 100, { leading: true, trailing: true });
            debounced('first');
            expect(spy).toHaveBeenCalledOnce();
            debounced('second');
            vi.advanceTimersByTime(100);
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy.mock.calls[1]).toEqual(['second']);
        });

        describe('cancel', () => {
            it('should prevent a pending trailing invocation', () => {
                const spy = vi.fn();
                const debounced = debounce(spy, 100);
                debounced();
                debounced.cancel();
                vi.advanceTimersByTime(100);
                expect(spy).not.toHaveBeenCalled();
            });

            it('should be safe to call when nothing is pending', () => {
                const spy = vi.fn();
                const debounced = debounce(spy, 100);
                expect(() => debounced.cancel()).not.toThrow();
            });
        });
    });
});
