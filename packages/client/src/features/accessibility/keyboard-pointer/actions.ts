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

export interface SetKeyboardPointerRenderPositionAction extends Action {
    kind: typeof SetKeyboardPointerRenderPositionAction.KIND;
    x: number;
    y: number;
}

export namespace SetKeyboardPointerRenderPositionAction {
    export const KIND = 'setKeyboardPointerRenderPositionAction';

    export function is(object: any): object is SetKeyboardPointerRenderPositionAction {
        return Action.hasKind(object, KIND) && hasNumberProp(object, 'x') && hasNumberProp(object, 'y');
    }

    export function create(x: number, y: number): SetKeyboardPointerRenderPositionAction {
        return { kind: KIND, x, y };
    }
}
