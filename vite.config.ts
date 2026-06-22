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
import glspVitestConfig, { defineConfig, mergeConfig } from '@eclipse-glsp/vitest-config';

// Single flat config for the whole monorepo: the shared base globs every package's specs under
// `src`, so one `vitest run --coverage` produces a merged report without per-package configs.
// `reflect-metadata` is loaded globally for inversify-based DI specs (matching the former
// .mocharc); it is harmless for the packages that don't use DI.
export default mergeConfig(
    glspVitestConfig,
    defineConfig({
        test: {
            setupFiles: ['reflect-metadata']
        }
    })
);
