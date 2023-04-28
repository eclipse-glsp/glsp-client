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

import { ContainerConfiguration, initializeContainer } from '@eclipse-glsp/protocol';
import { Container, ContainerModule } from 'inversify';
import {
    buttonModule,
    defaultModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    fadeModule,
    labelEditUiModule,
    modelSourceModule,
    openModule,
    routingModule,
    zorderModule
} from 'sprotty';
import glspBoundsModule from '../features/bounds/di.config';
import glspCommandPaletteModule from '../features/command-palette/di.config';
import glspContextMenuModule from '../features/context-menu/di.config';
import { glspServerCopyPasteModule } from '../features/copy-paste/di.config';
import glspDecorationModule from '../features/decoration/di.config';
import glspEditLabelModule from '../features/edit-label/di.config';
import glspExportModule from '../features/export/di.config';
import modelHintsModule from '../features/hints/di.config';
import glspHoverModule from '../features/hover/di.config';
import layoutModule from '../features/layout/di.config';
import glspMouseToolModule from '../features/mouse-tool/di.config';
import navigationModule from '../features/navigation/di.config';
import glspSelectModule from '../features/select/di.config';
import sourceModelWatcherModule from '../features/source-model-watcher/di.config';
import toolFeedbackModule from '../features/tool-feedback/di.config';
import toolPaletteModule from '../features/tool-palette/di.config';
import { enableDefaultToolsOnFocusLossModule, toolsModule } from '../features/tools/di.config';
import { markerNavigatorModule, validationModule } from '../features/validation/di.config';
import glspViewportModule from '../features/viewport/di.config';
import defaultGLSPModule from './di.config';
import glspMouseMoveModule from '../features/mouse-move/di.config';

export const DEFAULT_MODULES = [
    defaultModule,
    defaultGLSPModule,
    buttonModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    glspExportModule,
    fadeModule,
    glspBoundsModule,
    glspCommandPaletteModule,
    glspContextMenuModule,
    glspDecorationModule,
    glspEditLabelModule,
    glspHoverModule,
    glspMouseToolModule,
    glspSelectModule,
    glspServerCopyPasteModule,
    glspViewportModule,
    labelEditUiModule,
    layoutModule,
    markerNavigatorModule,
    modelHintsModule,
    modelSourceModule,
    sourceModelWatcherModule,
    navigationModule,
    openModule,
    toolPaletteModule,
    routingModule,
    toolFeedbackModule,
    toolsModule,
    enableDefaultToolsOnFocusLossModule,
    validationModule,
    zorderModule,
    glspMouseMoveModule
] as const;

/**
 *  Initializes a GLSP Diagram container with the GLSP default modules and the specified custom `modules`.
 *  Additional modules can be passed as direct arguments or as part of a {@link ModuleConfiguration}.
 *  ```typescript
 *  const container= createDiagramContainer(myModule1, myModule2)
 *  // or
 *  const container= createDiagramContainer({ add: [myModule1, myModule2]})
 *  ```
 *  Default modules can be excluded using {@link ModuleConfiguration}s.
 *  This means, you can still customize the default modules in two ways.
 *
 * First, you can exclude default modules and add a module with your custom code.
 *
 * ```typescript
 * const container = createDiagramContainer({ add:myModelSourceWatcherModule, remove: modelSourceWatcherModule} );
 * ```
 *
 * Second, you can unbind or rebind implementations that are originally bound in one of the default modules.
 *
 * ```typescript
 * rebind(NavigationTargetResolver).to(MyNavigationTargetResolver);
 * ```
 *
 * @param containerConfiguration
 *          Custom modules to be loaded in addition to the default modules and/or default modules that should be excluded.
 * @returns The initialized container.
 */
export function initializeDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeContainer(container, ...DEFAULT_MODULES, ...containerConfiguration);
}

/**
 * Creates a GLSP Client container with the GLSP default modules and the specified custom `modules`.
 *
 * You can still customize the default modules in two ways.
 *
 * First, you can unload default modules and load them again with your custom code.
 *
 * ```typescript
 * const container = createClientContainer(myModule1, myModule2);
 * container.unload(modelSourceWatcherModule);
 * container.load(myModelSourceWatcherModule);
 * ```
 *
 * Second, you can unbind or rebind implementations that are originally bound in one of the default modules.
 *
 * ```typescript
 * rebind(NavigationTargetResolver).to(MyNavigationTargetResolver);
 * ```
 * @param modules Custom modules to be loaded in addition to the default modules.
 * @returns The created container.
 * @deprecated Please use `initializeDiagramContainer` from `@eclipse-glsp/client` instead
 */
export function createClientContainer(...modules: ContainerModule[]): Container {
    return initializeDiagramContainer(new Container(), ...modules);
}
