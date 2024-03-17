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
import { Bounds } from 'sprotty-protocol';
import * as sprotty from 'sprotty-protocol/lib/actions';
import { GModelRootSchema } from '../model/model-schema';
import { hasObjectProp, hasStringProp } from '../utils/type-util';
import { Action, RequestAction, ResponseAction } from './base-protocol';

/**
 * Triggered when the user hovers the mouse pointer over an element to get a popup with details on that element.
 * This action is sent from the client to the server. The response is a `SetPopupModelAction`.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RequestPopupModelActions`.
 */
export interface RequestPopupModelAction extends RequestAction<SetPopupModelAction>, sprotty.RequestPopupModelAction {
    kind: typeof RequestPopupModelAction.KIND;

    /**
     * The identifier of the elements for which a popup is requested.
     */
    elementId: string;

    /**
     * The popup bounds declaring the position of the popup. Optionally the desired dimension.
     */
    bounds: Bounds;
}

export namespace RequestPopupModelAction {
    export const KIND = 'requestPopupModel';

    export function is(object: unknown): object is RequestPopupModelAction {
        return RequestAction.hasKind(object, KIND) && hasStringProp(object, 'elementId') && hasObjectProp(object, 'bounds');
    }

    export function create(options: { elementId: string; bounds: Bounds; requestId?: string }): RequestPopupModelAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * Sent from the server to the client to display a popup in response to a RequestPopupModelAction. This action can also be used to remove
 * unknown existing popup by choosing EMPTY_ROOT as root element.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetPopupModelActions`.
 */
export interface SetPopupModelAction extends ResponseAction, sprotty.SetPopupModelAction {
    kind: typeof SetPopupModelAction.KIND;

    newRoot: GModelRootSchema;
}

export namespace SetPopupModelAction {
    export const KIND = 'setPopupModel';

    export function is(object: unknown): object is SetPopupModelAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'newRoot');
    }

    export function create(newRoot: GModelRootSchema, options: { responseId?: string } = {}): SetPopupModelAction {
        return {
            kind: KIND,
            responseId: '',
            newRoot,
            ...options
        };
    }
}
