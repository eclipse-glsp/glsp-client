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
import { execSync } from 'child_process';
import * as path from 'path';
import { downloadServerBundle, resolveVersion, SERVER_DIR_PATH } from './download-server';

const NODE_SERVER_STABLE = 'wf-glsp-server-node.js';

async function run(): Promise<void> {
    await downloadServerBundle({
        npmPackage: '@eclipse-glsp-examples/workflow-server-bundled',
        stableName: NODE_SERVER_STABLE,
        version: resolveVersion()
    });

    const serverFile = path.resolve(SERVER_DIR_PATH, NODE_SERVER_STABLE);
    const port = argValue('--port', '8081');
    const host = argValue('--host', 'localhost');
    execSync(`node ${serverFile} -w --port ${port} --host ${host}`, { stdio: 'inherit' });
}

function argValue(flag: string, defaultValue: string): string {
    const index = process.argv.indexOf(flag);
    return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : defaultValue;
}

run();
