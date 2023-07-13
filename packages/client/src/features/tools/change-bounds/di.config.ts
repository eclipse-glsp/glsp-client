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
import { TYPES, bindAsService, configureCommand, configureView } from '~glsp-sprotty';
import { SResizeHandle } from '../../../features/change-bounds/model';
import { ChangeBoundsTool } from './change-bounds-tool';
import { HideChangeBoundsToolResizeFeedbackCommand, ShowChangeBoundsToolResizeFeedbackCommand } from './change-bounds-tool-feedback';
import { SResizeHandleView } from './view';

const changeBoundsToolModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bindAsService(context, TYPES.IDefaultTool, ChangeBoundsTool);
    configureCommand(context, ShowChangeBoundsToolResizeFeedbackCommand);
    configureCommand(context, HideChangeBoundsToolResizeFeedbackCommand);
    configureView(context, SResizeHandle.TYPE, SResizeHandleView);
});

export default changeBoundsToolModule;
