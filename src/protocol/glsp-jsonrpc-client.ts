/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { ActionMessage } from "sprotty";
import { Message, MessageConnection, NotificationType, RequestType } from "vscode-jsonrpc";
import { NotificationType0 } from "vscode-ws-jsonrpc";

import { ActionMessageHandler, ClientState, GLSPClient, InitializeParameters } from "./glsp-client";

export type MaybePromise<T> = T | Promise<T> | PromiseLike<T>;
export type ConnectionProvider = MessageConnection | (() => MaybePromise<MessageConnection>);

export namespace JsonrpcGLSPClient {
    export interface Options extends GLSPClient.Options {
        connectionProvider: ConnectionProvider;
    }

    export function isOptions(object: any): object is Options {
        return GLSPClient.isOptions(object) && "connectionProvider" in object;
    }

    export const ActionMessageNotification = new NotificationType<ActionMessage, void>('process');
    export const InitializeRequest = new RequestType<InitializeParameters, Boolean, void, void>('initialize');
    export const ShutdownNotification = new NotificationType0<void>('shutdown');
    export const ClientNotReadyMsg = 'JsonrpcGLSPClient is not ready yet';
}
export class BaseJsonrpcGLSPClient implements GLSPClient {

    readonly name: string;
    readonly id: string;
    protected readonly connectionProvider: ConnectionProvider;
    protected connectionPromise?: Promise<MessageConnection>;
    protected resolvedConnection?: MessageConnection;
    protected state: ClientState;
    protected onStop?: Promise<void>;

    constructor(options: JsonrpcGLSPClient.Options) {
        Object.assign(this, options);
        this.state = ClientState.Initial;
    }

    shutdownServer(): void {
        if (this.checkConnectionState()) {
            this.resolvedConnection!.sendNotification(JsonrpcGLSPClient.ShutdownNotification);
        }
    }

    initializeServer(params: InitializeParameters): Promise<Boolean> {
        if (this.checkConnectionState()) {
            return this.resolvedConnection!.sendRequest(JsonrpcGLSPClient.InitializeRequest, params);
        }
        return Promise.resolve(false);
    }

    onActionMessage(handler: ActionMessageHandler): void {
        if (this.checkConnectionState()) {
            this.resolvedConnection!.onNotification(JsonrpcGLSPClient.ActionMessageNotification, handler);
        }
    }

    sendActionMessage(message: ActionMessage): void {
        if (this.checkConnectionState()) {
            this.resolvedConnection!.sendNotification(JsonrpcGLSPClient.ActionMessageNotification, message);
        }
    }

    protected checkConnectionState(): boolean {
        if (!this.isConnectionActive()) {
            throw new Error(JsonrpcGLSPClient.ClientNotReadyMsg);
        }
        return true;
    }

    async start(): Promise<void> {
        try {
            this.state = ClientState.Starting;
            const connection = await this.resolveConnection();
            connection.listen();
            this.resolvedConnection = connection;
            this.state = ClientState.Running;
        } catch (error) {
            this.error('Failed to start connection to server', error);
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
        return this.onStop = this.resolveConnection().then(connection => {
            connection.dispose();
            this.state = ClientState.Stopped;
            this.onStop = undefined;
            this.connectionPromise = undefined;
            this.resolvedConnection = undefined;
        });
    }

    private resolveConnection(): Promise<MessageConnection> {
        if (!this.connectionPromise) {
            this.connectionPromise = this.doCreateConnection();
        }
        return this.connectionPromise;
    }

    protected async doCreateConnection(): Promise<MessageConnection> {
        const connection = typeof this.connectionProvider === 'function' ? await this.connectionProvider() : this.connectionProvider;
        connection.onError((data: [Error, Message, number]) => this.handleConnectionError(data[0], data[1], data[2]));
        connection.onClose(() => this.handleConnectionClosed());
        return connection;
    }

    protected handleConnectionError(error: Error, message: Message, count: number): void {
        this.error('Connection to server is erroring. Shutting down server.', error);
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

        this.error('Connection to server got closed. Server will not be restarted.');
        this.state = ClientState.ServerError;
    }

    protected error(message: string, ...optionalParams: any[]): void {
        console.error(`[JsonrpcGLSPClient] ${message}`, optionalParams);
    }

    protected isConnectionActive(): boolean {
        return this.state === ClientState.Running && !!this.resolvedConnection;
    }

    currentState(): ClientState {
        return this.state;
    }
}
