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
/* eslint-disable @typescript-eslint/no-empty-function */
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Disposable, Event, MessageConnection, NotificationHandler, ProgressType } from 'vscode-jsonrpc';
import { ActionMessage } from '../../action-protocol/base-protocol';
import { remove } from '../../utils/array-util';
import { Emitter } from '../../utils/event';
import { expectToThrowAsync } from '../../utils/test-util';
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

describe('Base JSON-RPC GLSP Client', () => {
    const sandbox = sinon.createSandbox();
    const connection = sandbox.stub<StubMessageConnection>(new StubMessageConnection());
    let client = new TestJsonRpcClient({ id: 'test', connectionProvider: connection });
    async function resetClient(setRunning = true): Promise<void> {
        sandbox.reset();
        client = new TestJsonRpcClient({ id: 'test', connectionProvider: connection });
        if (setRunning) {
            return client.start();
        }
    }

    describe('start', () => {
        it('should successfully start & activate the connection', async () => {
            await resetClient(false);
            expect(client.currentState).to.be.equal(ClientState.Initial);
            client.start();
            expect(client.currentState).to.be.equal(ClientState.Starting);
            const result = await client.start();
            expect(result).to.be.undefined;
            expect(client.currentState).to.be.equal(ClientState.Running);
            expect(client.isConnectionActive()).to.be.true;
        });
    });

    describe('stop', () => {
        it('should successfully stop if the client was not running', async () => {
            await resetClient(false);
            expect(client.currentState).to.be.equal(ClientState.Initial);
            const stopResult = await client.stop();
            expect(stopResult).to.be.undefined;
            expect(client.currentState).to.be.equal(ClientState.Stopped);
        });
        it('should successfully stop if the client was running', async () => {
            await resetClient();
            client.stop();
            expect(client.currentState).to.be.equal(ClientState.Stopping);
            const stopResult = await client.stop();
            expect(stopResult).to.be.undefined;
            expect(client.currentState).to.be.equal(ClientState.Stopped);
        });
    });

    describe('initialize', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            await expectToThrowAsync(() => client.initializeServer({ applicationId: '', protocolVersion: '' }));
            expect(connection.sendRequest.called).to.be.false;
        });
        it('should forward the corresponding initialize request and cache result', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            const initializeMock = connection.sendRequest.withArgs(JsonrpcGLSPClient.InitializeRequest, params);
            initializeMock.returns(expectedResult);
            expect(client.initializeResult).to.be.undefined;
            const result = await client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            expect(result).to.deep.equals(expectedResult);
            expect(initializeMock.calledOnce).to.be.true;
            expect(client.initializeResult).to.be.equal(result);
        });
        it('should return cached result on consecutive invocation', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            const initializeMock = connection.sendRequest.withArgs(JsonrpcGLSPClient.InitializeRequest, params);
            initializeMock.returns(expectedResult);
            client['_initializeResult'] = expectedResult;
            const result = await client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            expect(result).to.be.deep.equal(client.initializeResult);
            expect(initializeMock.called).to.be.false;
        });
        it('should fire event on first invocation', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            const initializeMock = connection.sendRequest.withArgs(JsonrpcGLSPClient.InitializeRequest, params);
            initializeMock.returns(expectedResult);
            const eventHandler = (result: InitializeResult): void => {};
            const eventHandlerSpy = sinon.spy(eventHandler);
            client.onServerInitialized(eventHandlerSpy);
            await client.initializeServer(params);
            await client.initializeServer(params);
            expect(eventHandlerSpy.calledOnceWith(expectedResult)).to.be.true;
        });
    });

    describe('initializeClientSession', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            await expectToThrowAsync(() => client.initializeClientSession({ clientSessionId: '', diagramType: '', clientActionKinds: [] }));
            expect(connection.sendRequest.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const params = { clientSessionId: '', diagramType: '', clientActionKinds: [] };
            const initializeSessionMock = connection.sendRequest.withArgs(JsonrpcGLSPClient.InitializeClientSessionRequest, params);
            const result = await client.initializeClientSession(params);
            expect(result).to.be.undefined;
            expect(initializeSessionMock.calledOnce).to.be.true;
        });
    });

    describe('disposeClientSession', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            await expectToThrowAsync(() => client.disposeClientSession({ clientSessionId: '' }));
            expect(connection.sendRequest.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const params = { clientSessionId: 'someClient' };
            const disposeSessionMock = connection.sendRequest.withArgs(JsonrpcGLSPClient.DisposeClientSessionRequest, params);
            const result = await client.disposeClientSession(params);
            expect(result).to.be.undefined;
            expect(disposeSessionMock.calledOnce).to.be.true;
        });
    });

    describe('shutdownServer', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            expect(() => client.shutdownServer()).to.throw();
            expect(connection.sendNotification.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const shutdownMock = connection.sendNotification.withArgs(JsonrpcGLSPClient.ShutdownNotification);
            const result = await client.shutdownServer();
            expect(result).to.be.undefined;
            expect(shutdownMock.calledOnce).to.be.true;
        });
    });

    describe('sendActionMessage', () => {
        it('should fail if client is not running', async () => {
            await resetClient(false);
            expect(() => client.sendActionMessage({ action: { kind: '' }, clientId: '' })).to.throw();
            expect(connection.sendNotification.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            await resetClient();
            const message = { action: { kind: '' }, clientId: '' };
            const messageMock = connection.sendNotification.withArgs(JsonrpcGLSPClient.ActionMessageNotification, message);
            client.sendActionMessage({ action: { kind: '' }, clientId: '' });
            expect(messageMock.calledOnce).to.be.true;
        });
    });

    describe('onActionMessage', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const handler = sandbox.spy((_message: ActionMessage): void => {});

        it('should be registered to message emitter if client is not running', async () => {
            await resetClient(false);
            client.onActionMessage(handler);
            expect(client.firstListenerAdded).to.be.true;
        });

        it('should be registered to message emitter if client is running', async () => {
            await resetClient();
            client.onActionMessage(handler, 'someId');
            expect(client.firstListenerAdded).to.be.true;
        });
        it('should unregister lister if dispose is invoked', () => {
            resetClient(false);
            const clientId = 'clientId';
            const toDispose = client.onActionMessage(handler, clientId);
            expect(client.firstListenerAdded).to.be.true;
            toDispose.dispose();
            expect(client.lastListenerRemoved).to.be.true;
        });
    });

    describe('Connection events', () => {
        it('Should be in error state after connection error', async () => {
            // mock setup
            resetClient(false);
            const listeners: ((e: unknown) => unknown)[] = [];
            connection.onError.callsFake(listener => {
                listeners.push(listener);
                return Disposable.create(() => remove(listeners, listener));
            });

            await client.start();
            listeners.forEach(listener => listener(new Error('SomeError')));
            expect(client.currentState).to.be.equal(ClientState.ServerError);
        });
        it('Should be in error state after connection close while running', async () => {
            // mock setup
            resetClient(false);
            const listeners: ((e: unknown) => unknown)[] = [];
            connection.onClose.callsFake(listener => {
                listeners.push(listener);
                return Disposable.create(() => remove(listeners, listener));
            });

            await client.start();
            listeners.forEach(listener => listener(undefined));
            expect(client.currentState).to.be.equal(ClientState.ServerError);
        });
    });
});
