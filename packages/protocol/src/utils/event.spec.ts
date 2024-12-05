/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { Emitter, Event } from './event';

describe('Event', () => {
    let emitter: Emitter<string>;

    beforeEach(() => {
        emitter = new Emitter<string>();
    });

    describe('once', () => {
        it('should invoke the listener when the event is fired', () => {
            const listener = sinon.spy((e: string) => {});
            Event.once(emitter.event, listener);
            emitter.fire('test');
            expect(listener.calledOnce).to.be.true;
            expect(listener.calledWith('test')).to.be.true;
        });
        it('should invoke the listener only once when the event is fired multiple times', () => {
            const listener = sinon.spy((e: string) => {});
            Event.once(emitter.event, listener);
            emitter.fire('test');
            emitter.fire('test1');
            expect(listener.calledOnce).to.be.true;
            expect(listener.calledWith('test')).to.be.true;
        });
        it('should not invoke the listener when its disposed before the event fired', () => {
            const listener = sinon.spy((e: string) => {});
            const disposable = Event.once(emitter.event, listener);
            disposable.dispose();
            emitter.fire('test');
            expect(listener.called).to.be.false;
        });
    });

    describe('waitUntil', () => {
        it('should resolve the promise when the event is fired', async () => {
            const promise = Event.waitUntil(emitter.event);
            emitter.fire('test');
            const result = await promise;
            expect(result).to.equal('test');
        });

        it('should resolve the promise only when the predicate matches', async () => {
            const predicate = (e: string): boolean => e === 'match';
            const promise = Event.waitUntil(emitter.event, predicate);
            emitter.fire('no-match');
            emitter.fire('match');
            const result = await promise;
            expect(result).to.equal('match');
        });
    });
});
