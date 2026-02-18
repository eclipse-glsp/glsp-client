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
import * as fs from 'fs';
import * as path from 'path';
import { extract } from 'tar';
import * as packageJson from '../../../package.json';

const SERVER_DIR_PATH = path.resolve(__dirname, '..', 'server');
const FILE_NAME = 'wf-glsp-server-node';

async function run() {
    const port = parsePortArg();
    const host = parseHostArg();
    const version = parseVersion();
    process.chdir(SERVER_DIR_PATH);

    const serverFile = await downloadIfNecessary(version);
    console.log();

    execSync(`node ${serverFile} -w --port ${port} --host ${host}`, { stdio: 'inherit' });
}

async function downloadIfNecessary(version: string): Promise<string> {
    console.log(`Check if server executable with version ${version} is present.`);

    const existingServer = fs.readdirSync(SERVER_DIR_PATH).find(file => file.startsWith(FILE_NAME));
    if (existingServer) {
        const existingVersion = existingServer.replace(FILE_NAME + '-', '').replace('.js', '');
        const latestVersion = execSync(`npm show @eclipse-glsp-examples/workflow-server-bundled@${version} version`, {
            encoding: 'utf-8'
        }).trim();
        if (existingVersion === latestVersion) {
            console.log('Server executable already present. Skip download"');
            return existingServer;
        }
    }

    console.log('Server executable with correct version not found.  Download from npm.');
    if (existingServer) {
        fs.rmSync(path.resolve(SERVER_DIR_PATH, existingServer));
        fs.rmSync(path.resolve(SERVER_DIR_PATH, existingServer.replace('.js', '.js.map')));
    }
    const packResultJson = execSync(`npm pack @eclipse-glsp-examples/workflow-server-bundled@${version} --json`, {
        encoding: 'utf-8'
    }).trim();
    const newVersion = JSON.parse(packResultJson)[0].version;
    const tarBall = fs.readdirSync(SERVER_DIR_PATH).find(file => file.endsWith('.tar.gz') || file.endsWith('.tgz'))!;
    console.log('Extract downloaded server tarball');
    await extract({
        file: tarBall,
        cwd: SERVER_DIR_PATH
    });

    const tempDir = path.resolve(SERVER_DIR_PATH, 'package');
    fs.copyFileSync(path.resolve(tempDir, 'wf-glsp-server-node.js'), path.resolve(SERVER_DIR_PATH, `${FILE_NAME}-${newVersion}.js`));
    fs.copyFileSync(
        path.resolve(tempDir, 'wf-glsp-server-node.js.map'),
        path.resolve(SERVER_DIR_PATH, `${FILE_NAME}-${newVersion}.js.map`)
    );

    console.log('Remove temporary files');
    fs.rmSync(tempDir, { force: true, recursive: true });
    fs.rmSync(path.resolve(SERVER_DIR_PATH, tarBall), { force: true });
    return `${FILE_NAME}-${newVersion}.js`;
}

function parsePortArg(): number {
    let port = 8081;
    const portIndex = process.argv.indexOf('--port');
    if (portIndex >= 0) {
        port = parseInt(process.argv[portIndex + 1]);
    }
    if (isNaN(port)) {
        console.error('Invalid port number');
        process.exit(1);
    }
    return port;
}

function parseHostArg(): string {
    let host = 'localhost';
    const hostIndex = process.argv.indexOf('--host');
    if (hostIndex >= 0) {
        host = process.argv[hostIndex + 1];
    }
    if (typeof host !== 'string') {
        console.error('Invalid host');
        process.exit(1);
    }
    return host;
}

function parseVersion(): string {
    const versionIndex = process.argv.indexOf('--version');
    if (versionIndex >= 0) {
        return process.argv[versionIndex + 1];
    }
    // If no version is specified, use the version of the current package
    return packageJson.version.endsWith('-next') ? 'next' : packageJson.version;
}

run();
