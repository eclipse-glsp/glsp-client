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
import { ExampleEntry } from '../common/examples-manifest';
import { AppShell } from '../common/features/app-shell/app-shell';
import { ExampleSwitcher } from '../common/features/app-shell/example-switcher';

// One web worker server hosts both languages; the diagramType selects the language per session.
const id = 'workflow';
const clientId = 'sprotty';

let glspClient: GLSPClient;

const appShell = new AppShell();
const switcher = new ExampleSwitcher(appShell, loadExample);

const workerProvider = new GLSPWebWorkerProvider('wf-glsp-server-webworker.js');
workerProvider.listen({ onConnection: initialize, logger: console });

async function initialize(connectionProvider: MessageConnection): Promise<void> {
    glspClient = new BaseJsonrpcGLSPClient({ id, connectionProvider });
    await switcher.reload();
}

/** Creates and loads a diagram container for the example, reusing the shared worker connection. */
async function loadExample(entry: ExampleEntry): Promise<Container> {
    // Absolute URL so the worker can fetch the file verbatim; it has no notion of the page origin.
    const sourceUri = new URL(entry.file, document.baseURI).href;
    const container = createContainer({ clientId, diagramType: entry.diagramType, glspClientProvider: async () => glspClient, sourceUri });
    await container.get(DiagramLoader).load();
    return container;
}
