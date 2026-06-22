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
import { ActionHandlerRegistry, Deferred, IActionHandler, RequestAction, ResponseAction, TYPES } from '@eclipse-glsp/sprotty';
import { describe, expect, it } from 'vitest';
import { Container } from 'inversify';

/** Yields to the event loop long enough for pending microtasks (and already-queued timers) to run. */
const flushMicrotasks = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

import { GLSPActionDispatcher } from './action-dispatcher';
import { defaultModule } from './default.module';
import { IDiagramOptions } from './model/diagram-loader';

const container = new Container();
container.load(defaultModule);
container.bind(TYPES.IDiagramOptions).toConstantValue(<IDiagramOptions>(<unknown>{
    clientId: 'client1',
    diagramType: 'diagramType',
    glspClientProvider: async () => ({}) as any
}));
const registry = container.get(ActionHandlerRegistry);
const actionDispatcher = container.get(GLSPActionDispatcher);

let testHandlerDelay = 0;
const testHandler: IActionHandler = {
    handle: action => {
        const request = action as RequestAction<ResponseAction>;
        new Promise(resolve => setTimeout(resolve, testHandlerDelay)).then(() =>
            actionDispatcher.dispatch({
                kind: 'response',
                responseId: request.requestId
            } as ResponseAction)
        );
    }
};
registry.register('request', testHandler);

registry.register('response', { handle: () => {} });
actionDispatcher.initialize().then(() => {
    actionDispatcher['blockUntil'] = undefined;
});

describe('GLSPActionDispatcher', () => {
    describe('requestUntil', () => {
        it('should resolve successfully if response dispatched within timeout', async () => {
            testHandlerDelay = 15;
            const requestAction = { kind: 'request', requestId: '' };
            const response = await actionDispatcher.requestUntil(requestAction, 150);
            expect(response?.responseId).toBe(requestAction.requestId);
        });
        it('should resolve to `undefined` if no response dispatched within timeout & `rejectOnTimeout` flag is false', async () => {
            testHandlerDelay = 30;
            const requestAction = { kind: 'request', requestId: '' };
            const response = await actionDispatcher.requestUntil(requestAction, 5);
            expect(response).toBeUndefined();
        });
        it('should be rejected if no response dispatched within timeout & `rejectOnTimeout` flag is true', async () => {
            testHandlerDelay = 30;
            const requestAction = { kind: 'request', requestId: '' };
            const gotRejected = await actionDispatcher.requestUntil(requestAction, 5, true).then(
                () => false,
                () => true
            );
            expect(gotRejected, 'Response promise should be rejected').toBe(true);
        });
        it('should not leak timeout entries once the request settles', async () => {
            const timeouts = actionDispatcher['timeouts'] as Map<string, unknown>;

            // resolved-within-timeout path
            testHandlerDelay = 5;
            await actionDispatcher.requestUntil({ kind: 'request', requestId: '' }, 150);
            // timed-out path
            testHandlerDelay = 50;
            await actionDispatcher.requestUntil({ kind: 'request', requestId: '' }, 5);
            // missing-handler path: rejects the request, must still clear the timeout
            await actionDispatcher.requestUntil({ kind: 'noHandlerRequest', requestId: '' }, 50).catch(() => undefined);
            await flushMicrotasks();

            expect(timeouts.size, 'all timeout entries should be cleared after the requests settle').toBe(0);
        });
    });
    describe('request & re-dispatch', () => {
        it('should be possible to re-dispatch the response of a `request` call', async () => {
            const requestAction = { kind: 'request', requestId: '' };
            const response = await actionDispatcher.request(requestAction);
            const dispatchSuccessful = await actionDispatcher.dispatch(response).then(
                () => true,
                err => false
            );
            expect(dispatchSuccessful, 'Promise of re-dispatch should resolve successfully').toBe(true);
        });
    });
    describe('async action handlers', () => {
        it('should handle async action handlers correctly', async () => {
            let handlerExecuted = false;
            const asyncHandler: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    handlerExecuted = true;
                }
            };

            registry.register('asyncTest1', asyncHandler);
            await actionDispatcher.dispatch({ kind: 'asyncTest1' });

            expect(handlerExecuted).toBe(true);
        });

        it('should invoke all handlers in one synchronous burst (parallel-start), without serializing on async ones', async () => {
            // asyncHandler1 (registered first) has the longer delay. Serial execution would yield [1, 2];
            // parallel-start lets the shorter handler finish first, yielding [2, 1].
            const executionOrder: number[] = [];
            const asyncHandler1: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 20));
                    executionOrder.push(1);
                }
            };
            const asyncHandler2: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    executionOrder.push(2);
                }
            };

            registry.register('multiAsyncTest', asyncHandler1);
            registry.register('multiAsyncTest', asyncHandler2);
            await actionDispatcher.dispatch({ kind: 'multiAsyncTest' });

            expect(executionOrder).toEqual([2, 1]);
        });

        it('should not let a slow async handler starve a synchronous sibling registered after it', async () => {
            // Sync handler registered after the gated async one must run during the burst, before the
            // async handler is released.
            const executionOrder: number[] = [];
            const gate = new Deferred<void>();
            const slowAsyncHandler: IActionHandler = {
                handle: async () => {
                    await gate.promise;
                    executionOrder.push(1);
                }
            };
            const syncHandler: IActionHandler = {
                handle: () => {
                    executionOrder.push(2);
                }
            };

            registry.register('starveTest', slowAsyncHandler);
            registry.register('starveTest', syncHandler);
            const dispatched = actionDispatcher.dispatch({ kind: 'starveTest' });

            // Let the invocation burst run; the async handler is still gated.
            await flushMicrotasks();
            expect(executionOrder, 'sync sibling must run before the gated async handler resolves').toEqual([2]);

            gate.resolve();
            await dispatched;
            expect(executionOrder).toEqual([2, 1]);
        });

        it('should not let a never-resolving async handler starve a synchronous sibling', async () => {
            // A handler whose promise never resolves must not prevent other handlers from being invoked.
            const executionOrder: number[] = [];
            const stuckHandler: IActionHandler = {
                handle: () => new Promise<void>(() => undefined) // never resolves
            };
            const syncHandler: IActionHandler = {
                handle: () => {
                    executionOrder.push(1);
                }
            };

            registry.register('stuckTest', stuckHandler);
            registry.register('stuckTest', syncHandler);
            // Intentionally not awaited: the dispatch promise never resolves because of the stuck handler.
            actionDispatcher.dispatch({ kind: 'stuckTest' });

            await flushMicrotasks();
            expect(executionOrder).toEqual([1]);
        });

        it('should not deadlock when an async handler awaits a nested dispatch while a sibling is registered after it', async () => {
            // A serial loop would block the sibling behind the async handler that awaits a nested dispatch,
            // risking deadlock. Parallel-start invokes the sibling in the burst, so nothing waits its turn.
            // Order: 'B' (burst) -> 'sub' (nested) -> 'A' (async tail).
            const executionOrder: string[] = [];
            registry.register('nestedSub', {
                handle: () => {
                    executionOrder.push('sub');
                }
            });
            const nestedDispatchHandler: IActionHandler = {
                handle: async () => {
                    await actionDispatcher.dispatch({ kind: 'nestedSub' });
                    executionOrder.push('A');
                }
            };
            const siblingHandler: IActionHandler = {
                handle: () => {
                    executionOrder.push('B');
                }
            };

            registry.register('nestedTest', nestedDispatchHandler);
            registry.register('nestedTest', siblingHandler);
            await actionDispatcher.dispatch({ kind: 'nestedTest' });

            expect(executionOrder).toEqual(['B', 'sub', 'A']);
        });

        it('should handle mixed sync and async handlers correctly', async () => {
            const executionOrder: number[] = [];
            const syncHandler: IActionHandler = {
                handle: () => {
                    executionOrder.push(1);
                }
            };
            const asyncHandler: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    executionOrder.push(2);
                }
            };

            registry.register('mixedTest', syncHandler);
            registry.register('mixedTest', asyncHandler);
            await actionDispatcher.dispatch({ kind: 'mixedTest' });

            expect(executionOrder).toEqual([1, 2]);
        });

        it('should propagate errors from async handlers', async () => {
            const errorMessage = 'Async handler error';
            const errorHandler: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 5));
                    throw new Error(errorMessage);
                }
            };

            registry.register('errorTest1', errorHandler);
            let caughtError: Error | undefined;
            try {
                await actionDispatcher.dispatch({ kind: 'errorTest1' });
            } catch (error) {
                caughtError = error as Error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError?.message).toBe(errorMessage);
        });

        it('should handle errors in one handler without affecting others when multiple handlers are registered', async () => {
            const executionOrder: number[] = [];
            const successHandler: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 5));
                    executionOrder.push(1);
                }
            };
            const errorHandler: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 5));
                    throw new Error('Handler 2 error');
                }
            };

            registry.register('multiHandlerErrorTest', successHandler);
            registry.register('multiHandlerErrorTest', errorHandler);

            let caughtError: Error | undefined;
            try {
                await actionDispatcher.dispatch({ kind: 'multiHandlerErrorTest' });
            } catch (error) {
                caughtError = error as Error;
            }

            // First handler should have executed successfully
            expect(executionOrder).toEqual([1]);
            // Error should have been thrown
            expect(caughtError).toBeDefined();
            expect(caughtError?.message).toBe('Handler 2 error');
        });

        it('should handle synchronous errors in handlers', async () => {
            const errorMessage = 'Sync handler error';
            const syncErrorHandler: IActionHandler = {
                handle: () => {
                    throw new Error(errorMessage);
                }
            };

            registry.register('syncErrorTest', syncErrorHandler);
            let caughtError: Error | undefined;
            try {
                await actionDispatcher.dispatch({ kind: 'syncErrorTest' });
            } catch (error) {
                caughtError = error as Error;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError?.message).toBe(errorMessage);
        });

        it('should handle async handlers that return actions', async () => {
            const dispatchedActions: string[] = [];
            const returningHandler: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 5));
                    return { kind: 'returnedAction1' };
                }
            };
            const receivingHandler: IActionHandler = {
                handle: action => {
                    dispatchedActions.push(action.kind);
                }
            };

            registry.register('asyncReturnTest', returningHandler);
            registry.register('returnedAction1', receivingHandler);
            await actionDispatcher.dispatch({ kind: 'asyncReturnTest' });

            expect(dispatchedActions).toContain('returnedAction1');
        });

        it('should wait for all async handlers to complete before resolving dispatch promise', async () => {
            let handler1Completed = false;
            let handler2Completed = false;
            const asyncHandler1: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 30));
                    handler1Completed = true;
                }
            };
            const asyncHandler2: IActionHandler = {
                handle: async () => {
                    await new Promise(resolve => setTimeout(resolve, 20));
                    handler2Completed = true;
                }
            };

            registry.register('completionTest', asyncHandler1);
            registry.register('completionTest', asyncHandler2);
            await actionDispatcher.dispatch({ kind: 'completionTest' });

            // Both handlers should be completed when dispatch resolves
            expect(handler1Completed).toBe(true);
            expect(handler2Completed).toBe(true);
        });
    });
});
