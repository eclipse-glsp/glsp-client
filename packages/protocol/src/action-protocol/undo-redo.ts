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

import * as sprotty from 'sprotty-protocol/lib/actions';
import { Action } from './base-protocol';
/**
 * Trigger an undo of the latest executed command.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `UndoAction`.
 */
export interface UndoAction extends Omit<sprotty.UndoAction, 'kind'> {
    kind: typeof UndoAction.KIND;
}

export namespace UndoAction {
    export const KIND = 'glspUndo';

    export function is(object: unknown): object is UndoAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): UndoAction {
        return {
            kind: KIND
        };
    }
}

/**
 * Trigger a redo of the latest undone command.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RedoAction`.
 */
export interface RedoAction extends Omit<sprotty.RedoAction, 'kind'> {
    kind: typeof RedoAction.KIND;
}

export namespace RedoAction {
    export const KIND = 'glspRedo';

    export function is(object: unknown): object is RedoAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): RedoAction {
        return {
            kind: KIND
        };
    }
}
