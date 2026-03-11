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
import {
    bindAsService,
    configureActionHandler,
    configureCommand,
    ExportSvgAction,
    ExportSvgCommand,
    ExportSvgKeyListener,
    ExportSvgPostprocessor,
    FeatureModule,
    TYPES
} from '@eclipse-glsp/sprotty';
import { ExportSvgActionHandler } from './export-svg-action-handler';
import { GLSPSvgExporter } from './glsp-svg-exporter';

export const exportModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        bindAsService(context, TYPES.HiddenVNodePostprocessor, ExportSvgPostprocessor);
        configureCommand(context, ExportSvgCommand);
        bind(TYPES.SvgExporter).to(GLSPSvgExporter).inSingletonScope();
    },
    { featureId: Symbol('export') }
);

/**
 * Feature module that is intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 */
export const standaloneExportModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        bindAsService(context, TYPES.KeyListener, ExportSvgKeyListener);
        bind(ExportSvgActionHandler).toSelf().inSingletonScope();
        configureActionHandler(context, ExportSvgAction.KIND, ExportSvgActionHandler);
    },
    { featureId: Symbol('standaloneExport'), requires: exportModule }
);
