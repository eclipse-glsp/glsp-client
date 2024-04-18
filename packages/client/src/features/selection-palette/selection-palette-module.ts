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
import {
    FeatureModule,
    TYPES,
    bindAsService,
    configureActionHandler,
    MoveAction,
    SetBoundsAction,
    SetViewportAction,
    DeleteElementOperation,
    ChangeBoundsOperation
} from '@eclipse-glsp/sprotty';
import '../../../css/selection-palette.css';
import { SelectionPalette, SelectionPaletteKeyListener } from './selection-palette';
import { ChangeSelectionPaletteStateAction } from './selection-palette-actions';

export const selectionPaletteModule = new FeatureModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bindAsService(context, TYPES.IUIExtension, SelectionPalette);
    bind(TYPES.IDiagramStartup).toService(SelectionPalette);
    configureActionHandler(context, ChangeSelectionPaletteStateAction.KIND, SelectionPalette);
    configureActionHandler(context, MoveAction.KIND, SelectionPalette);
    configureActionHandler(context, SetBoundsAction.KIND, SelectionPalette);
    configureActionHandler(context, SetViewportAction.KIND, SelectionPalette);
    configureActionHandler(context, DeleteElementOperation.KIND, SelectionPalette);
    configureActionHandler(context, ChangeBoundsOperation.KIND, SelectionPalette);
    bindAsService(bind, TYPES.KeyListener, SelectionPaletteKeyListener);
});
