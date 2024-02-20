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
import { expect } from 'chai';
import { Container } from 'inversify';
import 'reflect-metadata';
import * as sinon from 'sinon';
import { Deferred, EMPTY_ROOT, InitializeCanvasBoundsAction, SetModelAction, UpdateModelAction } from '@eclipse-glsp/sprotty';
import { DefaultModelInitializationConstraint, ModelInitializationConstraint } from './model-initialization-constraint';
const sandbox = sinon.createSandbox();
const container = new Container();
let constraint: ModelInitializationConstraint;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const listener = sandbox.spy((): void => {});

describe('DefaultModelInitializationConstraint', () => {
    beforeEach(() => {
        constraint = container.resolve(DefaultModelInitializationConstraint);
        sandbox.reset();
    });
    it('should complete after dispatching  non empty SetModelAction and `InitializeCanvasBoundsAction`', () => {
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched(SetModelAction.create({ id: 'model', type: 'graph' }));
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).to.be.true;
    });
    it('should complete after dispatching non empty UpdateModelAction and `InitializeCanvasBoundsAction`', () => {
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched(UpdateModelAction.create({ id: 'model', type: 'graph' }));
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).to.be.true;
    });
    it('should note complete after dispatching empty SetModelAction and `InitializeCanvasBoundsAction` ', () => {
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched(SetModelAction.create(EMPTY_ROOT));
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).to.be.false;
    });
    it('should note complete after dispatching  empty UpdateModelAction and `InitializeCanvasBoundsAction ', () => {
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched(UpdateModelAction.create(EMPTY_ROOT));
        expect(constraint.isCompleted).to.be.false;
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).to.be.false;
    });
    describe('onInitialized', () => {
        it('returned promise should resolve once the constraint is initialized', async () => {
            const initializeDeferred = new Deferred<void>();
            const initializePromise = constraint.onInitialized();
            initializePromise.then(() => initializeDeferred.resolve());
            expect(initializeDeferred.state).to.be.equal('unresolved');
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            // Short delay of test execution to ensure that the deferred state is updated.
            await new Promise(resolve => setTimeout(resolve, 5));
            expect(initializeDeferred.state).to.be.equal('resolved');
        });
        it('registered listener should be invoked once the constraint is initialized', () => {
            constraint.onInitialized(listener);
            expect(listener.called).to.be.false;
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            expect(listener.called).to.be.true;
        });
        it('registered listener should be invoked directly on registration if the constraint is already initialized', () => {
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            constraint.onInitialized(listener);
            expect(listener.called).to.be.true;
        });
        it('Disposed listener should not be invoked once the constraint is initialized', () => {
            const toDispose = constraint.onInitialized(listener);
            expect(listener.called).to.be.false;
            toDispose.dispose();
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            expect(listener.called).to.be.false;
        });
    });
});
