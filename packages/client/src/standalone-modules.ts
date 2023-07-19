/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { ModuleConfiguration } from '~glsp-sprotty';
import { standaloneCopyPasteModule } from './features/copy-paste/copy-paste-modules';
import { standaloneExportModule } from './features/export/export-modules';
import { saveModule } from './features/save/save-module';
import { standaloneSelectModule } from './features/select/select-module';
import { undoRedoModule } from './features/undo-redo/undo-redo-module';
import { standaloneMarkerNavigatorModule } from './features/validation/validation-modules';
import { standaloneViewportModule } from './features/viewport/viewport-modules';
/**
 * Configuration of all `standalone` modules.
 *
 * Standalone modules compose additional features/services that are intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 *
 * Typically standalone modules built on top of (i.e require ) a default module and are therefore conditionally loaded if the
 * required default modules have been loaded beforehand.
 */

export const STANDALONE_MODULES = [
    standaloneViewportModule,
    standaloneCopyPasteModule,
    standaloneMarkerNavigatorModule,
    standaloneSelectModule,
    standaloneExportModule,
    saveModule,
    undoRedoModule
] as const;

export const STANDALONE_MODULE_CONFIG: ModuleConfiguration = {
    add: [...STANDALONE_MODULES]
};
