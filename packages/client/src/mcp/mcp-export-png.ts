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
    CommandExecutionContext,
    CommandResult,
    ExportPngMcpAction,
    ExportPngMcpActionResult,
    GModelElement,
    GModelRoot,
    HiddenCommand,
    isExportable,
    isHoverable,
    isSelectable,
    isViewport,
    IVNodePostprocessor,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { GLSPSvgExporter } from '../features/export/glsp-svg-exporter';

/**
 * This class extends {@link GLSPSvgExporter} in order to make use of the SVG creation logic.
 * It then uses the SVG string to generate an equivalent PNG instead.
 *
 * This class should not be used for standard SVG generation, but only for generating PNG for MCP purposes.
 */
@injectable()
export class GLSPMcpPngExporter extends GLSPSvgExporter {
    async exportPng(root: GModelRoot, request?: ExportPngMcpAction): Promise<void> {
        if (!request) {
            return;
        }

        return new Promise((resolve, reject) => {
            if (typeof document === 'undefined') {
                reject(new Error('Failed to find document.'));
                return;
            }

            let svgElement = this.findSvgElement();
            if (!svgElement) {
                reject(new Error('Failed to find SVG element.'));
                return;
            }

            svgElement = this.prepareSvgElement(svgElement, root);
            const serializedSvg = this.createSvg(svgElement, root, request?.options ?? {}, request);
            const svgExport = this.getSvgExport(serializedSvg, svgElement, root);

            const svgBlob = new Blob([svgExport], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();

            img.onload = async () => {
                try {
                    const bitmap = await createImageBitmap(img);

                    const aspect = bitmap.width / bitmap.height;
                    const width = request?.options?.width ?? 1024;
                    const height = width / aspect;
                    const offscreen = new OffscreenCanvas(width, height);
                    const ctx = offscreen.getContext('2d');

                    if (!ctx) {
                        URL.revokeObjectURL(url);
                        reject(new Error('Failed to get offscreen context.'));
                        return;
                    }

                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(bitmap, 0, 0, width, height);

                    const outBlob = await offscreen.convertToBlob({ type: 'image/png' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        URL.revokeObjectURL(url);
                        const result = reader.result as string;
                        this.actionDispatcher.dispatch(
                            ExportPngMcpActionResult.create(
                                result.replace('data:image/png;base64,', ''),
                                request.mcpRequestId,
                                request.options
                            )
                        );
                        resolve();
                    };
                    reader.readAsDataURL(outBlob);
                } catch (err) {
                    URL.revokeObjectURL(url);
                    reject(err);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load SVG into image element.'));
            };

            img.src = url;
        });
    }
}

/**
 * See sprotty's `ExportSvgCommand`
 */
export class ExportPngMcpCommand extends HiddenCommand {
    static readonly KIND = ExportPngMcpAction.KIND;

    constructor(@inject(TYPES.Action) protected action: ExportPngMcpAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        if (isExportable(context.root)) {
            const root = context.modelFactory.createRoot(context.root);
            if (isExportable(root)) {
                if (isViewport(root)) {
                    root.zoom = 1;
                    root.scroll = { x: 0, y: 0 };
                }
                root.index.all().forEach(element => {
                    if (isSelectable(element) && element.selected) {
                        element.selected = false;
                    }
                    if (isHoverable(element) && element.hoverFeedback) {
                        element.hoverFeedback = false;
                    }
                });
                return {
                    model: root,
                    modelChanged: true,
                    cause: this.action
                };
            }
        }
        return {
            model: context.root,
            modelChanged: false
        };
    }
}

/**
 * See sprotty's `ExportSvgPostprocessor`
 */
@injectable()
export class ExportPngMcpPostprocessor implements IVNodePostprocessor {
    protected root: GModelRoot;

    @inject(GLSPMcpPngExporter)
    protected pngExporter: GLSPMcpPngExporter;

    decorate(vnode: VNode, element: GModelElement): VNode {
        if (element instanceof GModelRoot) {
            this.root = element;
        }
        return vnode;
    }

    postUpdate(cause?: Action): void {
        if (this.root && cause !== undefined && cause.kind === ExportPngMcpAction.KIND) {
            this.pngExporter.exportPng(this.root, cause as ExportPngMcpAction);
        }
    }
}
