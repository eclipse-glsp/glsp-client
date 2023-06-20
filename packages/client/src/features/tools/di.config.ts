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
import {
    bindAsService,
    BindingContext,
    bindOrRebind,
    configureActionHandler,
    configureModelElement,
    ManhattanEdgeRouter,
    TriggerEdgeCreationAction,
    TriggerNodeCreationAction,
    TYPES
} from '~glsp-sprotty';
import { FocusStateChangedAction } from '../../base/actions/focus-change-action';
import { MARQUEE } from '../tool-feedback/marquee-tool-feedback';
import { ChangeBoundsTool } from './change-bounds-tool';
import { DelKeyDeleteTool, MouseDeleteTool } from './delete-tool';
import { EdgeCreationTool } from './edge-creation-tool';
import { EdgeEditTool } from './edge-edit-tool';
import { EnableDefaultToolsOnFocusLossHandler } from './enable-default-tools-on-focus-loss';
import { GLSPManhattanEdgeRouter } from './glsp-manhattan-edge-router';
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
    const context = { bind, isBound, rebind };
    // Register default tools
    bindAsService(context, TYPES.IDefaultTool, ChangeBoundsTool);
    bindAsService(context, TYPES.IDefaultTool, EdgeEditTool);
    bindAsService(context, TYPES.IDefaultTool, DelKeyDeleteTool);

    // Register  tools
    bindAsService(context, TYPES.ITool, MouseDeleteTool);
    bindAsService(context, TYPES.ITool, NodeCreationTool);
    bindAsService(context, TYPES.ITool, EdgeCreationTool);

    configureMarqueeTool(context);
    configureActionHandler(context, TriggerNodeCreationAction.KIND, NodeCreationTool);
    configureActionHandler(context, TriggerEdgeCreationAction.KIND, EdgeCreationTool);

    bind(GLSPManhattanEdgeRouter).toSelf().inSingletonScope();
    bindOrRebind(context, ManhattanEdgeRouter).toService(GLSPManhattanEdgeRouter);
});

export function configureMarqueeTool(context: Pick<BindingContext, 'bind' | 'isBound'>): void {
    configureModelElement(context, MARQUEE, MarqueeNode, MarqueeView);
    bindAsService(context, TYPES.IDefaultTool, MarqueeTool);
    bindAsService(context, TYPES.ITool, MarqueeMouseTool);
}

/**
 * Enables the default tools in the tool manager if the diagram looses focus.
 */
export const enableDefaultToolsOnFocusLossModule = new ContainerModule((bind, _unbind, isBound) => {
    configureActionHandler({ bind, isBound }, FocusStateChangedAction.KIND, EnableDefaultToolsOnFocusLossHandler);
});
