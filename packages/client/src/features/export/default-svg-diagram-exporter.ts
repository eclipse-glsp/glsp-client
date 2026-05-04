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

import { Action, ExportFormat, ExportMimeType, GModelRoot, SvgExportOptions } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { DiagramExporter } from './diagram-exporter';
import { GLSPSvgExporter } from './glsp-svg-exporter';

/**
 * Default SVG strategy for the unified export registry. Wraps {@link GLSPSvgExporter} —
 * the same exporter that powers the legacy `RequestExportSvgAction` path — so adopter
 * overrides on the SVG renderer (extending `GLSPSvgExporter`) participate in unified
 * exports for free.
 */
@injectable()
export class DefaultSvgDiagramExporter implements DiagramExporter<SvgExportOptions> {
    readonly format: ExportFormat = 'svg';
    readonly mimeType: ExportMimeType = 'image/svg+xml';
    readonly encoding = 'text' as const;

    @inject(GLSPSvgExporter) protected svgExporter: GLSPSvgExporter;

    async export(root: GModelRoot, options: SvgExportOptions = {}, cause?: Action): Promise<string> {
        return this.svgExporter.exportToString(root, options, cause);
    }
}
