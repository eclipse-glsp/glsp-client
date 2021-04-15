/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import '../css/diagram.css';
import 'balloon-css/balloon.min.css';
import 'sprotty/css/edit-label.css';

import {
    boundsModule,
    buttonModule,
    configureDefaultModelElement,
    configureModelElement,
    ConsoleLogger,
    defaultGLSPModule,
    defaultModule,
    DefaultTypes,
    DeleteElementContextMenuItemProvider,
    DiamondNodeView,
    edgeLayoutModule,
    editLabelFeature,
    expandModule,
    exportModule,
    fadeModule,
    GLSP_TYPES,
    glspCommandPaletteModule,
    glspContextMenuModule,
    glspDecorationModule,
    glspEditLabelModule,
    glspHoverModule,
    glspMouseToolModule,
    glspSelectModule,
    glspServerCopyPasteModule,
    glspViewportModule,
    GridSnapper,
    labelEditUiModule,
    layoutCommandsModule,
    LogLevel,
    markerNavigatorModule,
    modelHintsModule,
    modelSourceModule,
    modelSourceWatcherModule,
    navigationModule,
    NoOverlapMovmentRestrictor,
    openModule,
    overrideViewerOptions,
    paletteModule,
    RevealNamedElementActionProvider,
    routingModule,
    SCompartment,
    SCompartmentView,
    SEdge,
    SLabel,
    SLabelView,
    toolFeedbackModule,
    toolsModule,
    TYPES,
    validationModule,
    zorderModule
} from '@eclipse-glsp/client';
import { Container, ContainerModule } from 'inversify';

import { directTaskEditor } from './direct-task-editing/di.config';
import { ActivityNode, Icon, TaskNode, WeightedEdge } from './model';
import { ForkOrJoinNodeView, IconView, TaskNodeView, WeightedEdgeView, WorkflowEdgeView } from './workflow-views';

const workflowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    bind(GLSP_TYPES.IMovementRestrictor).to(NoOverlapMovmentRestrictor).inSingletonScope();
    bind(TYPES.ISnapper).to(GridSnapper);
    bind(TYPES.ICommandPaletteActionProvider).to(RevealNamedElementActionProvider);
    bind(TYPES.IContextMenuItemProvider).to(DeleteElementContextMenuItemProvider);
    const context = { bind, unbind, isBound, rebind };

    configureDefaultModelElement(context);
    configureModelElement(context, 'task:automated', TaskNode, TaskNodeView);
    configureModelElement(context, 'task:manual', TaskNode, TaskNodeView);
    configureModelElement(context, 'label:heading', SLabel, SLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'comp:comp', SCompartment, SCompartmentView);
    configureModelElement(context, 'comp:header', SCompartment, SCompartmentView);
    configureModelElement(context, 'label:icon', SLabel, SLabelView);
    configureModelElement(context, DefaultTypes.EDGE, SEdge, WorkflowEdgeView);
    configureModelElement(context, 'edge:weighted', WeightedEdge, WeightedEdgeView);
    configureModelElement(context, 'icon', Icon, IconView);
    configureModelElement(context, 'activityNode:merge', ActivityNode, DiamondNodeView);
    configureModelElement(context, 'activityNode:decision', ActivityNode, DiamondNodeView);
    configureModelElement(context, 'activityNode:fork', ActivityNode, ForkOrJoinNodeView);
    configureModelElement(context, 'activityNode:join', ActivityNode, ForkOrJoinNodeView);
});

export default function createContainer(widgetId: string): Container {
    const container = new Container();

    container.load(defaultModule, defaultGLSPModule, glspMouseToolModule, validationModule, glspSelectModule, boundsModule, glspViewportModule, toolsModule,
        glspHoverModule, fadeModule, exportModule, expandModule, openModule, buttonModule, modelSourceModule, labelEditUiModule, glspEditLabelModule,
        workflowDiagramModule, toolFeedbackModule, modelHintsModule, glspContextMenuModule, glspServerCopyPasteModule, modelSourceWatcherModule,
        glspCommandPaletteModule, paletteModule, routingModule, glspDecorationModule, edgeLayoutModule, zorderModule,
        layoutCommandsModule, directTaskEditor, navigationModule, markerNavigatorModule);

    overrideViewerOptions(container, {
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });

    return container;
}
