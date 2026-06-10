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

import { Logger, MessageConnection } from 'vscode-jsonrpc';
import { MaybePromise } from '../../utils/type-util';
import { createWebSocketConnection, wrap } from './websocket-connection';

export interface GLSPWebSocketOptions {
    /**
     * Allow automatic reconnect of WebSocket connections
     * @default true
     */
    reconnecting?: boolean;
    /**
     * Max attempts of reconnects
     * @default Infinity
     */
    reconnectAttempts?: number;
    /**
     * The time delay in milliseconds between reconnect attempts
     * @default 1000
     */
    reconnectDelay?: number;
}

export const GLSPConnectionHandler = Symbol('GLSPConnectionHandler');
export interface GLSPConnectionHandler {
    onConnection?(connection: MessageConnection): MaybePromise<void>;
    onReconnect?(connection: MessageConnection): MaybePromise<void>;
    logger?: Logger;
}

export class GLSPWebSocketProvider {
    protected webSocket: WebSocket;
    protected reconnectTimer?: NodeJS.Timeout;
    protected reconnectAttempts = 0;
    /** Whether a connection was ever successfully established; controls `onConnection` vs `onReconnect`. */
    protected hasConnected = false;

    protected options: GLSPWebSocketOptions = {
        // default values
        reconnecting: true,
        reconnectAttempts: Infinity,
        reconnectDelay: 1000
    };

    constructor(
        protected url: string,
        options?: GLSPWebSocketOptions
    ) {
        this.options = Object.assign(this.options, options);
    }

    protected createWebSocket(url: string): WebSocket {
        return new WebSocket(url);
    }

    listen(handler: GLSPConnectionHandler, isReconnecting = false): Promise<MessageConnection> {
        this.webSocket = this.createWebSocket(this.url);

        this.webSocket.onerror = (): void => {
            handler.logger?.error('GLSPWebSocketProvider Connection to server errored. Please make sure that the server is running!');
            this.webSocket.close();
        };

        // reconnect on close. registered here - not only after `wrap` below - so a failed initial
        // connection (where `onopen` never fires, e.g. a server that is not up yet) is retried too.
        this.webSocket.onclose = (): void => this.scheduleReconnect(handler);

        return new Promise(resolve => {
            this.webSocket.onopen = (): void => {
                this.clearReconnect();
                this.reconnectAttempts = 0;
                const wrappedSocket = wrap(this.webSocket);
                const wsConnection = createWebSocketConnection(wrappedSocket, handler.logger);

                // `wrap` re-binds onclose to the message reader, so restore the reconnect handler to
                // keep retrying after a drop that follows a previously established connection.
                this.webSocket.onclose = (): void => this.scheduleReconnect(handler);

                if (isReconnecting) {
                    handler.logger?.warn('GLSPWebSocketProvider Reconnecting!');
                    handler.onReconnect?.(wsConnection);
                } else {
                    handler.logger?.warn('GLSPWebSocketProvider Initializing!');
                    handler.onConnection?.(wsConnection);
                }
                this.hasConnected = true;
                resolve(wsConnection);
            };
        });
    }

    protected scheduleReconnect(handler: GLSPConnectionHandler): void {
        const { reconnecting, reconnectAttempts, reconnectDelay } = this.options;
        if (!reconnecting) {
            handler.logger?.error('GLSPWebSocketProvider WebSocket will not reconnect - closing the connection now!');
            return;
        }
        if (this.reconnectAttempts >= reconnectAttempts!) {
            handler.logger?.error(
                `GLSPWebSocketProvider WebSocket reconnect failed - maximum number reconnect attempts (${reconnectAttempts}) was exceeded!`
            );
            return;
        }
        this.clearReconnect();
        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            handler.logger?.warn('GLSPWebSocketProvider reconnecting...');
            // once connected, retries are reconnects; before that they are still the initial connect
            this.listen(handler, this.hasConnected);
        }, reconnectDelay!);
    }

    protected clearReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }
}
