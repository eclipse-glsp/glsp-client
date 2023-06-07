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
import { bindAsService, configureCommand, configureView, LocationPostprocessor, MoveCommand } from '~glsp-sprotty';
import { TYPES } from '../../glsp-sprotty/types';
import { SResizeHandle } from '../change-bounds/model';
import { HideChangeBoundsToolResizeFeedbackCommand, ShowChangeBoundsToolResizeFeedbackCommand } from './change-bounds-tool-feedback';
import { DrawFeedbackEdgeCommand, FeedbackEdgeEnd, RemoveFeedbackEdgeCommand } from './creation-tool-feedback';
import { ModifyCssFeedbackCommand } from './css-feedback';
import {
    DrawFeedbackEdgeSourceCommand,
    HideEdgeReconnectHandlesFeedbackCommand,
    ShowEdgeReconnectHandlesFeedbackCommand,
    SwitchRoutingModeCommand
} from './edge-edit-tool-feedback';
import { FeedbackActionDispatcher } from './feedback-action-dispatcher';
import { DrawMarqueeCommand, RemoveMarqueeCommand } from './marquee-tool-feedback';
import { FeedbackEdgeEndView, SResizeHandleView } from './view';

const toolFeedbackModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };
    bind(TYPES.IFeedbackActionDispatcher).to(FeedbackActionDispatcher).inSingletonScope();

    configureCommand(context, ModifyCssFeedbackCommand);

    // create node and edge tool feedback
    configureCommand(context, DrawFeedbackEdgeCommand);
    configureCommand(context, RemoveFeedbackEdgeCommand);

    configureCommand(context, DrawMarqueeCommand);
    configureCommand(context, RemoveMarqueeCommand);

    configureView(context, FeedbackEdgeEnd.TYPE, FeedbackEdgeEndView);
    // move tool feedback: we use sprotty's MoveCommand as client-side visual feedback
    configureCommand(context, MoveCommand);

    // resize tool feedback
    configureCommand(context, ShowChangeBoundsToolResizeFeedbackCommand);
    configureCommand(context, HideChangeBoundsToolResizeFeedbackCommand);
    configureView(context, SResizeHandle.TYPE, SResizeHandleView);

    // reconnect edge tool feedback
    configureCommand(context, ShowEdgeReconnectHandlesFeedbackCommand);
    configureCommand(context, HideEdgeReconnectHandlesFeedbackCommand);
    configureCommand(context, DrawFeedbackEdgeSourceCommand);

    configureCommand(context, SwitchRoutingModeCommand);

    bindAsService(context, TYPES.IVNodePostprocessor, LocationPostprocessor);
    bind(TYPES.HiddenVNodePostprocessor).toService(LocationPostprocessor);
});

export default toolFeedbackModule;
