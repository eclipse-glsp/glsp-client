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
import { createWorkflowDiagramContainer } from '@eclipse-glsp-examples/workflow-glsp';
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
import '../../css/diagram.css';
import { standaloneTaskEditorModule } from './features/direct-task-editing/standalone-task-editor-module';
import { getParameters } from './url-parameters';
export default function createContainer(options: IDiagramOptions): Container {
    const parameters = getParameters();
    if (parameters.readonly) {
        options.editMode = EditMode.READONLY;
    }
    const container = createWorkflowDiagramContainer(
        createDiagramOptionsModule(options),
        {
            add: [standaloneTaskEditorModule, accessibilityModule],
            remove: toolPaletteModule
        },
        STANDALONE_MODULE_CONFIG
    );
    bindOrRebind(container, TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    bindOrRebind(container, TYPES.LogLevel).toConstantValue(LogLevel.warn);
    container.bind(TYPES.IMarqueeBehavior).toConstantValue({ entireEdge: true, entireElement: true });
    return container;
}
