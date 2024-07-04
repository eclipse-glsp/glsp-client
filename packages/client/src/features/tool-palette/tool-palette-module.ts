/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { bindAsService, configureActionHandler, FeatureModule, SetModelAction, TYPES, UpdateModelAction } from '@eclipse-glsp/sprotty';
import '../../../css/tool-palette.css';
import { EnableDefaultToolsAction } from '../../base/tool-manager/tool';
import { ToolPalette } from './tool-palette';

export const toolPaletteModule = new FeatureModule(
    (bind, _unbind, isBound, _rebind) => {
        bindAsService(bind, TYPES.IUIExtension, ToolPalette);
        bind(TYPES.IDiagramStartup).toService(ToolPalette);
        configureActionHandler({ bind, isBound }, EnableDefaultToolsAction.KIND, ToolPalette);
        configureActionHandler({ bind, isBound }, UpdateModelAction.KIND, ToolPalette);
        configureActionHandler({ bind, isBound }, SetModelAction.KIND, ToolPalette);
    },
    { featureId: Symbol('toolPalette') }
);
