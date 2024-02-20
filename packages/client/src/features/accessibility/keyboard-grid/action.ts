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

import { Action, hasObjectProp, Point } from '@eclipse-glsp/sprotty';

export interface EnableKeyboardGridAction extends Action {
    kind: typeof EnableKeyboardGridAction.KIND;
    options: EnableKeyboardGridAction.Options;
}

export namespace EnableKeyboardGridAction {
    export const KIND = 'enableKeyboardGrid';

    export interface Options {
        originId: string;
        triggerActions: Action[];
    }

    export function is(object: any): object is EnableKeyboardGridAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'options');
    }

    export function create(options: Options): EnableKeyboardGridAction {
        return {
            kind: KIND,
            options
        };
    }
}

export interface KeyboardGridCellSelectedAction extends Action {
    kind: typeof KeyboardGridCellSelectedAction.KIND;
    options: KeyboardGridCellSelectedAction.Options;
}

export namespace KeyboardGridCellSelectedAction {
    export const KIND = 'keyboardGridCellSelectedAction';

    export interface Options {
        originId: string;
        cellId: string;
        centerCellPosition: Point;
    }

    export function is(object: any): object is KeyboardGridCellSelectedAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'options');
    }

    export function create(options: Options): KeyboardGridCellSelectedAction {
        return {
            kind: KIND,
            options
        };
    }
}

export interface KeyboardGridKeyboardEventAction extends Action {
    kind: typeof KeyboardGridKeyboardEventAction.KIND;
    options: KeyboardGridKeyboardEventAction.Options;
}

export namespace KeyboardGridKeyboardEventAction {
    export const KIND = 'keyboardGridKeyboardEvent';

    export interface Options {
        originId: string;
        event: KeyboardEvent;
    }

    export function is(object: any): object is KeyboardGridKeyboardEventAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'options');
    }

    export function create(options: Options): KeyboardGridKeyboardEventAction {
        return {
            kind: KIND,
            options
        };
    }
}
