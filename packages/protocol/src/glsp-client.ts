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
import * as uuid from "uuid";

export interface InitializeParameters<> {
    /**
    * Unique identifier for the current client application
    */
    applicationId: string;
    options?: any
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
    Initial,
    Starting,
    StartFailed,
    Running,
    Stopping,
    Stopped,
    ServerError
}

export interface GLSPClient {
    readonly id: string;
    readonly name: string;
    currentState(): ClientState;
    /**
     *  Initialize the client and the server connection.
     *
     */
    start(): Promise<void>;
    /**
     * Send an initalize request to ther server. The server needs to be initialized
     * in order to accept and process action messages
     * @param params Initialize parameter
     * @returns true if the initialization was successfull
     */
    initializeServer(params: InitializeParameters): Promise<Boolean>;
    /**
     * Send a shutdown notification to the server
     */
    shutdownServer(): void
    /**
     * Stop the client and cleanup/dispose resources
     */
    stop(): Promise<void>;
    /**
     * Set a handler/listener for action messages received from the server
     * @param handler The action message handler
     */
    onActionMessage(handler: ActionMessageHandler): void;
    /**
     * Send an action message to the server
     * @param message The message
     */
    sendActionMessage(message: ActionMessage): void;
}

export namespace GLSPClient {
    export interface Options {
        id: string;
        name: string;
    }

    export function isOptions(object: any): object is Options {
        return object !== undefined && "id" in object && typeof object["id"] === "string"
            && "name" in object && typeof object["name"] === "string";
    }
}
