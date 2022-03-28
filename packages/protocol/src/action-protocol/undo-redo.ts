/********************************************************************************
 * Copyright (c) 2021-2022 STMicroelectronics and others.
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

import { Operation } from './base-protocol';

/**
 * Trigger an undo of the latest executed command.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `UndoOperations`.
 */
export interface UndoOperation extends Operation {
    kind: typeof UndoOperation.KIND;
}

export namespace UndoOperation {
    export const KIND = 'glspUndo';

    export function is(object: any): object is UndoOperation {
        return Operation.hasKind(object, KIND);
    }

    export function create(): UndoOperation {
        return {
            kind: KIND,
            isOperation: true
        };
    }
}

/**
 * Trigger a redo of the latest undone command.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `RedoOperations`.
 */
export interface RedoOperation extends Operation {
    kind: typeof RedoOperation.KIND;
}

export namespace RedoOperation {
    export const KIND = 'glspRedo';

    export function is(object: any): object is RedoOperation {
        return Operation.hasKind(object, KIND);
    }

    export function create(): RedoOperation {
        return {
            kind: KIND,
            isOperation: true
        };
    }
}
