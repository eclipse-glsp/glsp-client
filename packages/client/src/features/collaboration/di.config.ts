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
import {
    bindAsService,
    DisposeSubclientAction,
    MouseMoveAction,
    SetViewportAction,
    ViewportBoundsChangeAction
} from '@eclipse-glsp/protocol';
import { ContainerModule } from 'inversify';
import {
    configureActionHandler,
    configureCommand, configureModelElement, InitializeCanvasBoundsAction,
    TYPES
} from 'sprotty';
import {DrawMousePointerCommand, MOUSE_POINTER, MouseMoveListener, DrawMousePointerProvider, RemoveMousePointerCommand} from './mouse-move';
import {MousePointer, ViewportRect} from './model';
import { MousePointerView } from './mouse-pointer-view';
import {
    DrawViewportRectCommand,
    DrawViewportRectProvider,
    RemoveViewportRectCommand, VIEWPORT_RECT,
    ViewportBoundsChangeTool
} from './viewport-bounds-change';
import {ViewportRectView} from './viewport-rect-view';

const glspMouseMoveModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };

    bindAsService(context, TYPES.MouseListener, MouseMoveListener);
    configureActionHandler(context, SetViewportAction.KIND, MouseMoveListener);

    bind(DrawMousePointerProvider).toSelf().inSingletonScope();
    configureActionHandler(context, MouseMoveAction.KIND, DrawMousePointerProvider);
    configureActionHandler(context, DisposeSubclientAction.KIND, DrawMousePointerProvider);

    configureCommand(context, DrawMousePointerCommand);
    configureCommand(context, RemoveMousePointerCommand);
    configureModelElement(context, MOUSE_POINTER, MousePointer, MousePointerView);

    ///

    bind(ViewportBoundsChangeTool).toSelf().inSingletonScope();
    configureActionHandler(context, InitializeCanvasBoundsAction.KIND, ViewportBoundsChangeTool);
    configureActionHandler(context, SetViewportAction.KIND, ViewportBoundsChangeTool);

    bind(DrawViewportRectProvider).toSelf().inSingletonScope();
    configureActionHandler(context, ViewportBoundsChangeAction.KIND, DrawViewportRectProvider);
    configureActionHandler(context, DisposeSubclientAction.KIND, DrawViewportRectProvider);

    configureCommand(context, DrawViewportRectCommand);
    configureCommand(context, RemoveViewportRectCommand);
    configureModelElement(context, VIEWPORT_RECT, ViewportRect, ViewportRectView);

});

export default glspMouseMoveModule;
