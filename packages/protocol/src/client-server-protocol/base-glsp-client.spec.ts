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
import * as util from 'util';
import { Action, ActionMessage } from '../action-protocol/base-protocol';
import { BaseGLSPClient, GLOBAL_HANDLER_ID } from './base-glsp-client';
import { ClientState } from './glsp-client';
import { GLSPServer, GLSPServerListener } from './glsp-server';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters, InitializeResult } from './types';

class StubGLSPServer implements GLSPServer {
    initialize(params: InitializeParameters): Promise<InitializeResult> {
        return Promise.resolve({ protocolVersion: '1.0.0', serverActions: {} });
    }
    initializeClientSession(params: InitializeClientSessionParameters): Promise<void> {
        return Promise.resolve();
    }
    disposeClientSession(params: DisposeClientSessionParameters): Promise<void> {
        return Promise.resolve();
    }

    process(message: ActionMessage<Action>): void {}

    shutdown(): void {}
    addListener(listener: GLSPServerListener): boolean {
        return false;
    }
    removeListener(listener: GLSPServerListener): boolean {
        return false;
    }
}

/**
 * Spies on every method of the given object with a `vi.spyOn` mock that keeps the original
 * implementation, mirroring the former `sandbox.stub(obj)` behavior. The preset's
 * `restoreMocks: true` detaches spies between tests, so `setup()` must be re-invoked in a
 * `beforeEach`. Returns the typed object plus `setup`/`reset` helpers.
 */
function spyOnAllMethods<T extends object>(obj: T): { mock: { [K in keyof T]: T[K] }; setup: () => void; reset: () => void } {
    const methodNames = new Set<string>();
    let proto: any = obj;
    while (proto && proto !== Object.prototype) {
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key !== 'constructor' && typeof (obj as any)[key] === 'function') {
                methodNames.add(key);
            }
        }
        proto = Object.getPrototypeOf(proto);
    }
    // `mockImplementation(() => undefined)` mirrors Sinon's default stub: the original method body
    // is suppressed and the stub returns `undefined` unless a test configures explicit behavior.
    const eachSpy = (fn: (spy: ReturnType<typeof vi.spyOn>) => void): void =>
        methodNames.forEach(name => fn(vi.spyOn(obj as any, name as any).mockImplementation(() => undefined as any)));
    return {
        mock: obj as any,
        setup: () => eachSpy(() => {}),
        reset: () => eachSpy(spy => spy.mockReset().mockImplementation(() => undefined as any))
    };
}

describe('Node GLSP Client', () => {
    const serverStub = spyOnAllMethods(new StubGLSPServer());
    const server = serverStub.mock;
    beforeEach(() => serverStub.setup());

    // Shared test client instance that is already in running state
    let client = new BaseGLSPClient({ id: 'test' });
    function resetClient(setRunning = true): void {
        serverStub.reset();
        client = new BaseGLSPClient({ id: 'test' });
        if (setRunning) {
            client['_server'] = server;
            client['state'] = ClientState.Running;
        }
    }

    it('Should be in initial state after construction', () => {
        resetClient(false);
        expect(client.currentState).toBe(ClientState.Initial);
    });

    describe('start', () => {
        it('should fail if no server is configured', async () => {
            resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            client.setStartupTimeout(5);
            await expect(client.start()).rejects.toThrow();
            expect(client.currentState).toBe(ClientState.StartFailed);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.StartFailed);
        });
        it('Should resolve when server is configured', async () => {
            resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            const started = client.start();
            expect(client.currentState).toBe(ClientState.Starting);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Starting);
            client.configureServer(server);
            await started;
            expect(client.currentState).toBe(ClientState.Running);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Running);
        });
    });

    describe('stop & onStop', () => {
        it('onStop should not resolve if stop has not been called', () => {
            resetClient();
            expect(util.inspect(client.onStop())).toContain('pending');
        });
        it('should be in stopped state and onStop should resolve', async () => {
            resetClient();
            expect(client.currentState).not.toBe(ClientState.Stopped);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            await client.stop();
            expect(client.currentState).toBe(ClientState.Stopped);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Stopping);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Stopped);
            expect(server.shutdown).toHaveBeenCalledOnce();
        });
        it('should only stop a running client once, if stop is called multiple times ', async () => {
            resetClient();
            client.stop();
            await client.stop();
            expect(client.currentState).toBe(ClientState.Stopped);
            expect(server.shutdown).toHaveBeenCalledOnce();
        });
    });

    describe('initialize', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            await expect(client.initializeServer({ applicationId: '', protocolVersion: '' })).rejects.toThrow();
            expect(server.initialize).not.toHaveBeenCalled();
            expect(client.initializeResult).toBeUndefined();
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            await expect(client.initializeServer({ applicationId: '', protocolVersion: '' })).rejects.toThrow();
            expect(server.initialize).not.toHaveBeenCalled();
            expect(client.initializeResult).toBeUndefined();
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            vi.mocked(server.initialize).mockReturnValue(Promise.resolve(expectedResult));
            expect(client.initializeResult).toBeUndefined();
            const result = await client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            expect(result).toEqual(expectedResult);
            expect(server.initialize).toHaveBeenCalledOnce();
            expect(client.initializeResult).toBe(result);
        });
        it('should return cached result on consecutive invocation', async () => {
            resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(server.initialize).mockReturnValue(Promise.resolve(expectedResult));
            client.initializeServer(params);
            const result = await client.initializeServer(params);
            expect(result).toEqual(client.initializeResult);
            expect(server.initialize).toHaveBeenCalledOnce();
        });
        it('should fire event on first invocation', async () => {
            resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(server.initialize).mockReturnValue(Promise.resolve(expectedResult));

            const eventHandlerSpy = vi.fn((result: InitializeResult): void => {});
            client.onServerInitialized(eventHandlerSpy);
            await client.initializeServer(params);
            await client.initializeServer(params);
            expect(eventHandlerSpy).toHaveBeenCalledExactlyOnceWith(expectedResult);
        });
        it('should not use cached result on consecutive invocation if previous invocation errored', async () => {
            resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(server.initialize).mockImplementation(() => {
                throw new Error('error');
            });
            await expect(client.initializeServer(params)).rejects.toThrow();
            expect(client.initializeResult).toBeUndefined();
            vi.mocked(server.initialize).mockReturnValue(Promise.resolve(expectedResult));
            const result = await client.initializeServer(params);
            expect(result).toEqual(expectedResult);
            expect(server.initialize).toHaveBeenCalledTimes(2);
            expect(client.initializeResult).toBe(result);
        });
    });

    describe('initializeClientSession', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            expect(() => client.initializeClientSession({ clientSessionId: '', diagramType: '', clientActionKinds: [] })).toThrow();
            expect(server.initializeClientSession).not.toHaveBeenCalled();
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            expect(() => client.initializeClientSession({ clientSessionId: '', diagramType: '', clientActionKinds: [] })).toThrow();
            expect(server.initializeClientSession).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();
            const result = await client.initializeClientSession({ clientSessionId: '', diagramType: '', clientActionKinds: [] });
            expect(result).toBeUndefined();
            expect(server.initializeClientSession).toHaveBeenCalledOnce();
        });
    });

    describe('disposeClientSession', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            expect(() => client.disposeClientSession({ clientSessionId: '' })).toThrow();
            expect(server.disposeClientSession).not.toHaveBeenCalled();
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            expect(() => client.disposeClientSession({ clientSessionId: '' })).toThrow();
            expect(server.disposeClientSession).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();

            const result = await client.disposeClientSession({ clientSessionId: '' });
            expect(result).toBeUndefined();
            expect(server.disposeClientSession).toHaveBeenCalledOnce();
        });
    });

    describe('shutdownServer', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            // `shutdownServer` is now async; guard failures surface as a rejected promise.
            let rejection: unknown;
            try {
                await client.shutdownServer();
            } catch (err) {
                rejection = err;
            }
            expect(rejection).toBeInstanceOf(Error);
            expect((rejection as Error).message).toMatch(/not in 'Running' state/);
            expect(server.shutdown).not.toHaveBeenCalled();
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            let rejection: unknown;
            try {
                await client.shutdownServer();
            } catch (err) {
                rejection = err;
            }
            expect(rejection).toBeInstanceOf(Error);
            expect((rejection as Error).message).toMatch(/not in 'Running' state/);
            expect(server.shutdown).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();
            await client.shutdownServer();
            expect(server.shutdown).toHaveBeenCalledOnce();
        });
    });

    describe('sendActionMessage', () => {
        it('should fail if server is not configured', () => {
            resetClient(false);
            expect(() => client.sendActionMessage({ action: { kind: '' }, clientId: '' })).toThrow();
            expect(server.process).not.toHaveBeenCalled();
        });
        it('should fail if client is not running', () => {
            resetClient(false);
            client.configureServer(server);
            expect(() => client.sendActionMessage({ action: { kind: '' }, clientId: '' })).toThrow();
            expect(server.process).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', () => {
            resetClient();
            client.sendActionMessage({ action: { kind: '' }, clientId: '' });
            expect(server.process).toHaveBeenCalledOnce();
        });
    });

    describe('onActionMessage', () => {
        const handler = vi.fn((_message: ActionMessage): void => {});
        beforeEach(() => handler.mockClear());
        it('should be properly registered if server is not configured', () => {
            resetClient(false);
            client.onActionMessage(handler);
            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).toBe(1);
            expect(handler).not.toHaveBeenCalled();
        });
        it('should be properly registered if client is not running', () => {
            resetClient(false);
            client.configureServer(server);
            client.onActionMessage(handler);
            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).toBe(1);
            expect(handler).not.toHaveBeenCalled();
        });
        it('should unregister global handler if dispose is invoked', () => {
            resetClient(false);
            const toDispose = client.onActionMessage(handler);

            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).toBe(1);
            toDispose.dispose();
            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).toBe(0);
        });
        it('should unregister client id handler if dispose is invoked', () => {
            resetClient(false);
            const clientId = 'clientId';
            const toDispose = client.onActionMessage(handler, clientId);

            expect(client['actionMessageHandlers'].size).toBe(2);
            toDispose.dispose();
            expect(client['actionMessageHandlers'].get(clientId)?.length).toBe(0);
        });
        it('should invoke global handler when the an action message is sent via proxy', () => {
            resetClient();
            client.onActionMessage(handler);
            const expectedMessage = { action: { kind: 'someAction' }, clientId: 'someClientId' };
            client.proxy.process(expectedMessage);
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0]).toEqual(expectedMessage);
        });
        it('should invoke client id handler when the an action message is sent via proxy', () => {
            resetClient();
            const clientId = 'clientId';
            client.onActionMessage(handler, clientId);
            const expectedMessage = { action: { kind: 'someAction' }, clientId };
            client.proxy.process(expectedMessage);
            client.proxy.process({ clientId: 'someOtherId', action: { kind: 'someAction' } });
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0]).toEqual(expectedMessage);
        });
    });
});
