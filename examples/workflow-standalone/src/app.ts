/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    ApplicationIdProvider,
    BaseJsonrpcGLSPClient,
    EnableToolPaletteAction,
    GLSPActionDispatcher,
    GLSPClient,
    GLSPModelSource,
    GLSPWebSocketProvider,
    RequestModelAction,
    RequestTypeHintsAction,
    ServerMessageAction,
    ServerStatusAction,
    SetUIExtensionVisibilityAction,
    StatusOverlay,
    configureServerActions
} from '@eclipse-glsp/client';
import { join, resolve } from 'path';
import { MessageConnection } from 'vscode-jsonrpc';
import createContainer from './di.config';
const port = 8081;
const id = 'workflow';
const diagramType = 'workflow-diagram';

const loc = window.location.pathname;
const currentDir = loc.substring(0, loc.lastIndexOf('/'));
const examplePath = resolve(join(currentDir, '../app/example1.wf'));
const clientId = ApplicationIdProvider.get() + '_' + examplePath;

const webSocketUrl = `ws://localhost:${port}/${id}`;

let container = createContainer();
let diagramServer = container.get(GLSPModelSource);

const wsProvider = new GLSPWebSocketProvider(webSocketUrl);
wsProvider.listen({ onConnection: initialize, onReconnect: reconnect, logger: console });

async function initialize(connectionProvider: MessageConnection, isReconnecting = false): Promise<void> {
    const actionDispatcher: GLSPActionDispatcher = container.get(GLSPActionDispatcher);

    await actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: StatusOverlay.ID, visible: true }));
    await actionDispatcher.dispatch(ServerStatusAction.create('Initializing...', { severity: 'INFO' }));
    const client = new BaseJsonrpcGLSPClient({ id, connectionProvider });

    await diagramServer.connect(client, clientId);
    const result = await client.initializeServer({
        applicationId: ApplicationIdProvider.get(),
        protocolVersion: GLSPClient.protocolVersion
    });
    actionDispatcher.dispatch(ServerStatusAction.create('', { severity: 'NONE' }));
    await configureServerActions(result, diagramType, container);

    await client.initializeClientSession({ clientSessionId: diagramServer.clientId, diagramType });

    actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: StatusOverlay.ID, visible: true }));
    actionDispatcher.dispatch(EnableToolPaletteAction.create());
    actionDispatcher.dispatch(
        RequestModelAction.create({
            options: {
                sourceUri: `file://${examplePath}`,
                diagramType,
                isReconnecting
            }
        })
    );
    actionDispatcher.dispatch(RequestTypeHintsAction.create());

    if (isReconnecting) {
        const message = `Connection to the ${id} glsp server got closed. Connection was successfully re-established.`;
        const timeout = 5000;
        const severity = 'WARNING';
        actionDispatcher.dispatchAll([
            ServerStatusAction.create(message, { severity, timeout }),
            ServerMessageAction.create(message, { severity })
        ]);
        return;
    }
}

async function reconnect(connectionProvider: MessageConnection): Promise<void> {
    container = createContainer();
    diagramServer = container.get(GLSPModelSource);
    diagramServer.clientId = clientId;

    initialize(connectionProvider, true /* isReconnecting */);
}
