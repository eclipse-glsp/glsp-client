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

import { Action, ExportFormat, ExportMimeType, GModelRoot, PngExportOptions } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { DiagramExporter } from './diagram-exporter';
import { GLSPSvgExporter } from './glsp-svg-exporter';

/**
 * Default fallback width (in CSS px) when the request omits an explicit `width`.
 * Matches the previous MCP-specific PNG path so existing MCP consumers see no
 * behavioural change.
 */
const DEFAULT_PNG_WIDTH = 1024;
const DEFAULT_PNG_BACKGROUND = 'white';

/**
 * Default PNG strategy for the unified export registry. Reuses {@link GLSPSvgExporter}'s
 * SVG-rendering pipeline and rasterises the result client-side via `OffscreenCanvas` —
 * browser-native, no extra dependencies. Adopters that need server-side rendering (e.g.
 * resvg, headless Chrome) replace this binding with their own strategy.
 */
@injectable()
export class DefaultPngDiagramExporter implements DiagramExporter<PngExportOptions> {
    readonly format: ExportFormat = 'png';
    readonly mimeType: ExportMimeType = 'image/png';
    readonly encoding = 'base64' as const;

    @inject(GLSPSvgExporter) protected svgExporter: GLSPSvgExporter;

    async export(root: GModelRoot, options: PngExportOptions = {}, cause?: Action): Promise<string> {
        if (typeof document === 'undefined' || typeof OffscreenCanvas === 'undefined') {
            throw new Error('PNG export failed: requires a DOM environment with OffscreenCanvas support');
        }
        const svgString = this.svgExporter.exportToString(root, options, cause);
        const { width, height } = await this.computeDimensions(svgString, options);
        // Pin the SVG root to the target raster size BEFORE loading into `<img>` so the browser
        // rasterises the vector content at full resolution. Without this the browser uses the
        // SVG's intrinsic CSS-style size (emitted by the SVG exporter for viewer-friendly
        // display), and `drawImage` then bitmap-upscales — producing a blurry result whenever
        // the requested raster size differs from the SVG's intrinsic size.
        const sizedSvg = this.applyRasterSize(svgString, width, height);
        const blob = await this.rasterise(sizedSvg, width, height, options.background ?? DEFAULT_PNG_BACKGROUND);
        return this.blobToBase64(blob);
    }

    /**
     * Rewrite the root `<svg>` tag so its rendered size matches the target raster dimensions.
     * Replaces `width`/`height` attributes and strips conflicting `style` declarations
     * (the SVG exporter emits `width: …px !important` on the inline style for viewer-friendly
     * display, which would otherwise win over the attributes). The existing `viewBox`
     * preserves the vector coordinate system so the content scales without distortion.
     */
    protected applyRasterSize(svgString: string, width: number, height: number): string {
        return svgString.replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
            const cleaned = attrs
                .replace(/\swidth="[^"]*"/, '')
                .replace(/\sheight="[^"]*"/, '')
                .replace(/style="([^"]*)"/, (_match, styleBody: string) => {
                    const stripped = styleBody
                        .replace(/(?:^|;)\s*width\s*:[^;]*/gi, '')
                        .replace(/(?:^|;)\s*height\s*:[^;]*/gi, '')
                        .replace(/^\s*;+/, '')
                        .trim();
                    return stripped ? `style="${stripped}"` : '';
                });
            return `<svg${cleaned} width="${width}" height="${height}">`;
        });
    }

    protected async computeDimensions(svgString: string, options: PngExportOptions): Promise<{ width: number; height: number }> {
        const requestedWidth = options.width ?? DEFAULT_PNG_WIDTH;
        const requestedHeight = options.height;
        if (requestedHeight !== undefined) {
            return { width: requestedWidth, height: requestedHeight };
        }
        // Preserve aspect ratio from the rendered bitmap.
        const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
        try {
            const bitmap = await this.bitmapFromSvgUrl(url);
            const aspect = bitmap.width / bitmap.height;
            return { width: requestedWidth, height: requestedWidth / aspect };
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    protected async rasterise(svgString: string, width: number, height: number, background: string): Promise<Blob> {
        const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
        try {
            const bitmap = await this.bitmapFromSvgUrl(url);
            const offscreen = new OffscreenCanvas(width, height);
            const ctx = offscreen.getContext('2d');
            if (!ctx) {
                throw new Error('PNG export failed: 2D context unavailable on OffscreenCanvas');
            }
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(bitmap, 0, 0, width, height);
            return offscreen.convertToBlob({ type: 'image/png' });
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    protected bitmapFromSvgUrl(url: string): Promise<ImageBitmap> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => createImageBitmap(img).then(resolve, reject);
            img.onerror = () => reject(new Error('PNG export failed: SVG could not be loaded into Image'));
            img.src = url;
        });
    }

    protected blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.replace(/^data:[^;]+;base64,/, ''));
            };
            reader.onerror = () => reject(reader.error ?? new Error('PNG export failed: FileReader error'));
            reader.readAsDataURL(blob);
        });
    }
}
