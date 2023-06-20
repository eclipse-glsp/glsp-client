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
import { ContainerModule } from 'inversify';
import { bindAsService, configureActionHandler, EnableDefaultToolsAction, TYPES } from '~glsp-sprotty';
import '../../../css/tool-palette.css';
import { EnableToolPaletteAction, ToolPalette } from './tool-palette';

const toolPaletteModule = new ContainerModule((bind, _unbind, isBound, _rebind) => {
    bindAsService(bind, TYPES.IUIExtension, ToolPalette);
    configureActionHandler({ bind, isBound }, EnableToolPaletteAction.KIND, ToolPalette);
    configureActionHandler({ bind, isBound }, EnableDefaultToolsAction.KIND, ToolPalette);
});

export default toolPaletteModule;
