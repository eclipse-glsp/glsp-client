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
import {
    bindAsService,
    configureActionHandler,
    configureCommand,
    ExportResultAction,
    ExportSvgAction,
    ExportSvgCommand,
    ExportSvgKeyListener,
    ExportSvgPostprocessor,
    FeatureModule,
    TYPES
} from '@eclipse-glsp/sprotty';
import { DefaultPngDiagramExporter } from './default-png-diagram-exporter';
import { DefaultSvgDiagramExporter } from './default-svg-diagram-exporter';
import { DiagramExportPostprocessor } from './diagram-export-postprocessor';
import { ExportResultActionHandler } from './export-result-action-handler';
import { ExportSvgActionHandler } from './export-svg-action-handler';
import { GLSPSvgExporter } from './glsp-svg-exporter';
import { RequestExportCommand } from './request-export-command';

export const exportModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        // Legacy SVG path — sprotty's `RequestExportSvgAction` / `ExportSvgAction` flow.
        bindAsService(context, TYPES.HiddenVNodePostprocessor, ExportSvgPostprocessor);
        configureCommand(context, ExportSvgCommand);
        bindAsService(context, TYPES.SvgExporter, GLSPSvgExporter);

        // Unified export path — `RequestExportAction` / `ExportResultAction` + DiagramExporter registry.
        // Default strategies are bound to themselves *and* to the multi-binding key so adopters can
        // `rebind(DefaultPngDiagramExporter).to(...)` to swap a single shipped format without
        // having to unbind the entire registry.
        bindAsService(context, TYPES.HiddenVNodePostprocessor, DiagramExportPostprocessor);
        configureCommand(context, RequestExportCommand);
        bindAsService(context, TYPES.IDiagramExporter, DefaultSvgDiagramExporter);
        bindAsService(context, TYPES.IDiagramExporter, DefaultPngDiagramExporter);
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
        bind(ExportResultActionHandler).toSelf().inSingletonScope();
        configureActionHandler(context, ExportResultAction.KIND, ExportResultActionHandler);
    },
    { featureId: Symbol('standaloneExport'), requires: exportModule }
);
