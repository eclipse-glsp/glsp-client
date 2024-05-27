/********************************************************************************
 * Copyright (c) 2022-2024 STMicroelectronics and others.
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

import { ActionMessage } from '../action-protocol/base-protocol';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters, InitializeResult } from './types';

/**
 * Interface for implementations of a ts server component.
 * Based on the specification of the Graphical Language Server Protocol:
 * https://www.eclipse.org/glsp/documentation/protocol/
 */
export interface GLSPServer {
    /**
     *
     * The `initialize` request has to be the first request from the client to the server. Until the server has responded
     * with an {@link InitializeResult} no other request or notification can be handled and is expected to throw an
     * error. A client is uniquely identified by an `applicationId` and has to specify on which `protocolVersion` it is
     * based on. In addition, custom arguments can be provided in the `args` map to allow for custom initialization
     * behavior on the server.
     *
     * After successfully initialization all {@link GLSPServerListener}s are notified via the
     * {@link GLSPServerListener.serverInitialized} method.
     *
     * @param params the {@link InitializeParameters}.
     * @returns A promise of the {@link InitializeResult} .
     *
     * @throws {@link Error} Subsequent initialize requests return the {@link InitializeResult} of the initial request
     * if the given application id and protocol version are matching, otherwise the promise rejects with an error.
     *
     */
    initialize(params: InitializeParameters): Promise<InitializeResult>;

    /**
     * The `initializeClientSession` request is sent to the server whenever a new graphical representation (diagram) is
     * created. Each individual diagram on the client side counts as one session and has to provide a unique
     * `clientSessionId` and its `diagramType`. In addition, custom arguments can be provided in the `args` map to allow
     * for custom initialization behavior on the server. Subsequent `initializeClientSession` requests for the same
     * client id and diagram type are expected to resolve successfully but don't have an actual effect because the
     * corresponding client session is  already initialized.
     *
     * @param params the {@link InitializeClientSessionParameters}.
     * @returns A promise that completes when the initialization was successful.
     */
    initializeClientSession(params: InitializeClientSessionParameters): Promise<void>;

    /**
     * The 'DisposeClientSession' request is sent to the server when a graphical representation (diagram) is no longer
     * needed, e.g. the tab containing the diagram widget has been closed. The session is identified by its unique
     * `clientSessionId`. In addition, custom arguments can be provided in the `args` map to allow for custom dispose
     * behavior on the server.
     *
     * @param params the {@link DisposeClientSessionParameters}.
     * @returns A `void` promise that completes if the disposal was successful.
     *
     */
    disposeClientSession(params: DisposeClientSessionParameters): Promise<void>;

    /**
     * A `process` notification is sent from the client to server when the server should handle i.e. process a specific
     * {@link ActionMessage}. Any communication that is performed between initialization and shutdown is handled by
     * sending action messages, either from the client to the server or from the server to the client. This is the core
     * part of the Graphical Language Server Protocol.
     *
     * @param message The {@link ActionMessage} that should be processed.
     */
    process(message: ActionMessage): void;

    /**
     * The `shutdown` notification is sent from the client to the server if the client disconnects from the server (e.g.
     * the client application has been closed).
     * This gives the server a chance to clean up and dispose unknown resources dedicated to the client and its sessions.
     * All {@link GLSPServerListener}s are notified via the {@link GLSPServerListener.serverShutDown} method.
     * Afterwards the server instance is considered to be disposed and can no longer be used for handling requests.
     *
     */
    shutdown(): void;

    /**
     * Register a new {@link GLSPServerListener}.
     *
     * @param listener The listener that should be registered.
     * @returns `true` if the listener was registered successfully, `false` otherwise (e.g. listener is already
     *         registered).
     */
    addListener(listener: GLSPServerListener): boolean;

    /**
     * Unregister a {@link GLSPServerListener}.
     *
     * @param listener The listener that should be removed
     * @returns 'true' if the listener was unregistered successfully, `false` otherwise (e.g. listener is was not
     *         registered in the first place).
     */
    removeListener(listener: GLSPServerListener): boolean;
}

export const GLSPServer = Symbol('GLSPServer');

/**
 * A listener to track the connection status of {@link GLSPClient}s (i.e. client applications).
 * Gets notified when a new GLSP client connects or disconnects.
 */
export interface GLSPServerListener {
    /**
     * Triggered after a GLSPServer has been initialized via the {@link GLSPServer.initialize()}
     * method.
     *
     * @param server The GLSPServer which has been initialized.
     */
    serverInitialized?(server: GLSPServer): void;

    /**
     * Triggered after the {@link GLSPServer.shutdown()} method has been invoked.
     *
     * @param glspServer The glspServer which has been shut down.
     */
    serverShutDown?(server: GLSPServer): void;
}
export const GLSPServerListener = Symbol('GLSPServerListener');

/**
 * Communication proxy interface used by the GLSP servers to send action messages to clients.
 * The default `JsonrpcClientProxy` used an underlying jsonrpc message connection for sending the action messages.
 */
export interface GLSPClientProxy {
    /**
     * A `process` notification is sent from the server to server to the client when the client should handle i.e.
     * process a specific {@link ActionMessage}. Any communication that is performed between initialization and shutdown
     * is handled by sending action messages, either from the client to the server or from the server to the client. This
     * is the core part of the Graphical Language Server Protocol.
     *
     * @param message The {@link ActionMessage} that should be processed.
     */
    process(message: ActionMessage): void;
}
export const GLSPClientProxy = Symbol('GLSPClientProxy');
