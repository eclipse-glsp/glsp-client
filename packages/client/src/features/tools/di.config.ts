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
import { TriggerEdgeCreationAction, TriggerNodeCreationAction } from '@eclipse-glsp/protocol';
import { ContainerModule, interfaces } from 'inversify';
import { configureActionHandler, configureModelElement, ManhattanEdgeRouter } from 'sprotty';
import { FocusStateChangedAction } from '../../base/actions/focus-change-action';
import { TYPES } from '../../base/types';
import { MARQUEE } from '../tool-feedback/marquee-tool-feedback';
import { ChangeBoundsTool } from './change-bounds-tool';
import { DelKeyDeleteTool, MouseDeleteTool } from './delete-tool';
import { EdgeCreationTool } from './edge-creation-tool';
import { EdgeEditTool } from './edge-edit-tool';
import { EnableDefaultToolsOnFocusLossHandler } from './enable-default-tools-on-focus-loss';
import { GSLPManhattanEdgeRouter } from './glsp-manhattan-edge-router';
import { MarqueeMouseTool } from './marquee-mouse-tool';
import { MarqueeTool } from './marquee-tool';
import { MarqueeNode } from './model';
import { NodeCreationTool } from './node-creation-tool';
import { MarqueeView } from './view';

/**
 * Registers the default tools of GLSP (node and edge creation, changing bounds, edge editing, deletion)
 * and adds the marquee selection tool.
 */
export const toolsModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    // Register default tools
    bind(TYPES.IDefaultTool).to(ChangeBoundsTool);
    bind(TYPES.IDefaultTool).to(EdgeEditTool);
    bind(TYPES.IDefaultTool).to(DelKeyDeleteTool);

    // Register  tools
    bind(TYPES.ITool).to(MouseDeleteTool);
    bind(NodeCreationTool).toSelf().inSingletonScope();
    bind(EdgeCreationTool).toSelf().inSingletonScope();
    bind(TYPES.ITool).toService(EdgeCreationTool);
    bind(TYPES.ITool).toService(NodeCreationTool);

    configureMarqueeTool({ bind, isBound });
    configureActionHandler({ bind, isBound }, TriggerNodeCreationAction.KIND, NodeCreationTool);
    configureActionHandler({ bind, isBound }, TriggerEdgeCreationAction.KIND, EdgeCreationTool);

    bind(GSLPManhattanEdgeRouter).toSelf().inSingletonScope();
    rebind(ManhattanEdgeRouter).toService(GSLPManhattanEdgeRouter);
});

export function configureMarqueeTool(context: { bind: interfaces.Bind; isBound: interfaces.IsBound }): void {
    configureModelElement(context, MARQUEE, MarqueeNode, MarqueeView);
    context.bind(TYPES.IDefaultTool).to(MarqueeTool);
    context.bind(TYPES.ITool).to(MarqueeMouseTool);
}

/**
 * Enables the default tools in the tool manager if the diagram looses focus.
 */
export const enableDefaultToolsOnFocusLossModule = new ContainerModule((bind, _unbind, isBound) => {
    configureActionHandler({ bind, isBound }, FocusStateChangedAction.KIND, EnableDefaultToolsOnFocusLossHandler);
});
