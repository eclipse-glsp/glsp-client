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
import * as fs from 'fs';
import * as path from 'path';
import { downloadServerBundle, resolveVersion, SERVER_DIR_PATH } from './download-server';

const isBrowser = process.argv.includes('--browser');
const isDev = process.argv.includes('--dev');
const isMcp = process.argv.includes('--mcp');
const noOpen = process.argv.includes('--no-open');

const externalServerIndex = process.argv.indexOf('--external-server');
const hasExternalServer = externalServerIndex >= 0;
const externalServerArg =
    hasExternalServer && externalServerIndex + 1 < process.argv.length && !process.argv[externalServerIndex + 1].startsWith('--')
        ? process.argv[externalServerIndex + 1]
        : undefined;

function argValue(flag: string, defaultValue: string): string {
    const index = process.argv.indexOf(flag);
    return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : defaultValue;
}

async function run(): Promise<void> {
    if (hasExternalServer && externalServerArg) {
        const bundlePath = path.resolve(externalServerArg);
        if (!fs.existsSync(bundlePath)) {
            console.error(`Error: Server bundle not found: ${bundlePath}`);
            process.exit(1);
        }
        const stableName = isBrowser ? 'wf-glsp-server-web.js' : 'wf-glsp-server-node.js';
        const targetPath = path.resolve(SERVER_DIR_PATH, stableName);
        fs.mkdirSync(SERVER_DIR_PATH, { recursive: true });
        fs.copyFileSync(bundlePath, targetPath);
        const sourceMapPath = bundlePath + '.map';
        if (fs.existsSync(sourceMapPath)) {
            fs.copyFileSync(sourceMapPath, targetPath + '.map');
        }
        const versionFile = targetPath + '.version';
        fs.rmSync(versionFile, { force: true });
        console.log(`Using external server bundle: ${bundlePath}`);
    } else if (hasExternalServer && isBrowser) {
        console.error('Error: --external-server requires a path to the server bundle in browser mode.');
        process.exit(1);
    }

    if (!hasExternalServer) {
        const bundle = isBrowser
            ? { npmPackage: '@eclipse-glsp-examples/workflow-server-bundled-web', stableName: 'wf-glsp-server-web.js' }
            : { npmPackage: '@eclipse-glsp-examples/workflow-server-bundled', stableName: 'wf-glsp-server-node.js' };
        await downloadServerBundle({ ...bundle, version: resolveVersion() });
    }

    const webpackCmd = `webpack serve${isBrowser ? ' --env mode=browser' : ''}${isMcp ? ' --env mcp' : ''}${noOpen ? ' --no-open' : ''}`;
    const commands: { command: string; name: string }[] = [];
    const prefixColors: string[] = [];

    if (isDev) {
        commands.push({ command: 'tsc -b -w', name: 'tsc' });
        prefixColors.push('blue');
    }

    const clientPort = argValue('--client-port', isBrowser ? '8083' : '8082');
    process.env.CLIENT_PORT = clientPort;

    if (!isBrowser && !(hasExternalServer && !externalServerArg)) {
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
