/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { injectable } from 'inversify';
import { Disposable, Message, MessageConnection } from 'vscode-jsonrpc';
import { ActionMessage } from '../../action-protocol';
import { Emitter, Event } from '../../utils/event';
import { ActionMessageHandler, ClientState, GLSPClient } from '../glsp-client';
import { GLSPClientProxy } from '../glsp-server';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters, InitializeResult } from '../types';
import { ConnectionProvider, JsonrpcGLSPClient } from './glsp-jsonrpc-client';

export class BaseJsonrpcGLSPClient implements GLSPClient {
    readonly id: string;
    protected readonly connectionProvider: ConnectionProvider;
    protected connectionPromise?: Promise<MessageConnection>;
    protected resolvedConnection?: MessageConnection;
    protected state: ClientState;
    protected onStop?: Promise<void>;
    protected _initializeResult: InitializeResult | undefined;

    protected onServerInitializedEmitter = new Emitter<InitializeResult>();
    get onServerInitialized(): Event<InitializeResult> {
        return this.onServerInitializedEmitter.event;
    }

    protected onActionMessageNotificationEmitter = new Emitter<ActionMessage>();
    protected get onActionMessageNotification(): Event<ActionMessage> {
        return this.onActionMessageNotificationEmitter.event;
    }

    constructor(options: JsonrpcGLSPClient.Options) {
        Object.assign(this, options);
        this.state = ClientState.Initial;
    }

    shutdownServer(): void {
        this.checkedConnection.sendNotification(JsonrpcGLSPClient.ShutdownNotification);
    }

    async initializeServer(params: InitializeParameters): Promise<InitializeResult> {
        if (!this._initializeResult) {
            this._initializeResult = await this.checkedConnection.sendRequest(JsonrpcGLSPClient.InitializeRequest, params);
            this.onServerInitializedEmitter.fire(this._initializeResult);
        }
        return this._initializeResult;
    }

    get initializeResult(): InitializeResult | undefined {
        return this._initializeResult;
    }

    initializeClientSession(params: InitializeClientSessionParameters): Promise<void> {
        return this.checkedConnection.sendRequest(JsonrpcGLSPClient.InitializeClientSessionRequest, params);
    }

    disposeClientSession(params: DisposeClientSessionParameters): Promise<void> {
        return this.checkedConnection.sendRequest(JsonrpcGLSPClient.DisposeClientSessionRequest, params);
    }

    onActionMessage(handler: ActionMessageHandler, clientId?: string): Disposable {
        return this.onActionMessageNotification(msg => {
            if (!clientId || msg.clientId === clientId) {
                handler(msg);
            }
        });
    }

    sendActionMessage(message: ActionMessage): void {
        this.checkedConnection.sendNotification(JsonrpcGLSPClient.ActionMessageNotification, message);
    }

    protected get checkedConnection(): MessageConnection {
        if (!this.isConnectionActive()) {
            throw new Error(JsonrpcGLSPClient.ClientNotReadyMsg);
        }
        return this.resolvedConnection!;
    }

    async start(): Promise<void> {
        if (this.state === ClientState.Running) {
            return;
        }
        try {
            this.state = ClientState.Starting;
            const connection = await this.resolveConnection();
            connection.listen();
            this.resolvedConnection = connection;
            this.state = ClientState.Running;
        } catch (error) {
            JsonrpcGLSPClient.error('Failed to start connection to server', error);
            this.state = ClientState.StartFailed;
        }
    }

    stop(): Promise<void> {
        if (!this.connectionPromise) {
            this.state = ClientState.Stopped;
            return Promise.resolve();
        }
        if (this.state === ClientState.Stopping && this.onStop) {
            return this.onStop;
        }
        this.state = ClientState.Stopping;
        return (this.onStop = this.resolveConnection().then(connection => {
            connection.dispose();
            this.state = ClientState.Stopped;
            this.onStop = undefined;
            this.onActionMessageNotificationEmitter.dispose();
            this.connectionPromise = undefined;
            this.resolvedConnection = undefined;
        }));
    }

    protected resolveConnection(): Promise<MessageConnection> {
        if (!this.connectionPromise) {
            this.connectionPromise = this.doCreateConnection();
        }
        return this.connectionPromise;
    }

    protected async doCreateConnection(): Promise<MessageConnection> {
        const connection = typeof this.connectionProvider === 'function' ? await this.connectionProvider() : this.connectionProvider;
        connection.onError(data => this.handleConnectionError(data[0], data[1], data[2]));
        connection.onClose(() => this.handleConnectionClosed());
        connection.onNotification(JsonrpcGLSPClient.ActionMessageNotification, msg => this.onActionMessageNotificationEmitter.fire(msg));
        return connection;
    }

    protected handleConnectionError(error: Error, message: Message | undefined, count: number | undefined): void {
        JsonrpcGLSPClient.error('Connection to server is erroring. Shutting down server.', error);
        this.stop();
        this.state = ClientState.ServerError;
    }

    protected handleConnectionClosed(): void {
        if (this.state === ClientState.Stopping || this.state === ClientState.Stopped) {
            return;
        }
        try {
            if (this.resolvedConnection) {
                this.resolvedConnection.dispose();
                this.connectionPromise = undefined;
                this.resolvedConnection = undefined;
            }
        } catch (error) {
            // Disposing a connection could fail if error cases.
        }

        JsonrpcGLSPClient.error('Connection to server got closed. Server will not be restarted.');
        this.state = ClientState.ServerError;
    }

    isConnectionActive(): boolean {
        return this.state === ClientState.Running && !!this.resolvedConnection;
    }

    get currentState(): ClientState {
        return this.state;
    }
}

/**
 * Default {@link GLSPClientProxy} implementation for jsonrpc-based client-server communication with typescript based servers.
 */
@injectable()
export class JsonrpcClientProxy implements GLSPClientProxy {
    protected clientConnection?: MessageConnection;
    protected enableLogging: boolean;

    initialize(clientConnection: MessageConnection, enableLogging = false): void {
        this.clientConnection = clientConnection;
        this.enableLogging = enableLogging;
    }

    process(message: ActionMessage): void {
        if (this.enableLogging) {
            console.log(`Send action '${message.action.kind}' to client '${message.clientId}'`);
        }
        this.clientConnection?.sendNotification(JsonrpcGLSPClient.ActionMessageNotification, message);
    }
}
