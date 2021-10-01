/********************************************************************************
 * Copyright (c) 2019-2021 EclipseSource and others.
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
import { Action, KeyListener, SModelRoot } from 'sprotty';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';

export class SaveModelAction implements Action {
    static readonly KIND = 'saveModel';
    constructor(public readonly fileUri?: string, public readonly kind: string = SaveModelAction.KIND) {}
}

export function isSaveModelAction(action: Action): action is SaveModelAction {
    return action.kind === SaveModelAction.KIND;
}

export class SaveModelKeyboardListener extends KeyListener {
    keyDown(_element: SModelRoot, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyS', 'ctrlCmd')) {
            return [new SaveModelAction()];
        }
        return [];
    }
}
