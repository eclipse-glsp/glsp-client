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
import { Container } from 'inversify';
import 'reflect-metadata';
import { Deferred, EMPTY_ROOT, InitializeCanvasBoundsAction, SetModelAction, UpdateModelAction } from '@eclipse-glsp/sprotty';
import { DefaultModelInitializationConstraint, ModelInitializationConstraint } from './model-initialization-constraint';
const container = new Container();
let constraint: ModelInitializationConstraint;

const listener = vi.fn((): void => {});

describe('DefaultModelInitializationConstraint', () => {
    beforeEach(() => {
        constraint = container.resolve(DefaultModelInitializationConstraint);
        listener.mockClear();
    });
    it('should complete after dispatching  non empty SetModelAction and `InitializeCanvasBoundsAction`', () => {
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched(SetModelAction.create({ id: 'model', type: 'graph' }));
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).toBe(true);
    });
    it('should complete after dispatching non empty UpdateModelAction and `InitializeCanvasBoundsAction`', () => {
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched(UpdateModelAction.create({ id: 'model', type: 'graph' }));
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).toBe(true);
    });
    it('should note complete after dispatching empty SetModelAction and `InitializeCanvasBoundsAction` ', () => {
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched(SetModelAction.create(EMPTY_ROOT));
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).toBe(false);
    });
    it('should note complete after dispatching  empty UpdateModelAction and `InitializeCanvasBoundsAction ', () => {
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched(UpdateModelAction.create(EMPTY_ROOT));
        expect(constraint.isCompleted).toBe(false);
        constraint.notifyDispatched({ kind: InitializeCanvasBoundsAction.KIND });
        expect(constraint.isCompleted).toBe(false);
    });
    describe('onInitialized', () => {
        it('returned promise should resolve once the constraint is initialized', async () => {
            const initializeDeferred = new Deferred<void>();
            const initializePromise = constraint.onInitialized();
            initializePromise.then(() => initializeDeferred.resolve());
            expect(initializeDeferred.state).toBe('unresolved');
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            // Short delay of test execution to ensure that the deferred state is updated.
            await new Promise(resolve => setTimeout(resolve, 5));
            expect(initializeDeferred.state).toBe('resolved');
        });
        it('registered listener should be invoked once the constraint is initialized', () => {
            constraint.onInitialized(listener);
            expect(listener).not.toHaveBeenCalled();
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            expect(listener).toHaveBeenCalled();
        });
        it('registered listener should be invoked directly on registration if the constraint is already initialized', () => {
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            constraint.onInitialized(listener);
            expect(listener).toHaveBeenCalled();
        });
        it('Disposed listener should not be invoked once the constraint is initialized', () => {
            const toDispose = constraint.onInitialized(listener);
            expect(listener).not.toHaveBeenCalled();
            toDispose.dispose();
            // Directly trigger the completion method simplify test logic
            constraint['setCompleted']();
            expect(listener).not.toHaveBeenCalled();
        });
    });
});
