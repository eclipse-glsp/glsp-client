/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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

import { Deferred } from 'sprotty-protocol';
import { Disposable } from 'vscode-jsonrpc';
import { Action, ActionMessage } from '../action-protocol/base-protocol';
import { distinctAdd, remove } from '../utils/array-util';
import { Emitter, Event } from '../utils/event';
import { ActionMessageHandler, ClientState, GLSPClient } from './glsp-client';
import { GLSPClientProxy, GLSPServer } from './glsp-server';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters, InitializeResult } from './types';

export const GLOBAL_HANDLER_ID = '*';
/**
 * A simple {@link GLSPClient} implementation for use cases where the client & server are running
 * in the same context/process without a communication layer (like json-rpc) between. The client
 * directly communicates with a given {@link GLSPServer} instance.
 */
export class BaseGLSPClient implements GLSPClient {
    protected serverDeferred = new Deferred<GLSPServer>();
    protected onStartDeferred = new Deferred<void>();
    protected onStopDeferred = new Deferred<void>();
    readonly proxy: GLSPClientProxy;
    protected startupTimeout = 1500;
    protected actionMessageHandlers: Map<string, ActionMessageHandler[]> = new Map([[GLOBAL_HANDLER_ID, []]]);
    protected pendingServerInitialize?: Promise<InitializeResult>;

    protected onServerInitializedEmitter = new Emitter<InitializeResult>();
    get onServerInitialized(): Event<InitializeResult> {
        return this.onServerInitializedEmitter.event;
    }

    protected onCurrentStateChangedEmitter = new Emitter<ClientState>();
    get onCurrentStateChanged(): Event<ClientState> {
        return this.onCurrentStateChangedEmitter.event;
    }

    protected _state: ClientState;
    protected set state(state: ClientState) {
        if (this._state !== state) {
            this._state = state;
            this.onCurrentStateChangedEmitter.fire(state);
        }
    }
    protected get state(): ClientState {
        return this._state;
    }

    protected _server?: GLSPServer;
    protected get checkedServer(): GLSPServer {
        this.checkState();
        if (!this._server) {
            throw new Error(`No server is configured for GLSPClient with id '${this.id}'`);
        }
        return this._server;
    }

    protected _initializeResult?: InitializeResult;
    get initializeResult(): InitializeResult | undefined {
        return this._initializeResult;
    }

    constructor(protected options: GLSPClient.Options) {
        this.state = ClientState.Initial;
        this.proxy = this.createProxy();
    }

    protected createProxy(): GLSPClientProxy {
        return {
            process: message => {
                const handlers = this.actionMessageHandlers.get(message.clientId) ?? this.actionMessageHandlers.get(GLOBAL_HANDLER_ID);
                if (!handlers) {
                    console.warn('No ActionMessageHandler is configured- Cannot process server message', message);
                    return;
                }
                handlers.forEach(handler => handler(message));
            }
        };
    }

    configureServer(server: GLSPServer): void {
        if (this.state === ClientState.Running) {
            throw new Error('Could not configure new server. The GLSPClient is already running');
        }
        this.serverDeferred.resolve(server);
    }

    start(): Promise<void> {
        if (this.state === ClientState.Running || this.state === ClientState.Starting) {
            return this.onStartDeferred.promise;
        }

        this.state = ClientState.Starting;
        const timeOut = new Promise<GLSPServer>((_, reject) =>
            setTimeout(() => {
                reject(new Error('Could not start client. No server is configured'));
            }, this.startupTimeout)
        );
        Promise.race([this.serverDeferred.promise, timeOut])
            .then(server => {
                this._server = server;
                this.state = ClientState.Running;
                this.onStartDeferred.resolve();
            })
            .catch(error => {
                this.state = ClientState.StartFailed;
                this.onStartDeferred.reject(error);
            });

        return this.onStartDeferred.promise;
    }

    async initializeServer(params: InitializeParameters): Promise<InitializeResult> {
        if (this.initializeResult) {
            return this.initializeResult;
        } else if (this.pendingServerInitialize) {
            return this.pendingServerInitialize;
        }

        const initializeDeferred = new Deferred<InitializeResult>();
        try {
            this.pendingServerInitialize = initializeDeferred.promise;
            this._initializeResult = await this.checkedServer.initialize(params);
            this.onServerInitializedEmitter.fire(this._initializeResult);
            initializeDeferred.resolve(this._initializeResult);
            this.pendingServerInitialize = undefined;
        } catch (error) {
            initializeDeferred.reject(error);
            this._initializeResult = undefined;
            this.pendingServerInitialize = undefined;
        }
        return initializeDeferred.promise;
    }

    initializeClientSession(params: InitializeClientSessionParameters): Promise<void> {
        return this.checkedServer.initializeClientSession(params);
    }

    disposeClientSession(params: DisposeClientSessionParameters): Promise<void> {
        return this.checkedServer.disposeClientSession(params);
    }

    shutdownServer(): void {
        this.checkedServer.shutdown();
    }

    async stop(): Promise<void> {
        if (this.state === ClientState.Stopped || this.state === ClientState.Stopping) {
            return this.onStop();
        }

        this.state = ClientState.Stopping;
        try {
            if (this._server) {
                this._server.shutdown();
            }
        } finally {
            this.state = ClientState.Stopped;
            this.onStopDeferred.resolve();
        }
    }

    sendActionMessage(message: ActionMessage<Action>): void {
        this.checkedServer.process(message);
    }

    onActionMessage(handler: ActionMessageHandler, clientId?: string): Disposable {
        if (!clientId) {
            distinctAdd(this.actionMessageHandlers.get(GLOBAL_HANDLER_ID)!, handler);
            return Disposable.create(() => remove(this.actionMessageHandlers.get(GLOBAL_HANDLER_ID)!, handler));
        }
        if (!this.actionMessageHandlers.has(clientId)) {
            this.actionMessageHandlers.set(clientId, [handler]);
        } else {
            distinctAdd(this.actionMessageHandlers.get(clientId)!, handler);
        }
        return Disposable.create(() => remove(this.actionMessageHandlers.get(clientId)!, handler));
    }

    get currentState(): ClientState {
        return this.state;
    }

    onStart(): Promise<void> {
        return this.onStartDeferred.promise;
    }

    onStop(): Promise<void> {
        return this.onStopDeferred.promise;
    }

    get id(): string {
        return this.options.id;
    }

    protected checkState(): void | never {
        if (this.state !== ClientState.Running) {
            throw new Error(`Client with id '${this.id}' is not in 'Running' state`);
        }
    }

    setStartupTimeout(ms: number): void {
        this.startupTimeout = ms;
    }
}
