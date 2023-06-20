/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
import {
    bindAsService,
    CenterCommand,
    CenterKeyboardListener,
    configureActionHandler,
    configureCommand,
    EnableDefaultToolsAction,
    EnableToolsAction,
    FitToScreenCommand,
    GetViewportCommand,
    SetViewportCommand,
    TYPES,
    ZoomMouseListener
} from '~glsp-sprotty';
import { GLSPScrollMouseListener } from './glsp-scroll-mouse-listener';

const glspViewportModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };
    configureCommand(context, CenterCommand);
    configureCommand(context, FitToScreenCommand);
    configureCommand(context, GetViewportCommand);
    configureCommand(context, SetViewportCommand);

    bindAsService(context, TYPES.KeyListener, CenterKeyboardListener);
    bindAsService(context, TYPES.MouseListener, ZoomMouseListener);
    bindAsService(context, TYPES.MouseListener, GLSPScrollMouseListener);

    configureActionHandler(context, EnableToolsAction.KIND, GLSPScrollMouseListener);
    configureActionHandler(context, EnableDefaultToolsAction.KIND, GLSPScrollMouseListener);
});

export default glspViewportModule;
