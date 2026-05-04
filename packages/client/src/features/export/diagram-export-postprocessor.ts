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

import {
    Action,
    ExportResultAction,
    GModelElement,
    GModelRoot,
    IActionDispatcher,
    IVNodePostprocessor,
    RejectAction,
    RequestExportAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable, multiInject } from 'inversify';
import { VNode } from 'snabbdom';
import { DiagramExporter } from './diagram-exporter';

/**
 * Postprocessor for the unified `RequestExportAction` flow. Captures the rendered model
 * root from the `decorate` pass, then on `postUpdate` looks up the matching
 * {@link DiagramExporter} by `format` and dispatches an `ExportResultAction` with the
 * produced bytes.
 *
 * Sits next to sprotty's `ExportSvgPostprocessor` (which keeps handling the legacy
 * `RequestExportSvgAction` kind). Strict separation between the two protocols means each
 * postprocessor only fires on its own `cause` kind — no double-dispatch.
 */
@injectable()
export class DiagramExportPostprocessor implements IVNodePostprocessor {
    @multiInject(TYPES.IDiagramExporter) protected exporters: DiagramExporter[];
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;

    protected root: GModelRoot;

    decorate(vnode: VNode, element: GModelElement): VNode {
        if (element instanceof GModelRoot) {
            this.root = element;
        }
        return vnode;
    }

    postUpdate(cause?: Action): void {
        if (!this.root || !RequestExportAction.is(cause)) {
            return;
        }
        const request = cause;
        this.runExport(request).catch(err => {
            const message = err instanceof Error ? err.message : String(err);
            this.actionDispatcher.dispatch(RejectAction.create(message, { responseId: request.requestId }));
        });
    }

    protected async runExport(request: RequestExportAction): Promise<void> {
        // First-bound-wins on duplicate formats: an adopter who registers a custom
        // PNG exporter without `unbind`-ing the default will pick up the default. To
        // override, rebind via `binding.rebind(DefaultPngDiagramExporter, MyPngExporter)`
        // in your `DiagramExportModule` extension.
        const exporter = this.exporters.find(candidate => candidate.format === request.format);
        if (!exporter) {
            throw new Error(`No DiagramExporter registered for format '${request.format}'`);
        }
        const data = await exporter.export(this.root, request.formatOptions ?? {}, request);
        this.actionDispatcher.dispatch(
            ExportResultAction.create(exporter.format, data, {
                mimeType: exporter.mimeType,
                encoding: exporter.encoding,
                responseId: request.requestId,
                formatOptions: request.formatOptions
            })
        );
    }
}
