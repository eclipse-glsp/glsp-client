/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import concurrently from 'concurrently';
import * as path from 'path';
import { downloadServerBundle, resolveVersion, SERVER_DIR_PATH } from './download-server';

const isBrowser = process.argv.includes('--browser');
const isDev = process.argv.includes('--dev');
const isClientOnly = process.argv.includes('--client-only');
const noOpen = process.argv.includes('--no-open');

function argValue(flag: string, defaultValue: string): string {
    const index = process.argv.indexOf(flag);
    return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : defaultValue;
}

async function run(): Promise<void> {
    if (!isClientOnly) {
        const bundle = isBrowser
            ? { npmPackage: '@eclipse-glsp-examples/workflow-server-bundled-web', stableName: 'wf-glsp-server-web.js' }
            : { npmPackage: '@eclipse-glsp-examples/workflow-server-bundled', stableName: 'wf-glsp-server-node.js' };
        await downloadServerBundle({ ...bundle, version: resolveVersion() });
    }

    const webpackCmd = `webpack serve${isBrowser ? ' --env mode=browser' : ''}${noOpen ? ' --no-open' : ''}`;
    const commands: { command: string; name: string }[] = [];
    const prefixColors: string[] = [];

    if (isDev) {
        commands.push({ command: 'tsc -b -w', name: 'tsc' });
        prefixColors.push('blue');
    }

    if (!isBrowser && !isClientOnly) {
        const serverFile = path.resolve(SERVER_DIR_PATH, 'wf-glsp-server-node.js');
        const port = argValue('--port', '8081');
        const host = argValue('--host', 'localhost');
        commands.push({ command: `node ${serverFile} -w --port ${port} --host ${host}`, name: 'server' });
        prefixColors.push('green');
    }

    commands.push({ command: webpackCmd, name: 'web' });
    prefixColors.push('yellow');

    const { result, commands: running } = concurrently(commands, {
        prefix: 'name',
        prefixColors,
        killOthersOn: ['failure', 'success']
    });

    process.on('SIGINT', () => {
        running.forEach((cmd: any) => cmd.kill('SIGKILL'));
        process.exit(0);
    });

    result.then(
        () => process.exit(0),
        () => process.exit(1)
    );
}

run();
