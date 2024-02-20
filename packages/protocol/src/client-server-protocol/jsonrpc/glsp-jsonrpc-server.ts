/********************************************************************************
 * Copyright (c) 2023 STMicroelectronics and others.
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

import { MessageConnection } from 'vscode-jsonrpc';
import { GLSPServer } from '../glsp-server';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters } from '../types';
import { JsonrpcGLSPClient } from './glsp-jsonrpc-client';

/**
 * Configure the given client connection to forward the requests and notifications to the given {@link GLSPServer} instance.
 * @param clientConnection JSON-RPC client connection.
 * @param glspServer The GLSP Server which should react to requests & notifications.
 */
export function configureClientConnection(clientConnection: MessageConnection, glspServer: GLSPServer): void {
    clientConnection.onRequest(JsonrpcGLSPClient.InitializeRequest.method, (params: InitializeParameters) => glspServer.initialize(params));
    clientConnection.onRequest(JsonrpcGLSPClient.InitializeClientSessionRequest, (params: InitializeClientSessionParameters) =>
        glspServer.initializeClientSession(params)
    );
    clientConnection.onRequest(JsonrpcGLSPClient.DisposeClientSessionRequest, (params: DisposeClientSessionParameters) =>
        glspServer.disposeClientSession(params)
    );
    clientConnection.onNotification(JsonrpcGLSPClient.ActionMessageNotification, message => glspServer.process(message));

    clientConnection.listen();
}
