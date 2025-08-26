/********************************************************************************
 * Copyright (c) 2021-2025 STMicroelectronics and others.
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
import { isStringArray } from '../utils/array-util';
import { hasArrayProp, hasBooleanProp } from '../utils/type-util';
import { Action } from './base-protocol';

/**
 * Triggered when the user changes the selection, e.g. by clicking on a selectable element. The action should trigger a change in the
 * selected state accordingly, so the elements can be rendered differently. The server can send such an action to the client in order to
 * change the selection remotely.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SelectActions`.
 */
export interface SelectAction extends Action, sprotty.SelectAction {
    kind: typeof SelectAction.KIND;

    /**
     * The identifiers of the elements to mark as selected.
     */
    selectedElementsIDs: string[];

    /**
     * The identifiers of the elements to mark as not selected.
     */
    deselectedElementsIDs: string[];

    /**
     * Whether all currently selected elements should be deselected.
     */
    deselectAll?: boolean;
}

export namespace SelectAction {
    export const KIND = 'elementSelected';

    export function is(object: unknown): object is SelectAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'selectedElementsIDs') && hasArrayProp(object, 'deselectedElementsIDs');
    }

    export function create(options: { selectedElementsIDs?: string[]; deselectedElementsIDs?: string[] | boolean } = {}): SelectAction {
        const deselectedElementsIDs = options.deselectedElementsIDs ?? [];
        return {
            kind: KIND,
            selectedElementsIDs: options.selectedElementsIDs ?? [],
            deselectedElementsIDs: isStringArray(deselectedElementsIDs, true) ? deselectedElementsIDs : [],
            deselectAll: typeof deselectedElementsIDs === 'boolean' ? deselectedElementsIDs : false
        };
    }

    /**
     * Creates a new {@link SelectAction} to add the given elements to the existing selection.
     * @param selectedElementsIDs The identifiers of the elements to add to the selection.
     * @returns the corresponding {@link SelectAction}
     */
    export function addSelection(selectedElementsIDs: string[]): SelectAction {
        return create({ selectedElementsIDs });
    }

    /**
     * Creates a new {@link SelectAction}
     * to remove the given elements from the existing selection.
     * @param deselectedElementsIDs The identifiers of the elements to remove from the selection.
     * @return the corresponding {@link SelectAction}
     */
    export function removeSelection(deselectedElementsIDs: string[]): SelectAction {
        return create({ deselectedElementsIDs });
    }

    /**
     * Creates a new {@link SelectAction}
     * to set the selection to the given elements.
     * This replaces the current selection with the given elements.
     * @param selectedElementsIDs The identifiers of the elements to select.
     * @returns the corresponding {@link SelectAction}
     */
    export function setSelection(selectedElementsIDs: string[]): SelectAction {
        return create({ selectedElementsIDs, deselectedElementsIDs: true });
    }
}

/**
 * Programmatic action for selecting or deselecting all elements.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `SelectAllActions`.
 */
export interface SelectAllAction extends Action, sprotty.SelectAllAction {
    kind: typeof SelectAllAction.KIND;

    /**
     * If `select` is true, all elements are selected, otherwise they are deselected.
     */
    select: boolean;
}

export namespace SelectAllAction {
    export const KIND = 'allSelected';

    export function is(object: unknown): object is SelectAllAction {
        return Action.hasKind(object, KIND) && hasBooleanProp(object, 'select');
    }

    export function create(select = true): SelectAllAction {
        return {
            kind: KIND,
            select
        };
    }
}
