/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { MessageConnection, NotificationType, NotificationType0, RequestType } from 'vscode-jsonrpc';
import { ActionMessage } from '../../action-protocol/base-protocol';
import { MaybePromise } from '../../utils/type-util';
import { GLSPClient } from '../glsp-client';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters, InitializeResult } from '../types';

export type ConnectionProvider = MessageConnection | (() => MaybePromise<MessageConnection>);

export namespace JsonrpcGLSPClient {
    export interface Options extends GLSPClient.Options {
        connectionProvider: ConnectionProvider;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    export function isOptions(object: unknown): object is Options {
        return GLSPClient.isOptions(object) && 'connectionProvider' in object;
    }

    export const ActionMessageNotification = new NotificationType<ActionMessage>('process');
    export const InitializeRequest = new RequestType<InitializeParameters, InitializeResult, void>('initialize');
    export const InitializeClientSessionRequest = new RequestType<InitializeClientSessionParameters, void, void>('initializeClientSession');
    export const DisposeClientSessionRequest = new RequestType<DisposeClientSessionParameters, void, void>('disposeClientSession');

    export const ShutdownNotification = new NotificationType0('shutdown');
    export const ClientNotReadyMsg = 'JsonrpcGLSPClient is not ready yet';

    export function error(message: string, ...optionalParams: unknown[]): void {
        console.error(`[JsonrpcGLSPClient] ${message}`, optionalParams);
    }
}
