/********************************************************************************
 * Copyright (c) 2021-2024 STMicroelectronics and others.
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
import * as sprotty from 'sprotty-protocol/lib/actions';
import { hasBooleanProp, hasStringProp } from '../utils/type-util';
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
 * A `RequestExportSvgAction` is sent by the client (or the server) to initiate the SVG export of the current diagram.
 * The handler of this action is expected to retrieve the diagram SVG and should send a {@link ExportSvgAction} as response.
 * Typically the {@link ExportSvgAction} is handled directly on client side.
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

/** Configuration options for the {@link RequestExportSvgAction */
export interface ExportSvgOptions extends sprotty.ExportSvgOptions {
    // If set to false applied diagram styles will not be copied to the exported SVG
    skipCopyStyles?: boolean;
}

/**
 * The client sends an `ExportSvgAction` to indicate that the diagram, which represents the current model state,
 * should be exported in SVG format. The action only provides the diagram SVG as plain string. The expected result of executing
 * an `ExportSvgAction` is a new file in SVG-format on the underlying filesystem. However, other details like the target destination,
 * concrete file name, file extension etc. are not specified in the protocol. So it is the responsibility of the action handler to
 * process this information accordingly and export the result to the underlying filesystem.
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
