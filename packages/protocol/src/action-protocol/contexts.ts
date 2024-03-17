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
