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

import { Args } from '../action-protocol/types';

/**
 * A key-value pair structure to map a diagramType to its server-handled action kinds.
 */
export interface ServerActions {
    [key: string]: string[];
}

export interface InitializeParameters {
    /**
     * Unique identifier for the current client application.
     */
    applicationId: string;

    /**
     * GLSP protocol version that this client is implementing.
     */
    protocolVersion: string;

    /**
     * Additional custom arguments e.g. application specific parameters.
     */
    args?: Args;
}

export interface InitializeResult {
    /**
     * GLSP protocol version that the server is implementing.
     */
    protocolVersion: string;

    /**
     * The actions (grouped by diagramType) that the server can handle.
     */
    serverActions: ServerActions;
}

/**
 * Known server actions i.e. action kinds that the server can handle for a specific diagram type.
 */
export interface InitializeClientSessionParameters {
    /**
     * Unique identifier for the new client session.
     */
    clientSessionId: string;

    /**
     * Unique identifier of the diagram type for which the session should be configured.
     */
    diagramType: string;

    /**
     * The set of action kinds that can be handled by the client.
     * Used by the server to know which dispatched actions should be forwarded to the client.
     */
    clientActionKinds: string[];

    /**
     * Additional custom arguments.
     */
    args?: Args;
}

export interface DisposeClientSessionParameters {
    /**
     * Unique identifier of the client session that should be disposed.
     */
    clientSessionId: string;

    /**
     * Additional custom arguments.
     */
    args?: Args;
}
