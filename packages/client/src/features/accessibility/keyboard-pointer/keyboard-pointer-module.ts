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
import {
    BindingContext,
    FeatureModule,
    TYPES,
    TriggerEdgeCreationAction,
    TriggerNodeCreationAction,
    bindAsService,
    configureActionHandler
} from '@eclipse-glsp/sprotty';
import { SetEdgeTargetSelectionAction } from '../edge-autocomplete/action';
import { EdgeAutocompletePalette } from '../edge-autocomplete/edge-autocomplete-palette';
import { EdgeAutocompletePaletteTool } from '../edge-autocomplete/edge-autocomplete-tool';
import { GlobalKeyListenerTool } from '../global-keylistener-tool';
import { EnableKeyboardGridAction, KeyboardGridCellSelectedAction } from '../keyboard-grid/action';
import { KeyboardGrid } from '../keyboard-grid/keyboard-grid';
import { GridSearchPalette } from '../keyboard-grid/keyboard-grid-search-palette';
import { KeyboardNodeGrid } from '../keyboard-grid/keyboard-node-grid';
import { SetKeyboardPointerRenderPositionAction } from './actions';
import { KeyboardPointer } from './keyboard-pointer';

/**
 * Handles the pointer used via grid to position new elements.
 */
export const keyboardControlModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureKeyboardControlTools(context);
    },
    { featureId: Symbol('keyboardControl') }
);

export function configureKeyboardControlTools(context: BindingContext): void {
    bindAsService(context, TYPES.IDefaultTool, GlobalKeyListenerTool);
    bindAsService(context, TYPES.IUIExtension, KeyboardPointer);
    bindAsService(context, TYPES.IUIExtension, KeyboardGrid);
    bindAsService(context, TYPES.IUIExtension, KeyboardNodeGrid);

    configureActionHandler(context, TriggerNodeCreationAction.KIND, KeyboardPointer);
    configureActionHandler(context, SetKeyboardPointerRenderPositionAction.KIND, KeyboardPointer);

    bindAsService(context, TYPES.IUIExtension, EdgeAutocompletePalette);
    bindAsService(context, TYPES.IDefaultTool, EdgeAutocompletePaletteTool);

    configureActionHandler(context, EnableKeyboardGridAction.KIND, KeyboardGrid);
    configureActionHandler(context, KeyboardGridCellSelectedAction.KIND, KeyboardPointer);

    configureActionHandler(context, TriggerEdgeCreationAction.KIND, EdgeAutocompletePalette);
    configureActionHandler(context, SetEdgeTargetSelectionAction.KIND, EdgeAutocompletePalette);

    bindAsService(context, TYPES.IUIExtension, GridSearchPalette);
}
