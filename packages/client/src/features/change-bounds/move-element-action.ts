/********************************************************************************
 * Copyright (c) 2024-2025 EclipseSource and others.
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

import { Action } from '@eclipse-glsp/sprotty';

/**
 * Action for triggering moving of elements. It is similar to `MoveAction` but is used for moving elements relative
 * to their current position.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `MoveElementRelativeAction`.
 */
export interface MoveElementRelativeAction extends Action {
    kind: typeof MoveElementRelativeAction.KIND;
    /**
     * Specifies the elements to be moved in/out
     */
    elementIds: string[];
    /**
     * Specifies the amount to be moved in the x-axis
     */
    moveX: number;
    /**
     * Specifies the amount to be moved in the y-axis
     */
    moveY: number;
    /**
     * Specifies whether we should snap to the grid
     */
    snap: boolean;
}

export namespace MoveElementRelativeAction {
    export const KIND = 'moveElementRelative';

    export function is(object: any): object is MoveElementRelativeAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { elementIds: string[]; moveX: number; moveY: number; snap?: boolean }): MoveElementRelativeAction {
        return { kind: KIND, snap: true, ...options };
    }
}
