/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
import * as uuid from 'uuid';

import { ActionMessage } from '../action-protocol/base-protocol';
import { Disposable } from '../utils/disposable';
import { Event } from '../utils/event';
import { AnyObject, hasStringProp } from '../utils/type-util';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters, InitializeResult } from './types';

export class ApplicationIdProvider {
    private static _applicationId?: string;
    static get(): string {
        if (!ApplicationIdProvider._applicationId) {
            ApplicationIdProvider._applicationId = uuid.v4();
        }
        return ApplicationIdProvider._applicationId;
    }
}

export type ActionMessageHandler = (message: ActionMessage) => void;

export enum ClientState {
    /**
     * The client has been created.
     */
    Initial,
    /**
     * `Start` has been called on the client and the start process is still on-going.
     */
    Starting,
    /**
     * The client failed to complete the start process.
     */
    StartFailed,
    /**
     * The client was successfully started and is now running.
     */
    Running,
    /**
     * `Stop` has been called on the client and the stop process is still on-going.
     */
    Stopping,
    /**
     * The client stopped and disposed the server connection. Thus, action messages can no longer be sent.
     */
    Stopped,
    /**
     * An error was encountered while connecting to the server. No action messages can be sent.
     */
    ServerError
}

export interface GLSPClient {
    /**
     * Unique client Id.
     */
    readonly id: string;

    /**
     * Current client state.
     */
    readonly currentState: ClientState;
    /**
     * Event that is fired whenever the client state changes.
     */
    readonly onCurrentStateChanged: Event<ClientState>;

    /**
     * Initializes the client and the server connection. During the start procedure the client is in the
     * `Starting` state and will transition to either `Running` or `StartFailed`. Calling this method
     *  if the client is already running has no effect.
     *
     * @returns A promise that resolves if the startup was successful.
     */
    start(): Promise<void>;

    /**
     * Send an `initialize` request to the server. The server needs to be initialized in order to accept and
     * process other requests and notifications. The {@link InitializeResult} ist cached and can be retrieved
     * via the {@link GLSPClient.initializeResult} property.
     * Only the first method invocation actually sends a request to the server. Subsequent invocations simply
     * return the cached result.
     *
     * @param params Initialize parameters
     * @returns A promise of the {@link InitializeResult}.
     */
    initializeServer(params: InitializeParameters): Promise<InitializeResult>;

    /**
     * The cached {@link {InitializeResult}. Is `undefined` if the server has not been initialized yet via
     * the {@link GLSPClient.initializeServer} method.
     */
    readonly initializeResult: InitializeResult | undefined;

    /**
     * Event that is fired once the first invocation of {@link GLSPClient.initializeServer} has been completed.
     */
    readonly onServerInitialized: Event<InitializeResult>;

    /**
     * Send an `initializeClientSession` request to the server. One client application may open several session.
     * Each individual diagram on the client side counts as one session and has to provide
     * a unique clientId.
     *
     * @param params InitializeClientSession parameters
     * @returns A promise that resolves if the initialization was successful
     */
    initializeClientSession(params: InitializeClientSessionParameters): Promise<void>;

    /**
     * Sends a `disposeClientSession` request to the server. This request has to be sent at the end of client session lifecycle
     * e.g. when an editor widget is closed.
     *
     * @param params DisposeClientSession parameters
     * @returns A promise that resolves if the disposal was successful
     */
    disposeClientSession(params: DisposeClientSessionParameters): Promise<void>;

    /**
     * Send a `shutdown` notification to the server.
     */
    shutdownServer(): void;

    /**
     * Stops the client and disposes unknown resources. During the stop procedure the client is in the `Stopping` state and will
     * transition to either `Stopped` or `ServerError`.
     * Calling the method if client is already stopped has no effect.
     *
     * @returns A promise that resolves after the server was stopped and disposed.
     */
    stop(): Promise<void>;

    /**
     * Send an action message to the server.
     *
     * @param message The message
     */
    sendActionMessage(message: ActionMessage): void;

    /**
     * Sets a handler/listener for action messages received from the server.
     * Can be scoped to a particular client session by passing the corresponding `clientId`.
     *
     * @param handler The action message handler
     * @param clientId If passed given action message handler will only be invoked for action messages with this client id.
     * @returns A {@link Disposable} that can be used to unregister the handler
     */
    onActionMessage(handler: ActionMessageHandler, clientId?: string): Disposable;
}
export namespace GLSPClient {
    export interface Options {
        id: string;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    export function isOptions(object: unknown): object is Options {
        return AnyObject.is(object) && hasStringProp(object, 'id');
    }

    export const protocolVersion = '1.0.0';
}
