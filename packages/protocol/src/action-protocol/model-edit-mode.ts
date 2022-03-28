/********************************************************************************
 * Copyright (c) 2020-2022 EclipseSource and others.
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

/**
 * Sent from the client to the server to set the model into a specific editor mode, allowing the server to react to certain
 * requests differently depending on the mode. A client may also listen to this action to prevent certain user interactions preemptively.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SetEditModeActions`.
 */
export interface SetEditModeAction extends Action {
    kind: typeof SetEditModeAction.KIND;

    /**
     * The new edit mode of the diagram.
     */
    editMode: string;
}

export namespace SetEditModeAction {
    export const KIND = 'setEditMode';

    export function is(object: any): object is SetEditModeAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'editMode');
    }

    export function create(editMode: string): SetEditModeAction {
        return {
            kind: KIND,
            editMode
        };
    }
}

/**
 * The potential default values for the `editMode` property of  a {@link SetEditModeAction}.
 */
export namespace EditMode {
    export const READONLY = 'readonly';
    export const EDITABLE = 'editable';
}
