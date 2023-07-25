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
import * as fs from 'fs';
import * as path from 'path';
import * as sh from 'shelljs';
import { extract } from 'tar';
import * as config from './config.json';
const serverDirPath = path.resolve(__dirname, '..', 'server');

async function run() {
    const serverFile = await downloadIfNecessary();
    console.log();
    sh.cd(serverDirPath);
    sh.exec(`node ${serverFile} -w -p 8081`);
}

async function downloadIfNecessary(): Promise<string> {
    console.log(`Check if server executable with version ${config.version} is present.`);

    const existingServer = fs.readdirSync(serverDirPath).find(file => file.startsWith(config.fileName));
    if (existingServer) {
        const existingVersion = existingServer.replace(config.fileName + '-', '').replace('.js', '');
        const latestVersion = sh
            .exec(`npm show @eclipse-glsp-examples/workflow-server-bundled@${config.version} version`, { silent: true })
            .stdout.trim();
        if (existingVersion === latestVersion) {
            console.log('Server executable already present. Skip download"');
            return existingServer;
        }
    }

    console.log('Server executable with correct version not found.  Download from npm.');
    if (existingServer) {
        fs.rmSync(existingServer);
    }
    sh.cd(serverDirPath);
    const packResultJson = sh
        .exec(`npm pack @eclipse-glsp-examples/workflow-server-bundled@${config.version} --json`, { silent: true })
        .stdout.trim();
    const version = JSON.parse(packResultJson)[0].version;
    const tarBall = fs.readdirSync(serverDirPath).find(file => file.endsWith('.tgz' || '.tar.gz'))!;
    console.log('Extract downloaded server tarball');
    await extract({
        file: tarBall,
        cwd: serverDirPath
    });

    const tempDir = path.resolve(serverDirPath, 'package');
    fs.copyFileSync(path.resolve(tempDir, 'wf-glsp-server-node.js'), path.resolve(serverDirPath, `${config.fileName}-${version}.js`));
    fs.copyFileSync(
        path.resolve(tempDir, 'wf-glsp-server-node.js.map'),
        path.resolve(serverDirPath, `${config.fileName}-${version}.js.map`)
    );

    console.log('Remove temporary files');
    fs.rmSync(tempDir, { force: true, recursive: true });
    fs.rmSync(path.resolve(serverDirPath, tarBall), { force: true });
    return `${config.fileName}-${version}.js`;
}

run();
