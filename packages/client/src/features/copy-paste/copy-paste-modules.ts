/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { bindAsService, FeatureModule, TYPES } from '@eclipse-glsp/sprotty';
import { LocalClipboardService, ServerCopyPasteHandler } from './copy-paste-handler';
import { CopyPasteStartup } from './copy-paste-standalone';

export const copyPasteModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        bind(TYPES.ICopyPasteHandler).to(ServerCopyPasteHandler);
        bind(TYPES.IAsyncClipboardService).to(LocalClipboardService).inSingletonScope();
    },
    { featureId: Symbol('copyPaste') }
);

/**
 * Feature module that is intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 */
export const standaloneCopyPasteModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        bindAsService(bind, TYPES.IDiagramStartup, CopyPasteStartup);
        bind(TYPES.IGModelRootListener).toService(CopyPasteStartup);
    },
    {
        featureId: Symbol('standaloneCopyPaste'),
        requires: copyPasteModule
    }
);
