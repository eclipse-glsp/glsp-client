/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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
import { Action, hasNumberProp } from '@eclipse-glsp/sprotty';

export enum SelectionPaletteState {
    Collapse,
    Expand
}

/**
 * Action that changes the selection palette state
 */
export interface ChangeSelectionPaletteStateAction extends Action {
    kind: typeof ChangeSelectionPaletteStateAction.KIND;

    /**
     * The selection palette state to be switched to
     */
    state: SelectionPaletteState;
}

export namespace ChangeSelectionPaletteStateAction {
    export const KIND = 'changeSelectionPaletteState';

    export function is(object: any): object is ChangeSelectionPaletteStateAction {
        return Action.hasKind(object, KIND) && hasNumberProp(object, 'state');
    }

    export function create(state: SelectionPaletteState): ChangeSelectionPaletteStateAction {
        return {
            kind: KIND,
            state
        };
    }
}
