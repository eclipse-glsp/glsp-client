/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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
import '../../../../css/keyboard-tool-palette.css';

import {
    BindingContext,
    FeatureModule,
    SetModelAction,
    TYPES,
    UpdateModelAction,
    bindAsService,
    configureActionHandler
} from '@eclipse-glsp/sprotty';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { EnableToolPaletteAction } from '../../tool-palette/tool-palette';
import { FocusDomAction } from '../actions';
import { KeyboardToolPalette } from './keyboard-tool-palette';

export const keyboardToolPaletteModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureKeyboardToolPaletteTool(context);
    },
    { featureId: Symbol('keyboardToolPalette') }
);

export function configureKeyboardToolPaletteTool(context: BindingContext): void {
    bindAsService(context, TYPES.IUIExtension, KeyboardToolPalette);
    context.bind(TYPES.IDiagramStartup).toService(KeyboardToolPalette);
    configureActionHandler(context, EnableDefaultToolsAction.KIND, KeyboardToolPalette);
    configureActionHandler(context, FocusDomAction.KIND, KeyboardToolPalette);
    configureActionHandler(context, EnableToolPaletteAction.KIND, KeyboardToolPalette);
    configureActionHandler(context, UpdateModelAction.KIND, KeyboardToolPalette);
    configureActionHandler(context, SetModelAction.KIND, KeyboardToolPalette);
}
