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
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { extract } from 'tar';
import * as packageJson from '../../../package.json';

export const SERVER_DIR_PATH = path.resolve(__dirname, '..', 'server');

const BUNDLES = {
    node: { npmPackage: '@eclipse-glsp-examples/workflow-server-bundled', stableName: 'wf-glsp-server-node.js' },
    browser: { npmPackage: '@eclipse-glsp-examples/workflow-server-bundled-web', stableName: 'wf-glsp-server-web.js' }
};

export interface DownloadOptions {
    npmPackage: string;
    stableName: string;
    version: string;
}

export async function downloadServerBundle(options: DownloadOptions): Promise<void> {
    if (process.env.SKIP_DOWNLOAD === 'true') {
        console.log('SKIP_DOWNLOAD is set. Skipping server bundle download.');
        return;
    }

    const versionFile = path.resolve(SERVER_DIR_PATH, options.stableName + '.version');
    const latestVersion = execSync(`npm show ${options.npmPackage}@${options.version} version`, { encoding: 'utf-8' }).trim();
    console.log(`Check if ${options.stableName} with version ${options.version} (${latestVersion}) is present.`);

    if (fs.existsSync(versionFile) && fs.readFileSync(versionFile, 'utf-8').trim() === latestVersion) {
        console.log('Server bundle already present. Skip download.');
        return;
    }

    console.log('Server bundle with correct version not found. Download from npm.');
    const stablePath = path.resolve(SERVER_DIR_PATH, options.stableName);
    fs.rmSync(stablePath, { force: true });
    fs.rmSync(stablePath + '.map', { force: true });
    fs.rmSync(versionFile, { force: true });

    execSync(`npm pack ${options.npmPackage}@${options.version} --pack-destination ${SERVER_DIR_PATH}`, { encoding: 'utf-8' });
    const tarBall = fs.readdirSync(SERVER_DIR_PATH).find(file => file.endsWith('.tgz'))!;
    console.log('Extract downloaded server tarball');
    await extract({ file: path.resolve(SERVER_DIR_PATH, tarBall), cwd: SERVER_DIR_PATH });

    const tempDir = path.resolve(SERVER_DIR_PATH, 'package');
    const sourceFile = fs.readdirSync(tempDir).find(file => file.endsWith('.js') && !file.endsWith('.js.map'))!;
    fs.renameSync(path.resolve(tempDir, sourceFile), stablePath);
    const sourceMap = path.resolve(tempDir, sourceFile + '.map');
    if (fs.existsSync(sourceMap)) {
        fs.renameSync(sourceMap, stablePath + '.map');
    }

    fs.writeFileSync(versionFile, latestVersion);
    fs.rmSync(tempDir, { force: true, recursive: true });
    fs.rmSync(path.resolve(SERVER_DIR_PATH, tarBall), { force: true });
    console.log('Download complete.');
}

export function resolveVersion(): string {
    const versionIndex = process.argv.indexOf('--version');
    if (versionIndex >= 0) {
        return process.argv[versionIndex + 1];
    }
    return packageJson.version.endsWith('-next') ? 'next' : packageJson.version;
}

// Direct invocation (e.g. prebundle:browser script) — skip when imported as a module by start.ts
if (require.main === module) {
    const bundle = process.argv.includes('--browser') ? BUNDLES.browser : BUNDLES.node;
    downloadServerBundle({ ...bundle, version: resolveVersion() });
}
