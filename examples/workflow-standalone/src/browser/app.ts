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

import { BaseJsonrpcGLSPClient, DiagramLoader, GLSPClient, GLSPWebWorkerProvider } from '@eclipse-glsp/client';
import { Container } from 'inversify';
import { MessageConnection } from 'vscode-jsonrpc';
import createContainer from '../common/di.config';

const id = 'workflow';
const diagramType = 'workflow-diagram';
const clientId = 'sprotty';

let glspClient: GLSPClient;
let container: Container;

document.title = 'GLSP Workflow Example';
const workerProvider = new GLSPWebWorkerProvider('wf-glsp-server-webworker.js');
workerProvider.listen({ onConnection: initialize, logger: console });

async function initialize(connectionProvider: MessageConnection): Promise<void> {
    glspClient = new BaseJsonrpcGLSPClient({ id, connectionProvider });
    container = createContainer({
        clientId,
        diagramType,
        glspClientProvider: async () => glspClient,
        sourceUri: 'example1.wf'
    });
    const diagramLoader = container.get(DiagramLoader);
    await diagramLoader.load();
}
