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
import { Disposable, Event, MessageConnection, NotificationHandler, ProgressType } from 'vscode-jsonrpc';
import { ActionMessage } from '../../action-protocol/base-protocol';
import { remove } from '../../utils/array-util';
import { Emitter } from '../../utils/event';
import { ClientState } from '../glsp-client';
import { InitializeResult } from '../types';
import { BaseJsonrpcGLSPClient } from './base-jsonrpc-glsp-client';
import { JsonrpcGLSPClient } from './glsp-jsonrpc-client';

class StubMessageConnection implements MessageConnection {
    private mockEvent: Event<any> = (listener: (e: any) => any, thisArgs?: any, disposables?: Disposable[]): Disposable =>
        Disposable.create(() => {});

    sendRequest(...args: any[]): any {
        throw new Error('Method not implemented.');
    }

    onRequest(...args: unknown[]): Disposable {
        return Disposable.create(() => {});
    }
    hasPendingResponse(): boolean {
        return false;
    }
    sendNotification(...args: unknown[]): Promise<void> {
        return Promise.resolve();
    }

    onNotification(...args: unknown[]): Disposable {
        return Disposable.create(() => {});
    }

    onProgress<P>(type: ProgressType<P>, token: string | number, handler: NotificationHandler<P>): Disposable {
        throw new Error('Method not implemented.');
    }
    sendProgress<P>(type: ProgressType<P>, token: string | number, value: P): Promise<void> {
        throw new Error('Method not implemented.');
    }
    onUnhandledProgress = this.mockEvent;

    trace(...args: unknown[]): Promise<void> {
        return Promise.resolve();
    }
    onError = this.mockEvent;
    onClose = this.mockEvent;
    listen(): void {}
    onUnhandledNotification = this.mockEvent;
    end(): void {}
    onDispose = this.mockEvent;
    dispose(): void {}
    inspect(): void {}
}

class TestJsonRpcClient extends BaseJsonrpcGLSPClient {
    protected override onActionMessageNotificationEmitter = new Emitter<ActionMessage>({
        onFirstListenerAdd: () => (this.firstListenerAdded = true),
        onLastListenerRemove: () => (this.lastListenerRemoved = true)
    });

    firstListenerAdded: boolean;
    lastListenerRemoved: boolean;
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

describe('Base JSON-RPC GLSP Client', () => {
    const connectionStub = spyOnAllMethods(new StubMessageConnection());
    const connection = connectionStub.mock;
    beforeEach(() => connectionStub.setup());
    let client = new TestJsonRpcClient({ id: 'test', connectionProvider: connection });
    async function resetClient(setRunning = true): Promise<void> {
        connectionStub.reset();
        client = new TestJsonRpcClient({ id: 'test', connectionProvider: connection });
        if (setRunning) {
            return client.start();
        }
    }

    describe('start', () => {
        it('should successfully start & activate the connection', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            expect(client.currentState).toBe(ClientState.Initial);
            const startCompleted = client.start();
            expect(client.currentState).toBe(ClientState.Starting);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Starting);
            await startCompleted;
            expect(client.currentState).toBe(ClientState.Running);
            expect(client.isConnectionActive()).toBe(true);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Running);
        });
        it('should fail to start if connecting to the server fails', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            expect(client.currentState).toBe(ClientState.Initial);
            vi.mocked(connection.listen).mockImplementation(() => {
                throw new Error('Connection failed');
            });
            await client.start();
            expect(client.currentState).toBe(ClientState.StartFailed);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.StartFailed);
        });
        it('should not start another connection if another start is already in progress', async () => {
            await resetClient(false);
            client.start();
            await client.start();
            expect(client.currentState).toBe(ClientState.Running);
            expect(client.isConnectionActive()).toBe(true);
            expect(connection.listen).toHaveBeenCalledOnce();
        });
    });

    describe('stop', () => {
        it('should successfully stop if the client was not running', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            expect(client.currentState).toBe(ClientState.Initial);
            await client.stop();
            expect(client.currentState).toBe(ClientState.Stopped);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Stopped);
            expect(connection.dispose).not.toHaveBeenCalled();
        });
        it('should successfully stop if the client was running', async () => {
            await resetClient();
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            const stopped = client.stop();
            expect(client.currentState).toBe(ClientState.Stopping);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Stopping);
            await stopped;
            expect(client.currentState).toBe(ClientState.Stopped);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.Stopped);
            expect(connection.dispose).toHaveBeenCalled();
        });
        it('should only stop a running client once, if stop is called multiple times', async () => {
            await resetClient();
            client.stop();
            expect(client.currentState).toBe(ClientState.Stopping);
            await client.stop();
            expect(client.currentState).toBe(ClientState.Stopped);
            expect(connection.dispose).toHaveBeenCalledOnce();
        });
    });

    describe('initialize', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            await expect(client.initializeServer({ applicationId: '', protocolVersion: '' })).rejects.toThrow();
            expect(connection.sendRequest).not.toHaveBeenCalled();
            expect(stateChangeHandler).not.toHaveBeenCalled();
        });
        it('should forward the corresponding initialize request and cache result', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(connection.sendRequest).mockReturnValue(expectedResult as any);
            expect(client.initializeResult).toBeUndefined();
            const result = await client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            expect(result).toEqual(expectedResult);
            expect(connection.sendRequest).toHaveBeenCalledExactlyOnceWith(JsonrpcGLSPClient.InitializeRequest, params);
            expect(client.initializeResult).toBe(result);
        });
        it('should return cached result on consecutive invocation', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(connection.sendRequest).mockReturnValue(expectedResult as any);
            client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            const result = await client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            expect(result).toEqual(client.initializeResult);
            expect(connection.sendRequest).toHaveBeenCalledExactlyOnceWith(JsonrpcGLSPClient.InitializeRequest, params);
        });
        it('should fire event on first invocation', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(connection.sendRequest).mockReturnValue(expectedResult as any);
            const eventHandlerSpy = vi.fn((result: InitializeResult): void => {});
            client.onServerInitialized(eventHandlerSpy);
            await client.initializeServer(params);
            await client.initializeServer(params);
            expect(eventHandlerSpy).toHaveBeenCalledExactlyOnceWith(expectedResult);
        });
        it('should not use cached result on consecutive invocation if previous invocation errored', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            vi.mocked(connection.sendRequest).mockImplementation(() => {
                throw new Error('SomeError');
            });
            await expect(client.initializeServer(params)).rejects.toThrow();
            expect(client.initializeResult).toBeUndefined();
            vi.mocked(connection.sendRequest).mockReturnValue(expectedResult as any);
            const result = await client.initializeServer(params);
            expect(result).toEqual(expectedResult);
            expect(connection.sendRequest).toHaveBeenCalledTimes(2);
            expect(connection.sendRequest).toHaveBeenCalledWith(JsonrpcGLSPClient.InitializeRequest, params);
            expect(client.initializeResult).toBe(result);
        });
    });

    describe('initializeClientSession', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            expect(() => client.initializeClientSession({ clientSessionId: '', diagramType: '', clientActionKinds: [] })).toThrow();
            expect(connection.sendRequest).not.toHaveBeenCalled();
            expect(stateChangeHandler).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const params = { clientSessionId: '', diagramType: '', clientActionKinds: [] };
            const result = await client.initializeClientSession(params);
            expect(result).toBeUndefined();
            expect(connection.sendRequest).toHaveBeenCalledExactlyOnceWith(JsonrpcGLSPClient.InitializeClientSessionRequest, params);
        });
    });

    describe('disposeClientSession', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            expect(() => client.disposeClientSession({ clientSessionId: '' })).toThrow();
            expect(connection.sendRequest).not.toHaveBeenCalled();
            expect(stateChangeHandler).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const params = { clientSessionId: 'someClient' };
            const result = await client.disposeClientSession(params);
            expect(result).toBeUndefined();
            expect(connection.sendRequest).toHaveBeenCalledExactlyOnceWith(JsonrpcGLSPClient.DisposeClientSessionRequest, params);
        });
    });

    describe('shutdownServer', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            // `shutdownServer` is now async; the connection-state guard rejects the returned
            // promise rather than throwing synchronously.
            let rejection: unknown;
            try {
                await client.shutdownServer();
            } catch (err) {
                rejection = err;
            }
            expect(rejection).toBeInstanceOf(Error);
            expect((rejection as Error).message).toBe(JsonrpcGLSPClient.ClientNotReadyMsg);
            expect(connection.sendNotification).not.toHaveBeenCalled();
            expect(stateChangeHandler).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const result = await client.shutdownServer();
            expect(result).toBeUndefined();
            expect(connection.sendNotification).toHaveBeenCalledExactlyOnceWith(JsonrpcGLSPClient.ShutdownNotification);
        });
    });

    describe('sendActionMessage', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            expect(() => client.sendActionMessage({ action: { kind: '' }, clientId: '' })).toThrow();
            expect(connection.sendNotification).not.toHaveBeenCalled();
            expect(stateChangeHandler).not.toHaveBeenCalled();
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const message = { action: { kind: '' }, clientId: '' };
            client.sendActionMessage({ action: { kind: '' }, clientId: '' });
            expect(connection.sendNotification).toHaveBeenCalledExactlyOnceWith(JsonrpcGLSPClient.ActionMessageNotification, message);
        });
    });

    describe('onActionMessage', () => {
        const handler = vi.fn((_message: ActionMessage): void => {});
        beforeEach(() => handler.mockClear());

        it('should be registered to message emitter if client is not running', async () => {
            await resetClient(false);
            client.onActionMessage(handler);
            expect(client.firstListenerAdded).toBe(true);
        });

        it('should be registered to message emitter if client is running', async () => {
            await resetClient();
            client.onActionMessage(handler, 'someId');
            expect(client.firstListenerAdded).toBe(true);
        });
        it('should unregister lister if dispose is invoked', () => {
            resetClient(false);
            const clientId = 'clientId';
            const toDispose = client.onActionMessage(handler, clientId);
            expect(client.firstListenerAdded).toBe(true);
            toDispose.dispose();
            expect(client.lastListenerRemoved).toBe(true);
        });
    });

    describe('Connection events', () => {
        it('Should be in error state after connection error', async () => {
            // mock setup
            resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            const listeners: ((e: unknown) => unknown)[] = [];
            vi.mocked(connection.onError).mockImplementation((listener: any) => {
                listeners.push(listener);
                return Disposable.create(() => remove(listeners, listener));
            });

            await client.start();
            listeners.forEach(listener => listener(new Error('SomeError')));
            expect(client.currentState).toBe(ClientState.ServerError);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.ServerError);
        });
        it('Should be in error state after connection close while running', async () => {
            // mock setup
            resetClient(false);
            const stateChangeHandler = vi.fn();
            client.onCurrentStateChanged(stateChangeHandler);
            const listeners: ((e: unknown) => unknown)[] = [];
            vi.mocked(connection.onClose).mockImplementation((listener: any) => {
                listeners.push(listener);
                return Disposable.create(() => remove(listeners, listener));
            });

            await client.start();
            listeners.forEach(listener => listener(undefined));
            expect(client.currentState).toBe(ClientState.ServerError);
            expect(stateChangeHandler).toHaveBeenCalledWith(ClientState.ServerError);
        });
    });
});
