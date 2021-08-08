/********************************************************************************
 * Copyright (c) 2020-2021 EclipseSource and others.
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
import { ActionMessage } from 'sprotty';
import * as uuid from 'uuid';

export interface InitializeParameters<> {
    /**
     * Unique identifier for the current client application.
     */
    applicationId: string;

    /**
     * Options that can include application-specific parameters.
     */
    options?: any;
}

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
    currentState(): ClientState;

    /**
     * Initializes the client and the server connection. During the start procedure the client is in the `Starting` state and will transition to either `Running` or `StartFailed`.
     */
    start(): Promise<void>;

    /**
     * Send an `initialize` request to the server. The server needs to be initialized in order to accept and process action messages.
     *
     * @param params Initialize parameter
     * @returns true if the initialization was successful
     */
    initializeServer(params: InitializeParameters): Promise<boolean>;

    /**
     * Send a `shutdown` notification to the server.
     */
    shutdownServer(): void;

    /**
     * Stops the client and disposes any resources. During the stop procedure the client is in the `Stopping` state and will transition to either `Stopped` or `ServerError`.
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
     *
     * @param handler The action message handler
     */
    onActionMessage(handler: ActionMessageHandler): void;
}

export namespace GLSPClient {
    export interface Options {
        id: string;
    }

    export function isOptions(object: any): object is Options {
        return object !== undefined && 'id' in object && typeof object['id'] === 'string';
    }
}
