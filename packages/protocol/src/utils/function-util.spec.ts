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

import { expect } from 'chai';
import * as sinon from 'sinon';
import { debounce } from './function-util';

describe('FunctionUtil', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
    });

    describe('debounce', () => {
        it('should invoke the function after the wait period (trailing by default)', () => {
            const spy = sinon.spy();
            const debounced = debounce(spy, 100);
            debounced();
            expect(spy.called).to.be.false;
            clock.tick(100);
            expect(spy.calledOnce).to.be.true;
        });

        it('should reset the timer on rapid calls and only invoke once', () => {
            const spy = sinon.spy();
            const debounced = debounce(spy, 100);
            debounced();
            clock.tick(50);
            debounced();
            clock.tick(50);
            expect(spy.called).to.be.false;
            clock.tick(50);
            expect(spy.calledOnce).to.be.true;
        });

        it('should pass the latest arguments', () => {
            const spy = sinon.spy();
            const debounced = debounce(spy, 100);
            debounced('a');
            debounced('b');
            clock.tick(100);
            expect(spy.calledOnce).to.be.true;
            expect(spy.firstCall.args).to.deep.equal(['b']);
        });

        it('should invoke immediately with leading: true', () => {
            const spy = sinon.spy();
            const debounced = debounce(spy, 100, { leading: true });
            debounced();
            expect(spy.calledOnce).to.be.true;
        });

        it('should not invoke trailing call when leading: true, trailing: false', () => {
            const spy = sinon.spy();
            const debounced = debounce(spy, 100, { leading: true, trailing: false });
            debounced();
            debounced();
            expect(spy.calledOnce).to.be.true;
            clock.tick(100);
            expect(spy.calledOnce).to.be.true;
        });

        it('should invoke both leading and trailing when both are true', () => {
            const spy = sinon.spy();
            const debounced = debounce(spy, 100, { leading: true, trailing: true });
            debounced('first');
            expect(spy.calledOnce).to.be.true;
            debounced('second');
            clock.tick(100);
            expect(spy.calledTwice).to.be.true;
            expect(spy.secondCall.args).to.deep.equal(['second']);
        });

        describe('cancel', () => {
            it('should prevent a pending trailing invocation', () => {
                const spy = sinon.spy();
                const debounced = debounce(spy, 100);
                debounced();
                debounced.cancel();
                clock.tick(100);
                expect(spy.called).to.be.false;
            });

            it('should be safe to call when nothing is pending', () => {
                const spy = sinon.spy();
                const debounced = debounce(spy, 100);
                expect(() => debounced.cancel()).to.not.throw();
            });
        });
    });
});
