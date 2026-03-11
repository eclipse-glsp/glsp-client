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

import { hasStringProp } from '../utils/type-util';
import { Action } from './base-protocol';
import { ExportSvgOptions } from './model-saving';

/**
 * Request action for retrieving the current selection.
 */
export interface GetSelectionMcpAction extends Action {
    kind: typeof GetSelectionMcpAction.KIND;
    mcpRequestId: string;
}
export namespace GetSelectionMcpAction {
    export const KIND = 'GetSelectionMcpAction';

    export function is(object: unknown): object is GetSelectionMcpAction {
        return Action.hasKind(object, KIND);
    }

    export function create(mcpRequestId: string): GetSelectionMcpAction {
        return {
            kind: KIND,
            mcpRequestId
        };
    }
}

/**
 * Result for a `GetSelectionMcpAction`.
 */
export interface GetSelectionMcpResultAction extends Action {
    kind: typeof GetSelectionMcpResultAction.KIND;
    mcpRequestId: string;
    selectedElementsIDs: string[];
}
export namespace GetSelectionMcpResultAction {
    export const KIND = 'GetSelectionMcpResultAction';

    export function is(object: unknown): object is GetSelectionMcpResultAction {
        return Action.hasKind(object, KIND);
    }

    export function create(selectedElementsIDs: string[], mcpRequestId: string): GetSelectionMcpResultAction {
        return {
            kind: KIND,
            selectedElementsIDs,
            mcpRequestId
        };
    }
}

/**
 * A `ExportPngMcpAction` is sent by the server to initiate the PNG export of the current diagram to provide visual information
 * to an AI agent.
 * The handler of this action is expected to retrieve the diagram PNG and should send a {@link ExportPngMcpActionResult} as response.
 * Typically the {@link ExportPngMcpActionResult} is handled on the server side.
 */
export interface ExportPngMcpAction extends Action {
    kind: typeof ExportPngMcpAction.KIND;
    mcpRequestId: string;
    options?: ExportPngOptions;
}
export namespace ExportPngMcpAction {
    export const KIND = 'ExportPngMcpAction';

    export function is(object: unknown): object is ExportPngMcpAction {
        return Action.hasKind(object, KIND);
    }

    export function create(mcpRequestId: string, options: ExportPngOptions = {}): ExportPngMcpAction {
        return {
            kind: KIND,
            mcpRequestId,
            ...options
        };
    }
}

/** Configuration options for the {@link ExportPngMcpAction} */
export interface ExportPngOptions extends ExportSvgOptions {
    width?: number;
}

/**
 * The client sends an `ExportPngMcpActionResult` to communicate the diagram, which represents the current model state, in PNG format.
 * The action only provides the diagram PNG as base64 string.
 */
export interface ExportPngMcpActionResult extends Action {
    kind: typeof ExportPngMcpActionResult.KIND;
    mcpRequestId: string;
    png: string;
    options?: ExportPngOptions;
}

export namespace ExportPngMcpActionResult {
    export const KIND = 'ExportPngMcpActionResult';

    export function is(object: unknown): object is ExportPngMcpActionResult {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'png');
    }

    export function create(png: string, mcpRequestId: string, options: ExportPngOptions = {}): ExportPngMcpActionResult {
        return {
            kind: KIND,
            mcpRequestId,
            png,
            ...options
        };
    }
}
