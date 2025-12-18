/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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

import { InitializeParameters, InitializeResult } from './types';

export interface McpServerConfiguration {
    /**
     * The host on which the MCP server should be started.
     */
    host?: string;
    /**
     * The port on which the MCP server should be started. Use '0' or undefined for a random available port.
     */
    port?: number;
    /**
     * The route on which the MCP server should be started.
     */
    route?: string;
    /**
     * The name of the MCP server.
     */
    name?: string;
}

export interface McpInitializeParameters extends InitializeParameters {
    /**
     * MCP server configuration parameters.
     */
    mcpServer: McpServerConfiguration;
}

export function isMcpInitializeParameters(params?: InitializeParameters): params is McpInitializeParameters {
    return !!params && (params as McpInitializeParameters).mcpServer !== undefined;
}

export function getMcpServerConfig(params?: InitializeParameters): McpServerConfiguration | undefined {
    return isMcpInitializeParameters(params) ? params.mcpServer : undefined;
}

export interface McpServerResult {
    /**
     * The name of the MCP server.
     */
    name: string;

    /**
     * The URL at which the MCP server is accessible.
     */
    url: string;
}

export interface McpInitializeResult extends InitializeResult {
    /**
     * MCP server result information.
     */
    mcpServer: McpServerResult;
}

export function isMcpInitializeResult(result?: InitializeResult): result is McpInitializeResult {
    return !!result && (result as McpInitializeResult).mcpServer !== undefined;
}

export function getMcpServerResult(result?: InitializeResult): McpServerResult | undefined {
    return isMcpInitializeResult(result) ? result.mcpServer : undefined;
}
