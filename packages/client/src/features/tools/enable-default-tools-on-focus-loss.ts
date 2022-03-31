/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
import { Action } from '@eclipse-glsp/protocol';
import { injectable } from 'inversify';
import { EnableDefaultToolsAction, IActionHandler, ICommand } from 'sprotty';
import { FocusStateChangedAction } from '../../base/actions/focus-change-action';

/**
 * Action handler that enables the default tools when the diagram lost focus.
 * @see FocusTracker
 * @see FocusStateChangedAction
 */
@injectable()
export class EnableDefaultToolsOnFocusLossHandler implements IActionHandler {
    handle(action: Action): void | Action | ICommand {
        if (FocusStateChangedAction.is(action) && !action.hasFocus) {
            return EnableDefaultToolsAction.create();
        }
    }
}
