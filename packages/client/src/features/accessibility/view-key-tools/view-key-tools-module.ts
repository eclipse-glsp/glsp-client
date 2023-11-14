/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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

import { bindAsService, BindingContext, configureActionHandler, FeatureModule, TYPES } from '@eclipse-glsp/sprotty';
import { DeselectKeyTool } from './deselect-key-tool';
import { MovementKeyTool } from './movement-key-tool';
import { ZoomKeyTool } from './zoom-key-tool';
import { KeyboardGridCellSelectedAction, KeyboardGridKeyboardEventAction } from '../keyboard-grid/action';

export const viewKeyToolsModule = new FeatureModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, isBound, rebind };
    configureViewKeyTools(context);
});

export function configureViewKeyTools(context: Pick<BindingContext, 'bind' | 'isBound'>): void {
    bindAsService(context, TYPES.IDefaultTool, MovementKeyTool);
    bindAsService(context, TYPES.IDefaultTool, ZoomKeyTool);
    configureActionHandler(context, KeyboardGridCellSelectedAction.KIND, ZoomKeyTool);
    configureActionHandler(context, KeyboardGridKeyboardEventAction.KIND, ZoomKeyTool);
    bindAsService(context, TYPES.IDefaultTool, DeselectKeyTool);
}
