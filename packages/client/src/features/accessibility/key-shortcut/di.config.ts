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

import { ContainerModule } from 'inversify';
import { bindAsService, BindingContext, configureActionHandler, TYPES } from '@eclipse-glsp/sprotty';
import '../../../../css/key-shortcut.css';
import { KeyShortcutUIExtension, SetAccessibleKeyShortcutAction } from './accessible-key-shortcut';
import { AccessibleKeyShortcutTool } from './accessible-key-shortcut-tool';

/**
 * Handles actions for displaying help/information about keyboard shortcuts.
 */
export const glspShortcutHelpModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureShortcutHelpTool(context);
});

export function configureShortcutHelpTool(context: BindingContext): void {
    bindAsService(context, TYPES.IDefaultTool, AccessibleKeyShortcutTool);
    bindAsService(context, TYPES.IUIExtension, KeyShortcutUIExtension);
    configureActionHandler(context, SetAccessibleKeyShortcutAction.KIND, KeyShortcutUIExtension);
}
