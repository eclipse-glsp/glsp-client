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

/** Default raster width (in CSS px) when neither `width` nor `height` is specified. */
const DEFAULT_PNG_WIDTH = 1024;
const DEFAULT_PNG_BACKGROUND = 'white';

/**
 * Default PNG strategy for the unified export registry. Reuses {@link GLSPSvgExporter}'s
 * SVG-rendering pipeline and rasterises the result client-side via `OffscreenCanvas`.
 * Adopters that need server-side rendering replace this binding with their own strategy.
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
        const { width, height } = this.computeDimensions(svgString, options);
        // Pin the SVG root to the target raster size BEFORE loading into `<img>` so the browser
        // rasterises the vector content at full resolution.
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

    protected computeDimensions(svgString: string, options: PngExportOptions): { width: number; height: number } {
        const requestedWidth = options.width ?? DEFAULT_PNG_WIDTH;
        const requestedHeight = options.height;
        if (requestedHeight !== undefined) {
            return { width: requestedWidth, height: requestedHeight };
        }
        // Read the aspect from the SVG attributes directly to avoid a redundant bitmap decode.
        const aspect = this.parseAspectRatio(svgString);
        return { width: requestedWidth, height: requestedWidth / aspect };
    }

    /**
     * Read the aspect ratio from the root `<svg>` tag's `viewBox`, falling back to the
     * `width`/`height` attributes. GLSP-emitted SVGs always carry a `viewBox` (set by the
     * underlying sprotty exporter), so the fallback is a defensive safeguard.
     */
    protected parseAspectRatio(svgString: string): number {
        const root = svgString.match(/<svg\b([^>]*)>/);
        const attrs = root?.[1] ?? '';
        const viewBox = attrs.match(/viewBox\s*=\s*"\s*[\d.eE+-]+\s+[\d.eE+-]+\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s*"/);
        if (viewBox) {
            return parseFloat(viewBox[1]) / parseFloat(viewBox[2]);
        }
        const widthAttr = attrs.match(/\swidth\s*=\s*"([\d.eE+-]+)/);
        const heightAttr = attrs.match(/\sheight\s*=\s*"([\d.eE+-]+)/);
        if (widthAttr && heightAttr) {
            return parseFloat(widthAttr[1]) / parseFloat(heightAttr[1]);
        }
        throw new Error('PNG export failed: SVG missing viewBox/width/height — cannot determine aspect ratio');
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
