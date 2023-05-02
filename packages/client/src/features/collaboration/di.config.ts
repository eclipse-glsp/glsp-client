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
    bindAsService, DefaultTypes,
    DisposeSubclientAction,
    MouseMoveAction,
    SelectionChangeAction,
    SetViewportAction,
    ViewportBoundsChangeAction
} from '@eclipse-glsp/protocol';
import { ContainerModule } from 'inversify';
import {
    configureActionHandler,
    configureCommand, configureModelElement, InitializeCanvasBoundsAction
} from 'sprotty';
import {MouseMoveTool, DrawMousePointerProvider} from './mouse-move/mouse-move';
import {MousePointer, SelectionIcon, ViewportRect} from './model';
import { MousePointerView } from './mouse-move/mouse-pointer-view';
import {
    DrawViewportRectProvider,
    ViewportBoundsChangeTool
} from './viewport-bounds-change/viewport-bounds-change';
import {ViewportRectView} from './viewport-bounds-change/viewport-rect-view';
import {SelectionChangeTool, SelectionIconProvider} from './selection-change/selection-change';
import {TYPES} from '../../base/types';
import {SelectionIconView} from './selection-change/selection-icon-view';
import {DrawMousePointerCommand, RemoveMousePointerCommand} from './mouse-move/mouse-move-commands';
import {DrawViewportRectCommand, RemoveViewportRectCommand} from './viewport-bounds-change/viewport-bounds-change-commands';
import {DrawSelectionIconCommand, RemoveSelectionIconCommand} from './selection-change/selection-change-commands';

const glspMouseMoveModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };

    bindAsService(context, TYPES.IDefaultTool, MouseMoveTool);
    configureActionHandler(context, SetViewportAction.KIND, MouseMoveTool);

    bind(DrawMousePointerProvider).toSelf().inSingletonScope();
    configureActionHandler(context, MouseMoveAction.KIND, DrawMousePointerProvider);
    configureActionHandler(context, DisposeSubclientAction.KIND, DrawMousePointerProvider);

    configureCommand(context, DrawMousePointerCommand);
    configureCommand(context, RemoveMousePointerCommand);
    configureModelElement(context, DefaultTypes.MOUSE_POINTER, MousePointer, MousePointerView);

    ///

    bind(ViewportBoundsChangeTool).toSelf().inSingletonScope();
    configureActionHandler(context, InitializeCanvasBoundsAction.KIND, ViewportBoundsChangeTool);
    configureActionHandler(context, SetViewportAction.KIND, ViewportBoundsChangeTool);

    bind(DrawViewportRectProvider).toSelf().inSingletonScope();
    configureActionHandler(context, ViewportBoundsChangeAction.KIND, DrawViewportRectProvider);
    configureActionHandler(context, DisposeSubclientAction.KIND, DrawViewportRectProvider);

    configureCommand(context, DrawViewportRectCommand);
    configureCommand(context, RemoveViewportRectCommand);
    configureModelElement(context, DefaultTypes.VIEWPORT_RECT, ViewportRect, ViewportRectView);

    ///

    bindAsService(context, TYPES.IDefaultTool, SelectionChangeTool);

    bind(SelectionIconProvider).toSelf().inSingletonScope();
    configureActionHandler(context, SelectionChangeAction.KIND, SelectionIconProvider);
    configureActionHandler(context, DisposeSubclientAction.KIND, SelectionIconProvider);

    configureCommand(context, DrawSelectionIconCommand);
    configureCommand(context, RemoveSelectionIconCommand);
    configureModelElement(context, DefaultTypes.SELECTION_ICON, SelectionIcon, SelectionIconView);
});

export default glspMouseMoveModule;
