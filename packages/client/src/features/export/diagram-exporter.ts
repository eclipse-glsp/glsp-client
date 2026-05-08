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

import { Action, ExportEncoding, ExportFormat, ExportMimeType, GModelRoot } from '@eclipse-glsp/sprotty';

/**
 * A pluggable strategy that turns the rendered diagram into the bytes of a specific export
 * format. GLSP ships strategies for `'svg'` and `'png'` (both rendered client-side via the
 * existing SVG export pipeline + `OffscreenCanvas` for PNG). Adopters add formats — PPTX,
 * PDF, server-rendered PNG, … — by registering additional contributions.
 *
 * Implementations choose how the bytes are produced (DOM serialisation, canvas
 * rasterisation, delegation to a backend service via Theia/Electron RPC, …) — the registry
 * is runtime-agnostic. The generic `O` is the strategy-specific options shape (e.g.
 * `PngExportOptions`) carried inside `RequestExportAction.formatOptions`; the postprocessor
 * forwards the bag to the strategy, so each implementation reads its typed options directly
 * without an in-method cast.
 */
export interface DiagramExporter<O = unknown> {
    /** Format identifier matched against `RequestExportAction.format` (lower-case). */
    readonly format: ExportFormat;
    /** MIME type written into the resulting `ExportResultAction.mimeType`. */
    readonly mimeType: ExportMimeType;
    /** Encoding of the produced `data` field — `'text'` for SVG markup, `'base64'` for binary formats, or any adopter-defined tag. */
    readonly encoding: ExportEncoding;
    /**
     * Produce the export payload. `formatOptions` is the strategy-typed slice of
     * `RequestExportAction.formatOptions`; `cause` carries the originating action so
     * adopters can inspect request metadata beyond the per-format options.
     */
    export(root: GModelRoot, formatOptions: O, cause?: Action): Promise<string>;
}
