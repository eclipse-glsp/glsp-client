/********************************************************************************
 * Copyright (c) 2019-2026 EclipseSource & others
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
const webpack = require('webpack');
const path = require('path');

const buildRoot = path.resolve(__dirname, 'lib');
const appRoot = path.resolve(__dirname, 'app');
var CircularDependencyPlugin = require('circular-dependency-plugin');

/**
 * @param {{ mode?: string }} env
 * @returns {import('webpack').Configuration}
 */
module.exports = (env = {}) => {
    const isBrowser = env.mode === 'browser';

    const plugins = [
        new CircularDependencyPlugin({
            exclude: /(node_modules|examples)\/./,
            failOnError: false
        })
    ];

    if (isBrowser) {
        const CopyWebpackPlugin = require('copy-webpack-plugin');
        const serverBundlePath = path.resolve(__dirname, 'server', 'wf-glsp-server-web.js');
        plugins.push(
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: serverBundlePath,
                        to: path.resolve(appRoot, 'wf-glsp-server-webworker.js')
                    },
                    {
                        from: serverBundlePath + '.map',
                        to: path.resolve(appRoot, 'wf-glsp-server-webworker.js.map')
                    }
                ]
            })
        );
    } else {
        plugins.push(
            new webpack.DefinePlugin({
                GLSP_SERVER_HOST: JSON.stringify(process.env.GLSP_SERVER_HOST || 'localhost'),
                GLSP_SERVER_PORT: JSON.stringify(process.env.GLSP_SERVER_PORT || '8081'),
                GLSP_SOURCE_URI: JSON.stringify(path.resolve(__dirname, 'app/example1.wf'))
            })
        );
    }

    const fallback = {
        fs: false,
        net: false
    };

    const devServerStatic = isBrowser ? [{ directory: appRoot }] : [{ directory: appRoot, watch: { ignored: '**/*.wf' } }];

    return {
        entry: [path.resolve(buildRoot, isBrowser ? 'browser/app' : 'node/app')],
        output: {
            filename: 'bundle.js',
            path: appRoot
        },
        mode: 'development',
        devtool: 'source-map',
        resolve: {
            fallback,
            extensions: ['.ts', '.tsx', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: ['ts-loader']
                },
                {
                    test: /\.js$/,
                    use: ['source-map-loader'],
                    enforce: 'pre'
                },
                {
                    test: /\.css$/,
                    exclude: /\.useable\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.(ttf)$/,
                    type: 'asset/resource'
                }
            ]
        },
        ignoreWarnings: [/Failed to parse source map/, /Can't resolve .* in '.*ws\/lib'/],
        plugins,
        devServer: {
            static: devServerStatic,
            compress: true,
            port: isBrowser ? 8083 : 8082,
            open: '/diagram.html'
        }
    };
};
