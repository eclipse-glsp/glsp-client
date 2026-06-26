/********************************************************************************
 * Copyright (c) 2019-2026 EclipseSource and others.
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
import { createGModelDemoDiagramContainer } from '@eclipse-glsp-examples/gmodel-demo-glsp';
import { GridDefaultVisible, createWorkflowDiagramContainer } from '@eclipse-glsp-examples/workflow-glsp';
import {
    ConsoleLogger,
    EditMode,
    IDiagramOptions,
    LogLevel,
    STANDALONE_MODULE_CONFIG,
    TYPES,
    accessibilityModule,
    bindOrRebind,
    createDiagramOptionsModule,
    toolPaletteModule
} from '@eclipse-glsp/client';
import { Container } from 'inversify';
import '../../css/app.css';
import { standaloneContextMenuModule } from './features/context-menu/standalone-context-menu-module';
import { standaloneTaskEditorModule } from './features/direct-task-editing/standalone-task-editor-module';
import { hasParameter } from './url-parameters';

export default function createContainer(options: IDiagramOptions): Container {
    if (hasParameter('readonly')) {
        options.editMode = EditMode.READONLY;
    }
    const container = options.diagramType === 'gmodel-demo' ? createGModelDemoContainer(options) : createWorkflowContainer(options);
    bindOrRebind(container, TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    bindOrRebind(container, TYPES.LogLevel).toConstantValue(LogLevel.warn);
    container.bind(TYPES.IMarqueeBehavior).toConstantValue({ entireEdge: true, entireElement: true });
    bindOrRebind(container, GridDefaultVisible).toConstantValue(hasParameter('grid'));
    return container;
}

function createWorkflowContainer(options: IDiagramOptions): Container {
    return createWorkflowDiagramContainer(
        createDiagramOptionsModule(options),
        {
            add: [standaloneTaskEditorModule, accessibilityModule, standaloneContextMenuModule],
            remove: toolPaletteModule
        },
        STANDALONE_MODULE_CONFIG
    );
}

function createGModelDemoContainer(options: IDiagramOptions): Container {
    // The gmodel-demo language is load-and-interact only, so the workflow-specific task editor and
    // the creation tool palette are left out. The app-shell features (title bar, window resizer)
    // live outside the container and attach via DiagramShellFeature.connect, so they are not listed.
    return createGModelDemoDiagramContainer(
        createDiagramOptionsModule(options),
        {
            add: [accessibilityModule, standaloneContextMenuModule],
            remove: toolPaletteModule
        },
        STANDALONE_MODULE_CONFIG
    );
}
