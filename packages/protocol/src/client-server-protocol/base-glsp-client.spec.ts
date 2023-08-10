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
import * as sinon from 'sinon';
import * as util from 'util';
import { Action, ActionMessage } from '../action-protocol';
import { expectToThrowAsync } from '../utils/test-util';
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    process(message: ActionMessage<Action>): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    shutdown(): void {}
    addListener(listener: GLSPServerListener): boolean {
        return false;
    }
    removeListener(listener: GLSPServerListener): boolean {
        return false;
    }
}

describe('Node GLSP Client', () => {
    const sandbox = sinon.createSandbox();

    const server = sandbox.stub(new StubGLSPServer());

    // Shared test client instance that is already in running state
    let client = new BaseGLSPClient({ id: 'test' });
    function resetClient(setRunning = true): void {
        sandbox.reset();
        client = new BaseGLSPClient({ id: 'test' });
        if (setRunning) {
            client['_server'] = server;
            client['state'] = ClientState.Running;
        }
    }

    it('Should be in initial state after construction', () => {
        resetClient(false);
        expect(client.currentState).to.be.equal(ClientState.Initial);
    });

    describe('start', () => {
        it('should fail if no server is configured', async () => {
            resetClient(false);
            client.setStartupTimeout(5);
            await expectToThrowAsync(() => client.start());
            expect(client.currentState).to.be.equal(ClientState.StartFailed);
        });
        it('Should resolve when server is configured', async () => {
            resetClient(false);
            client.configureServer(server);
            const result = await client.start();
            expect(result).to.be.undefined;
            expect(client.currentState).to.be.equal(ClientState.Running);
        });
    });

    describe('stop & onStop', () => {
        beforeEach(() => resetClient());
        it('onStop should not resolve if stop has not been called', () => {
            expect(util.inspect(client.onStop())).to.include('pending');
        });
        it('should be in stopped state and onStop should resolve', async () => {
            expect(client.currentState).to.be.not.equal(ClientState.Stopped);
            const stopResult = await client.stop();
            expect(stopResult).to.be.undefined;
            expect(client.currentState).to.be.equal(ClientState.Stopped);
            const onStopResult = await client.onStop();
            expect(onStopResult).to.be.undefined;
            expect(server.shutdown.calledOnce).to.be.true;
        });
    });

    describe('initialize', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            await expectToThrowAsync(() => client.initializeServer({ applicationId: '', protocolVersion: '' }));
            expect(server.initialize.called).to.be.false;
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            await expectToThrowAsync(() => client.initializeServer({ applicationId: '', protocolVersion: '' }));
            expect(server.initialize.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            server.initialize.returns(Promise.resolve(expectedResult));
            expect(client.initializeResult).to.be.undefined;
            const result = await client.initializeServer({ applicationId: 'id', protocolVersion: '1.0.0' });
            expect(result).to.deep.equals(expectedResult);
            expect(server.initialize.calledOnce).to.be.true;
            expect(client.initializeResult).to.be.equal(result);
        });
        it('should return cached result on consecutive invocation', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            server.initialize.returns(Promise.resolve(expectedResult));
            client['_initializeResult'] = expectedResult;
            const result = await client.initializeServer(params);
            expect(result).to.be.deep.equal(client.initializeResult);
            expect(server.initialize.called).to.be.false;
        });
        it('should fire event on first invocation', async () => {
            await resetClient();
            const expectedResult = { protocolVersion: '1.0.0', serverActions: {} };
            const params = { applicationId: 'id', protocolVersion: '1.0.0' };
            server.initialize.returns(Promise.resolve(expectedResult));
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const eventHandler = (result: InitializeResult): void => {};
            const eventHandlerSpy = sinon.spy(eventHandler);
            client.onServerInitialized(eventHandlerSpy);
            await client.initializeServer(params);
            await client.initializeServer(params);
            expect(eventHandlerSpy.calledOnceWith(expectedResult)).to.be.true;
        });
    });

    describe('initializeClientSession', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            await expectToThrowAsync(() => client.initializeClientSession({ clientSessionId: '', diagramType: '' }));
            expect(server.initializeClientSession.called).to.be.false;
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            await expectToThrowAsync(() => client.initializeClientSession({ clientSessionId: '', diagramType: '' }));
            expect(server.initializeClientSession.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();
            const result = await client.initializeClientSession({ clientSessionId: '', diagramType: '' });
            expect(result).to.be.undefined;
            expect(server.initializeClientSession.calledOnce).to.be.true;
        });
    });

    describe('disposeClientSession', () => {
        it('should fail if server is not configured', async () => {
            resetClient(false);
            await expectToThrowAsync(() => client.disposeClientSession({ clientSessionId: '' }));
            expect(server.disposeClientSession.called).to.be.false;
        });
        it('should fail if client is not running', async () => {
            resetClient(false);
            client.configureServer(server);
            await expectToThrowAsync(() => client.disposeClientSession({ clientSessionId: '' }));
            expect(server.disposeClientSession.called).to.be.false;
        });
        it('should invoke the corresponding server method', async () => {
            resetClient();

            const result = await client.disposeClientSession({ clientSessionId: '' });
            expect(result).to.be.undefined;
            expect(server.disposeClientSession.calledOnce).to.be.true;
        });
    });

    describe('shutdownServer', () => {
        it('should fail if server is not configured', () => {
            resetClient(false);
            expect(() => client.shutdownServer()).to.throw();
            expect(server.shutdown.called).to.be.false;
        });
        it('should fail if client is not running', () => {
            resetClient(false);
            client.configureServer(server);
            expect(() => client.shutdownServer()).to.throw();
            expect(server.shutdown.called).to.be.false;
        });
        it('should invoke the corresponding server method', () => {
            resetClient();
            client.shutdownServer();
            expect(server.shutdown.calledOnce).to.be.true;
        });
    });

    describe('sendActionMessage', () => {
        it('should fail if server is not configured', () => {
            resetClient(false);
            expect(() => client.sendActionMessage({ action: { kind: '' }, clientId: '' })).to.throw();
            expect(server.process.called).to.be.false;
        });
        it('should fail if client is not running', () => {
            resetClient(false);
            client.configureServer(server);
            expect(() => client.sendActionMessage({ action: { kind: '' }, clientId: '' })).to.throw();
            expect(server.process.called).to.be.false;
        });
        it('should invoke the corresponding server method', () => {
            resetClient();
            client.sendActionMessage({ action: { kind: '' }, clientId: '' });
            expect(server.process.calledOnce).to.be.true;
        });
    });

    describe('onActionMessage', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const handler = sandbox.spy((_message: ActionMessage): void => {});
        it('should be properly registered if server is not configured', () => {
            resetClient(false);
            client.onActionMessage(handler);
            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).to.be.equal(1);
            expect(handler.called).to.be.false;
        });
        it('should be properly registered if client is not running', () => {
            resetClient(false);
            client.configureServer(server);
            client.onActionMessage(handler);
            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).to.be.equal(1);
            expect(handler.called).to.be.false;
        });
        it('should unregister global handler if dispose is invoked', () => {
            resetClient(false);
            const toDispose = client.onActionMessage(handler);

            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).to.be.equal(1);
            toDispose.dispose();
            expect(client['actionMessageHandlers'].get(GLOBAL_HANDLER_ID)?.length).to.be.equal(0);
        });
        it('should unregister client id handler if dispose is invoked', () => {
            resetClient(false);
            const clientId = 'clientId';
            const toDispose = client.onActionMessage(handler, clientId);

            expect(client['actionMessageHandlers'].size).to.be.equal(2);
            toDispose.dispose();
            expect(client['actionMessageHandlers'].get(clientId)?.length).to.be.equal(0);
        });
        it('should invoke global handler when the an action message is sent via proxy', () => {
            resetClient();
            client.onActionMessage(handler);
            const expectedMessage = { action: { kind: 'someAction' }, clientId: 'someClientId' };
            client.proxy.process(expectedMessage);
            expect(handler.calledOnce).to.be.true;
            expect(handler.firstCall.args[0]).to.deep.equals(expectedMessage);
        });
        it('should invoke client id handler when the an action message is sent via proxy', () => {
            resetClient();
            const clientId = 'clientId';
            client.onActionMessage(handler, clientId);
            const expectedMessage = { action: { kind: 'someAction' }, clientId };
            client.proxy.process(expectedMessage);
            client.proxy.process({ clientId: 'someOtherId', action: { kind: 'someAction' } });
            expect(handler.calledOnce).to.be.true;
            expect(handler.firstCall.args[0]).to.deep.equals(expectedMessage);
        });
    });
});
