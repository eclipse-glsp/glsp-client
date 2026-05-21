/********************************************************************************
 * Copyright (c) 2021-2026 STMicroelectronics and others.
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
/* eslint-disable @typescript-eslint/no-deprecated */
import * as sprotty from 'sprotty-protocol/lib/actions';
import { ProposalString, hasBooleanProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';

/**
 * Sent from the client to the server in order to persist the current model state back to the source model.
 * A new fileUri can be defined to save the model to a new destination different from its original source model.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SaveModelActions`.
 */
export interface SaveModelAction extends Action {
    kind: typeof SaveModelAction.KIND;
    /**
     *  The optional destination file uri.
     */
    fileUri?: string;
}

export namespace SaveModelAction {
    export const KIND = 'saveModel';

    export function is(object: unknown): object is SaveModelAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { fileUri?: string } = {}): SaveModelAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

/**
 * The server sends this action to indicate to the client that the current model state on the server does not correspond
 * to the persisted model state of the source model. A client may ignore such an action or use it to indicate to the user the dirty state.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetDirtyStateActions`.
 */
export interface SetDirtyStateAction extends Action {
    kind: typeof SetDirtyStateAction.KIND;
    /**
     * True if the current model state is dirty
     */
    isDirty: boolean;

    /**
     * A string indicating the reason for the dirty state change e.g 'operation', 'undo',...
     */
    reason?: DirtyStateChangeReason;
}

export type DirtyStateChangeReason = 'operation' | 'undo' | 'redo' | 'save' | 'external';

export namespace SetDirtyStateAction {
    export const KIND = 'setDirtyState';

    export function is(object: unknown): object is SetDirtyStateAction {
        return Action.hasKind(object, KIND) && hasBooleanProp(object, 'isDirty');
    }

    export function create(isDirty: boolean, options: { reason?: DirtyStateChangeReason } = {}): SetDirtyStateAction {
        return {
            kind: KIND,
            isDirty,
            ...options
        };
    }
}

/**
 * A {@link RequestExportSvgAction} is sent by the client (or the server) to initiate the SVG export of the current diagram.
 * The handler of this action is expected to retrieve the diagram SVG and should send a {@link ExportSvgAction} as response.
 * Typically the {@link ExportSvgAction} is handled directly on client side.
 *
 * @deprecated Use the unified {@link RequestExportAction} (with `format: 'svg'`) and
 * {@link ExportResultAction} pair instead.
 */
export interface RequestExportSvgAction extends RequestAction<ExportSvgAction>, sprotty.RequestExportSvgAction {
    kind: typeof RequestExportSvgAction.KIND;
    options?: ExportSvgOptions;
}
export namespace RequestExportSvgAction {
    export const KIND = 'requestExportSvg';

    export function is(object: unknown): object is RequestExportSvgAction {
        return RequestAction.hasKind(object, KIND);
    }

    export function create(options: { options?: ExportSvgOptions; requestId?: string } = {}): RequestExportSvgAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/** Configuration options for the {@link RequestExportSvgAction} */
export interface ExportSvgOptions extends sprotty.ExportSvgOptions {
    // If set to false applied diagram styles will not be copied to the exported SVG
    skipCopyStyles?: boolean;
}

/**
 * The client sends an {@link ExportSvgAction} to indicate that the diagram, which represents the current model state,
 * should be exported in SVG format. The action only provides the diagram SVG as plain string. The expected result of executing
 * an {@link ExportSvgAction} is a new file in SVG-format on the underlying filesystem. However, other details like the target destination,
 * concrete file name, file extension etc. are not specified in the protocol. So it is the responsibility of the action handler to
 * process this information accordingly and export the result to the underlying filesystem.
 *
 * @deprecated Use {@link ExportResultAction} as the response to a unified
 * {@link RequestExportAction} instead.
 */
export interface ExportSvgAction extends ResponseAction, sprotty.ExportSvgAction {
    kind: typeof ExportSvgAction.KIND;
    svg: string;
    options?: ExportSvgOptions;
}

export namespace ExportSvgAction {
    export const KIND = 'exportSvg';

    export function is(object: unknown): object is ExportSvgAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'svg');
    }

    export function create(svg: string, options: { options?: ExportSvgOptions; responseId?: string } = {}): ExportSvgAction {
        return {
            kind: KIND,
            svg,
            responseId: '',
            ...options
        };
    }
}

/**
 * Format identifier for a diagram export. The package ships `'svg'` and `'png'`;
 * adopters add formats by registering a `DiagramExporter` strategy keyed on any string.
 */
export type ExportFormat = ProposalString<'svg' | 'png'>;

/** MIME type returned alongside an export. */
export type ExportMimeType = ProposalString<'image/svg+xml' | 'image/png'>;

/**
 * Encoding of the bytes carried in {@link ExportResultAction.data}. The package ships
 * `'text'` (UTF-8 markup, e.g. SVG) and `'base64'` (binary blobs, e.g. PNG); adopters
 * registering a strategy with a different runtime declare their own encoding tag.
 * Receivers must reject encodings they don't understand explicitly; silently treating an
 * unknown value as one of the shipped ones corrupts payloads.
 */
export type ExportEncoding = ProposalString<'text' | 'base64'>;

/**
 * Options shared by every export strategy that renders through sprotty's SVG export pipeline.
 * Today honoured by SVG output and the canvas-based PNG rasteriser; future strategies that
 * also raster from SVG (PDF, PPTX, ...) would extend this interface for the same knob.
 */
export interface SvgRenderOptions {
    /**
     * Skip the per-element style-copy step. The default copy walk is expensive on large
     * diagrams; setting this flag skips it at the cost of losing CSS-driven styling in the
     * exported output.
     */
    skipCopyStyles?: boolean;
}

/**
 * SVG-specific options carried inside {@link RequestExportAction.formatOptions} for the SVG
 * export strategy. Mirrors {@link ExportSvgOptions} so callers migrating from the legacy
 * {@link RequestExportSvgAction} retain feature parity.
 */
export interface SvgExportOptions extends SvgRenderOptions {}

/**
 * PNG-specific options carried inside {@link RequestExportAction.formatOptions} for the PNG
 * export strategy. All fields optional — strategies fall back to sensible defaults. Inherits
 * `skipCopyStyles` from {@link SvgRenderOptions} since PNG rasterises from SVG.
 */
export interface PngExportOptions extends SvgRenderOptions {
    /** Output width in px. */
    width?: number;
    /** Output height in px. If omitted, height is derived to preserve the rendered aspect ratio. */
    height?: number;
    /** CSS colour painted as the canvas background before drawing the SVG. */
    background?: string;
}

/**
 * Generic, format-agnostic export request. Sent client-to-self for UI-driven export
 * flows, or server-to-client for server-orchestrated flows (e.g. an MCP tool requesting
 * a PNG snapshot of the active diagram). The expected response is an
 * {@link ExportResultAction} carrying the rendered bytes.
 *
 * `formatOptions` is opaque to the protocol — typed as `unknown` so the format-specific
 * overloads of {@link RequestExportAction.create} can narrow it to {@link SvgExportOptions},
 * {@link PngExportOptions}, or an adopter's own shape without an index-signature dance. The
 * `DiagramExporter` for the given `format` validates the value at the strategy boundary.
 *
 * Coexists with the legacy {@link RequestExportSvgAction} under strict separation:
 * legacy kind (`requestExportSvg`) → legacy action ({@link ExportSvgAction}) only; new kind
 * (`requestExport`) → new action ({@link ExportResultAction}) only; never crossed.
 */
export interface RequestExportAction extends RequestAction<ExportResultAction> {
    kind: typeof RequestExportAction.KIND;
    format: ExportFormat;
    formatOptions?: unknown;
}
export namespace RequestExportAction {
    export const KIND = 'requestExport';

    export function is(object: unknown): object is RequestExportAction {
        return RequestAction.hasKind(object, KIND) && hasStringProp(object, 'format');
    }

    /** Typed overload for the shipped `'svg'` format — autocomplete on `formatOptions`. */
    export function create(format: 'svg', options?: { formatOptions?: SvgExportOptions; requestId?: string }): RequestExportAction;
    /** Typed overload for the shipped `'png'` format — autocomplete on `formatOptions`. */
    export function create(format: 'png', options?: { formatOptions?: PngExportOptions; requestId?: string }): RequestExportAction;
    /** General overload for adopter-registered formats; `formatOptions` is opaque. */
    export function create(format: ExportFormat, options?: { formatOptions?: unknown; requestId?: string }): RequestExportAction;
    export function create(format: ExportFormat, options: { formatOptions?: unknown; requestId?: string } = {}): RequestExportAction {
        return {
            kind: KIND,
            format,
            requestId: '',
            ...options
        };
    }
}

/**
 * Response to a {@link RequestExportAction} carrying the rendered diagram. Text-encoded
 * payloads (e.g. SVG markup) ride in `data` directly; binary payloads (e.g. PNG) are
 * base64-encoded with `encoding: 'base64'` so the action stays JSON-safe.
 */
export interface ExportResultAction extends ResponseAction {
    kind: typeof ExportResultAction.KIND;
    /** Echoes the requested format. */
    format: ExportFormat;
    mimeType: ExportMimeType;
    encoding: ExportEncoding;
    /** SVG markup (`encoding: 'text'`) or base64-encoded bytes (`encoding: 'base64'`). */
    data: string;
    /** Echoes the request's `formatOptions` so receivers can correlate result fields back to the request. */
    formatOptions?: unknown;
}
export namespace ExportResultAction {
    export const KIND = 'exportResult';

    export function is(object: unknown): object is ExportResultAction {
        return (
            Action.hasKind(object, KIND) &&
            hasStringProp(object, 'format') &&
            hasStringProp(object, 'data') &&
            hasStringProp(object, 'mimeType') &&
            hasStringProp(object, 'encoding')
        );
    }

    /** Typed overload for the shipped `'svg'` format — typed echoed `formatOptions`. */
    export function create(
        format: 'svg',
        data: string,
        options: { mimeType: ExportMimeType; encoding: ExportEncoding; responseId?: string; formatOptions?: SvgExportOptions }
    ): ExportResultAction;
    /** Typed overload for the shipped `'png'` format — typed echoed `formatOptions`. */
    export function create(
        format: 'png',
        data: string,
        options: { mimeType: ExportMimeType; encoding: ExportEncoding; responseId?: string; formatOptions?: PngExportOptions }
    ): ExportResultAction;
    /** General overload for adopter-registered formats; echoed `formatOptions` is opaque. */
    export function create(
        format: ExportFormat,
        data: string,
        options: { mimeType: ExportMimeType; encoding: ExportEncoding; responseId?: string; formatOptions?: unknown }
    ): ExportResultAction;
    export function create(
        format: ExportFormat,
        data: string,
        options: { mimeType: ExportMimeType; encoding: ExportEncoding; responseId?: string; formatOptions?: unknown }
    ): ExportResultAction {
        return {
            kind: KIND,
            format,
            data,
            responseId: '',
            ...options
        };
    }
}
