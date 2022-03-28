/********************************************************************************
 * Copyright (c) 2021-2022 STMicroelectronics and others.
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

import { hasObjectProp } from '../utils/type-util';
import { Action, Operation, RequestAction, ResponseAction } from './base-protocol';
import { EditorContext } from './types';

/**
 * Requests the clipboard data for the current editor context, i.e., the selected elements, in a clipboard-compatible format.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestClipboardDataActions`.
 */
export interface RequestClipboardDataAction extends RequestAction<SetClipboardDataAction> {
    /**
     * The unique action kind.
     */
    kind: typeof RequestClipboardDataAction.KIND;

    /**
     * The current editor context.
     */
    editorContext: EditorContext;
}

export namespace RequestClipboardDataAction {
    export const KIND = 'requestClipboardData';

    export function is(object: any): object is RequestClipboardDataAction {
        return RequestAction.hasKind(object, KIND) && hasObjectProp(object, 'editorContext');
    }

    export function create(editorContext: EditorContext, options: { requestId?: string } = {}): RequestClipboardDataAction {
        return {
            kind: KIND,
            requestId: '',
            editorContext,
            ...options
        };
    }
}

/**
 * Server response to a {@link RequestClipboardDataAction} containing the selected elements as clipboard-compatible format.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetClipboardDataActions`.
 */
export interface SetClipboardDataAction extends ResponseAction {
    /**
     * The unique action kind.
     */
    kind: typeof SetClipboardDataAction.KIND;

    /**
     * The selected elements from the editor context as clipboard data.
     */
    clipboardData: ClipboardData;
}

export namespace SetClipboardDataAction {
    export const KIND = 'setClipboardData';

    export function is(object: any): object is SetClipboardDataAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'clipboardData');
    }

    export function create(clipboardData: ClipboardData, options: { responseId?: string } = {}): SetClipboardDataAction {
        return {
            kind: KIND,
            responseId: '',
            clipboardData,
            ...options
        };
    }
}

/**
 * Requests a cut operation from the server, i.e., deleting the selected elements from the model. Before submitting a `CutOperation`
 * a client should ensure that the cut elements are put into the clipboard.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `CutOperations`.
 */
export interface CutOperation extends Operation {
    /**
     * The unique action kind.
     */
    kind: typeof CutOperation.KIND;

    /**
     * The current editor context.
     */
    editorContext: EditorContext;
}

export namespace CutOperation {
    export const KIND = 'cut';

    export function is(object: any): object is CutOperation {
        return Operation.hasKind(object, KIND) && hasObjectProp(object, 'editorContext');
    }

    export function create(editorContext: EditorContext): CutOperation {
        return {
            kind: KIND,
            isOperation: true,
            editorContext
        };
    }
}

/**
 * Requests a paste operation from the server by providing the current clipboard data. Typically this means that elements should be created
 *  based on the data in the clipboard.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `PasteOperations`.
 */
export interface PasteOperation extends Operation {
    /**
     * The unique action kind.
     */
    kind: typeof PasteOperation.KIND;

    /**
     * The current editor context.
     */
    editorContext: EditorContext;

    /**
     * The clipboard data that should be pasted to the editor's last recorded mouse position (see `editorContext`).
     */
    clipboardData: ClipboardData;
}

export namespace PasteOperation {
    export const KIND = 'paste';

    export function is(object: any): object is PasteOperation {
        return Operation.hasKind(object, KIND) && hasObjectProp(object, 'clipboardData') && hasObjectProp(object, 'editorContext');
    }

    export function create(options: { editorContext: EditorContext; clipboardData: ClipboardData }): PasteOperation {
        return {
            kind: KIND,
            isOperation: true,
            ...options
        };
    }
}
/**
 * In GLSP the clipboard needs to be managed by the client but the conversion from the selection to be copied into a
 * clipboard-compatible format is handled by the server. By default, GLSP use application/json as exchange format.
 */
export interface ClipboardData {
    [format: string]: string;
}
