/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { Action, KeyListener, RedoAction, GModelElement, UndoAction, isMac, matchesKeystroke } from '@eclipse-glsp/sprotty';

/**
 * Key listener that listens to the typical keyboard shortcuts for undo/redo and dispatches the corresponding actions.
 */
export class GLSPUndoRedoKeyListener extends KeyListener {
    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyZ', 'ctrlCmd')) {
            return [UndoAction.create()];
        }
        if (matchesKeystroke(event, 'KeyZ', 'ctrlCmd', 'shift') || (!isMac() && matchesKeystroke(event, 'KeyY', 'ctrlCmd'))) {
            return [RedoAction.create()];
        }
        return [];
    }
}
