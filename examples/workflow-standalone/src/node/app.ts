/********************************************************************************
 * Copyright (c) 2019-2026 EclipseSource and others.
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
import 'reflect-metadata';

import {
    BaseJsonrpcGLSPClient,
    DiagramLoader,
    GLSPActionDispatcher,
    GLSPClient,
    GLSPWebSocketProvider,
    McpInitializeParameters,
    McpInitializeResult,
    MessageAction,
    ShowToastMessageAction,
    StatusAction
} from '@eclipse-glsp/client';
import { Container } from 'inversify';
import { MessageConnection } from 'vscode-jsonrpc';
import createContainer from '../common/di.config';
import { ExampleEntry } from '../common/examples-manifest';
import { AppShell } from '../common/features/app-shell/app-shell';
import { ExampleLoadContext, ExampleSwitcher } from '../common/features/app-shell/example-switcher';
import { hasParameter } from '../common/url-parameters';

const host = GLSP_SERVER_HOST;
const port = GLSP_SERVER_PORT;
// Single websocket endpoint that hosts both languages; the diagramType selects the language per session.
const id = 'workflow';
const clientId = 'sprotty';
const webSocketUrl = `ws://${host}:${port}/${id}`;
const mcpEnabled = hasParameter('mcp');

let glspClient: GLSPClient;

const appShell = new AppShell();
const switcher = new ExampleSwitcher(appShell, loadExample);

const wsProvider = new GLSPWebSocketProvider(webSocketUrl);
wsProvider.listen({ onConnection: initialize, onReconnect: reconnect, logger: console });

async function initialize(connectionProvider: MessageConnection, isReconnecting = false): Promise<void> {
    glspClient = new BaseJsonrpcGLSPClient({ id, connectionProvider });
    await switcher.reload({ isReconnecting });

    if (isReconnecting) {
        const message = `Connection to the ${id} glsp server got closed. Connection was successfully re-established.`;
        const dispatcher = switcher.currentContainer?.get(GLSPActionDispatcher);
        dispatcher?.dispatchAll([
            StatusAction.create(message, { severity: 'WARNING', timeout: 5000 }),
            MessageAction.create(message, { severity: 'WARNING' })
        ]);
    }
}

/**
 * Creates and loads a diagram container for the example, reusing the shared GLSP connection. The
 * `sourceUri` is an absolute file path the node server reads from disk.
 */
async function loadExample(entry: ExampleEntry, context: ExampleLoadContext): Promise<Container> {
    const isReconnecting = context.isReconnecting ?? false;
    const sourceUri = `${GLSP_SOURCE_URI_BASE}/${entry.file}`;
    const container = createContainer({ clientId, diagramType: entry.diagramType, glspClientProvider: async () => glspClient, sourceUri });
    const diagramLoader = container.get(DiagramLoader);

    if (mcpEnabled) {
        await diagramLoader.load<McpInitializeParameters>({
            requestModelOptions: { isReconnecting },
            initializeParameters: { mcpServer: { name: 'glsp-workflow', port: Number(GLSP_MCP_SERVER_PORT) } }
        });
        const mcpServer = McpInitializeResult.getServer(glspClient.initializeResult);
        if (mcpServer && !isReconnecting) {
            const message = `MCP server '${mcpServer.name}' available at ${mcpServer.url}`;
            console.info(`[GLSP-MCP] ${message}`);
            container.get(GLSPActionDispatcher).dispatch(ShowToastMessageAction.createWithTimeout({ message, timeout: 10_000 }));
        }
    } else {
        await diagramLoader.load({ requestModelOptions: { isReconnecting } });
    }
    return container;
}

async function reconnect(connectionProvider: MessageConnection): Promise<void> {
    glspClient.stop();
    initialize(connectionProvider, true /* isReconnecting */);
}
