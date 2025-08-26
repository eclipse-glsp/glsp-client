/********************************************************************************
 * Copyright (c) 2020-2025 EclipseSource and others.
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
import { ProposalString, hasStringProp } from '../utils/type-util';
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
     * Default values are `readonly` and `editable`, but custom modes can be used as well.
     */
    editMode: string;
}

export namespace SetEditModeAction {
    export const KIND = 'setEditMode';

    export function is(object: unknown): object is SetEditModeAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'editMode');
    }

    export function create<E extends EditMode>(editMode: E): SetEditModeAction {
        return {
            kind: KIND,
            editMode
        };
    }
}

/**
 * Utility type for the edit mode, which offers the default values `readonly` and `editable` as
 * proposals. Any other string value can be used as custom edit mode as well.
 */
export type EditMode = ProposalString<(typeof EditMode)[keyof typeof EditMode]>;
export const EditMode = {
    READONLY: 'readonly',
    EDITABLE: 'editable'
} as const;
