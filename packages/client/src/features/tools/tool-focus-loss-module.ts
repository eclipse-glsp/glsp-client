/********************************************************************************
 * Copyright (c) 2022-2024 EclipseSource and others.
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
import { Action, FeatureModule, IActionHandler, ICommand, configureActionHandler } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { FocusStateChangedAction } from '../../base/focus/focus-state-change-action';
import { EnableDefaultToolsAction } from '../../base/tool-manager/tool';

/**
 * Action handler that enables the default tools when the diagram lost focus.
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

/**
 * Enables the default tools in the tool manager if the diagram looses focus.
 */
export const toolFocusLossModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        configureActionHandler({ bind, isBound }, FocusStateChangedAction.KIND, EnableDefaultToolsOnFocusLossHandler);
    },
    { featureId: Symbol('toolFocusLoss ') }
);
