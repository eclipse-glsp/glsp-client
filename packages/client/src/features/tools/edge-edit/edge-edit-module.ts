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
import { FeatureModule, TYPES, bindAsService, configureCommand } from '@eclipse-glsp/sprotty';
import { configureDanglingFeedbackEdge } from '../edge-creation/dangling-edge-feedback';
import { EdgeEditTool } from './edge-edit-tool';
import {
    DrawFeedbackEdgeSourceCommand,
    HideEdgeReconnectHandlesFeedbackCommand,
    ShowEdgeReconnectHandlesFeedbackCommand,
    SwitchRoutingModeCommand
} from './edge-edit-tool-feedback';

export const edgeEditToolModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        bindAsService(context, TYPES.IDefaultTool, EdgeEditTool);

        // reconnect edge tool feedback
        configureCommand(context, ShowEdgeReconnectHandlesFeedbackCommand);
        configureCommand(context, HideEdgeReconnectHandlesFeedbackCommand);
        configureCommand(context, DrawFeedbackEdgeSourceCommand);
        configureCommand(context, SwitchRoutingModeCommand);

        // dangling edge feedback
        configureDanglingFeedbackEdge(context);
    },
    { featureId: Symbol('edgeEditTool') }
);
