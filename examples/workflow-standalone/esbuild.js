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
// @ts-check
const { spawn } = require('child_process');
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, 'app');
const serverDir = path.resolve(__dirname, 'server');

const args = process.argv.slice(2);
const isBrowser = args.includes('--browser');
const isWatch = args.includes('--watch'); // dev: rebuild + live-reload
const isServe = args.includes('--serve'); // start: serve the built bundle, no watch/live-reload
const isMcp = args.includes('--mcp');
const noOpen = args.includes('--no-open');

// full-page live reload: subscribe to esbuild's change stream (served on the dev port). Over file://
// there is no EventSource endpoint, so the guard turns this into a harmless no-op for production builds.
const liveReloadBanner = {
    js: ";(() => { if (typeof EventSource !== 'undefined') { new EventSource('/esbuild').addEventListener('change', () => location.reload()); } })();"
};

/**
 * Reports the build progress and surfaces errors/warnings in a format that
 * VS Code's `$esbuild-watch` problem matcher can pick up.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => {
            console.log(`${isWatch ? '[watch] ' : ''}build started`);
        });
        build.onEnd(result => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location) {
                    console.error(`    ${location.file}:${location.line}:${location.column}:`);
                }
            });
            console.log(`${isWatch ? '[watch] ' : ''}build finished`);
        });
    }
};

// replaces CopyWebpackPlugin: the browser entry loads the worker via the stable 'wf-glsp-server-webworker.js' name
function copyWebWorker() {
    const source = path.resolve(serverDir, 'wf-glsp-server-web.js');
    const target = path.resolve(appRoot, 'wf-glsp-server-webworker.js');
    fs.copyFileSync(source, target);
    if (fs.existsSync(source + '.map')) {
        fs.copyFileSync(source + '.map', target + '.map');
    }
}

// mirror webpack's DefinePlugin; only injected for the node/websocket entry
const nodeDefine = {
    GLSP_SERVER_HOST: JSON.stringify(process.env.GLSP_SERVER_HOST || 'localhost'),
    GLSP_SERVER_PORT: JSON.stringify(process.env.GLSP_SERVER_PORT || '8081'),
    GLSP_MCP_SERVER_PORT: JSON.stringify(process.env.GLSP_MCP_SERVER_PORT || '64577'),
    // Base directory the node server reads example files from; the selected example's file name is
    // appended at runtime (see node/app.ts) so a single build serves every manifest entry.
    GLSP_SOURCE_URI_BASE: JSON.stringify(appRoot)
};

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: [path.resolve(__dirname, 'src', isBrowser ? 'browser/app.ts' : 'node/app.ts')],
    outdir: appRoot,
    entryNames: 'bundle', // -> app/bundle.js + app/bundle.css
    assetNames: '[name]-[hash]', // -> app/codicon-<hash>.ttf, referenced relatively from bundle.css
    bundle: true,
    sourcemap: true,
    format: 'iife', // diagram.html loads bundle.js via a classic <script src>
    platform: 'browser',
    target: ['es2019'],
    logLevel: 'silent',
    loader: { '.ttf': 'file' },
    // no publicPath -> relative asset URLs, required for file:// (e2e) and gh-pages subfolders
    define: isBrowser ? {} : nodeDefine,
    external: ['fs', 'net'], // node builtins potentially pulled in by ws; browser platform shims the rest
    plugins: [esbuildProblemMatcherPlugin]
};

function openBrowser(url) {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(command, [url], { shell: process.platform === 'win32', stdio: 'ignore', detached: true }).unref();
}

async function build() {
    if (isBrowser) {
        copyWebWorker();
    }
    await esbuild.build(buildOptions);
}

// serve the app on the dev port; with `watch` it also rebuilds on change and injects the live-reload banner
async function serve({ watch }) {
    if (isBrowser) {
        copyWebWorker();
    }
    const ctx = await esbuild.context(watch ? { ...buildOptions, banner: liveReloadBanner } : buildOptions);
    if (watch) {
        await ctx.watch();
    }
    // finish a complete build before opening the dev port - otherwise the auto-opened browser can
    // connect mid-build and the build's completion fires a live-reload `change` (a spurious blink).
    await ctx.rebuild();
    const port = parseInt(process.env.CLIENT_PORT || (isBrowser ? '8083' : '8082'), 10);
    // servedir === outdir: freshly built output is overlaid on the static files in app/ (diagram.html, example1.wf, worker)
    const { port: servePort } = await ctx.serve({ servedir: appRoot, port });
    const url = `http://localhost:${servePort}/diagram.html${isMcp ? '?mcp' : ''}`;
    console.log(`Serving workflow-standalone at ${url}`);
    if (!noOpen) {
        openBrowser(url);
    }
}

const run = isWatch ? serve({ watch: true }) : isServe ? serve({ watch: false }) : build();
run.catch(error => {
    console.error(error);
    process.exit(1);
});
