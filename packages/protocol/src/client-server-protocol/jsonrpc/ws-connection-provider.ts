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
    protected reconnectTimer: NodeJS.Timeout;
    protected reconnectAttempts = 0;

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
            clearInterval(this.reconnectTimer);
            this.webSocket.close();
        };

        return new Promise(resolve => {
            this.webSocket.onopen = (): void => {
                clearInterval(this.reconnectTimer);
                const wrappedSocket = wrap(this.webSocket);
                const wsConnection = createWebSocketConnection(wrappedSocket, handler.logger);

                this.webSocket.onclose = (): void => {
                    const { reconnecting, reconnectAttempts, reconnectDelay } = this.options;
                    if (reconnecting) {
                        if (this.reconnectAttempts >= reconnectAttempts!) {
                            handler.logger?.error(
                                'GLSPWebSocketProvider WebSocket reconnect failed - maximum number reconnect attempts ' +
                                    `(${reconnectAttempts}) was exceeded!`
                            );
                        } else {
                            this.reconnectTimer = setInterval(() => {
                                handler.logger?.warn('GLSPWebSocketProvider reconnecting...');
                                this.listen(handler, true);
                                this.reconnectAttempts++;
                            }, reconnectDelay!);
                        }
                    } else {
                        handler.logger?.error('GLSPWebSocketProvider WebSocket will not reconnect - closing the connection now!');
                    }
                };

                if (isReconnecting) {
                    handler.logger?.warn('GLSPWebSocketProvider Reconnecting!');
                    handler.onReconnect?.(wsConnection);
                } else {
                    handler.logger?.warn('GLSPWebSocketProvider Initializing!');
                    handler.onConnection?.(wsConnection);
                }
                resolve(wsConnection);
            };
        });
    }
}
