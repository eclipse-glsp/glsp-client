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

const isBrowser = process.argv.includes('--browser');

const commands = isBrowser
    ? [
          { command: 'tsc -b -w', name: 'tsc' },
          { command: 'webpack serve --env mode=browser', name: 'web' }
      ]
    : [
          { command: 'tsc -b -w', name: 'tsc' },
          { command: 'yarn ts-node ./scripts/start-example-server.ts', name: 'server' },
          { command: 'webpack serve', name: 'web' }
      ];

const prefixColors = isBrowser ? ['blue', 'yellow'] : ['blue', 'green', 'yellow'];

const { result, commands: running } = concurrently(commands, {
    prefix: 'name',
    prefixColors,
    killOthers: ['failure', 'success']
});

process.on('SIGINT', () => {
    running.forEach((cmd: any) => cmd.kill('SIGKILL'));
    process.exit(0);
});

result.then(
    () => process.exit(0),
    () => process.exit(1)
);
