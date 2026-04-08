/********************************************************************************
 * Copyright (c) 2021-2023 STMicroelectronics and others.
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

import { Bounds, Point, Viewport } from '../re-exports';
import { hasArrayProp, hasObjectProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';
import { Args, EditorContext, LabeledAction } from './types';

/**
 * The `RequestContextActions` is sent from the client to the server to request the available actions for the context with id contextId.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestContextActions`.
 */
export interface RequestContextActions extends RequestAction<SetContextActions> {
    kind: typeof RequestContextActions.KIND;

    /**
     * The identifier for the context.
     */
    contextId: string;

    editorContext: EditorContext;
}

export namespace RequestContextActions {
    export const KIND = 'requestContextActions';

    export function is(object: unknown): object is RequestContextActions {
        return RequestAction.hasKind(object, KIND) && hasStringProp(object, 'contextId') && hasObjectProp(object, 'editorContext');
    }

    export function create(options: { contextId: string; editorContext: EditorContext; requestId?: string }): RequestContextActions {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * The `SetContextActions` is the response to a {@link RequestContextActions} containing all actions for the queried context.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetContextsActions`.
 */
export interface SetContextActions extends ResponseAction {
    kind: typeof SetContextActions.KIND;

    /**
     * The actions available in the queried context.
     */
    readonly actions: LabeledAction[];

    /**
     * Custom arguments.
     */
    args?: Args;
}

export namespace SetContextActions {
    export const KIND = 'setContextActions';

    export function is(object: unknown): object is SetContextActions {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'actions');
    }

    export function create(actions: LabeledAction[], options: { args?: Args; responseId?: string } = {}): SetContextActions {
        return {
            kind: KIND,
            responseId: '',
            actions,
            ...options
        };
    }
}

/**
 * Sent from the server to the client to request the current {@link EditorContext}. This is the server-initiated
 * counterpart to the `editorContext` parameter that is included in many client-to-server requests.
 *
 * All fields in the response represent a snapshot of the client state at the time the response is generated.
 * There is no guarantee that the state has not changed by the time the server processes the response.
 *
 * If you only need a subset of the editor context, consider using a more specific action instead:
 * - For selected elements only, use {@link GetSelectionAction} (sprotty built-in).
 * - For viewport and canvas bounds only, use {@link GetViewportAction} (sprotty built-in).
 */
export interface GetEditorContextAction extends RequestAction<SetEditorContextAction> {
    kind: typeof GetEditorContextAction.KIND;
}

export namespace GetEditorContextAction {
    export const KIND = 'getEditorContext';

    export function is(object: unknown): object is GetEditorContextAction {
        return RequestAction.hasKind(object, KIND);
    }

    export function create(options: { requestId?: string; timeout?: number } = {}): GetEditorContextAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * Response to a {@link GetEditorContextAction} containing a snapshot of the client-side editor state.
 *
 * All fields reflect the state at the time of response generation. The server should not assume
 * that these values are still current when processing the response, as the client state may have
 * changed in the meantime.
 */
export interface SetEditorContextAction extends ResponseAction {
    kind: typeof SetEditorContextAction.KIND;

    /**
     * The list of currently selected element identifiers.
     * For a dedicated selection query, use {@link GetSelectionAction} instead.
     */
    readonly selectedElementIds: string[];

    /**
     * The last recorded mouse position on the diagram, or `undefined` if no position has been recorded.
     */
    readonly lastMousePosition?: Point;

    /**
     * The current viewport (scroll position and zoom level).
     * For a dedicated viewport query, use {@link GetViewportAction} instead.
     */
    readonly viewport: Viewport;

    /**
     * The bounds of the canvas element in the browser.
     * For a dedicated viewport and canvas bounds query, use {@link GetViewportAction} instead.
     */
    readonly canvasBounds: Bounds;

    /**
     * Custom arguments for application-specific client state.
     */
    readonly args?: Args;
}

export namespace SetEditorContextAction {
    export const KIND = 'setEditorContext';

    export function is(object: unknown): object is SetEditorContextAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'selectedElementIds');
    }

    export function create(
        options: {
            selectedElementIds: string[];
            lastMousePosition?: Point;
            viewport: Viewport;
            canvasBounds: Bounds;
            args?: Args;
            responseId?: string;
        }
    ): SetEditorContextAction {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}
