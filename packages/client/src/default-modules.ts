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

import { Container, ContainerModule } from 'inversify';
import {
    ContainerConfiguration,
    FeatureModule,
    buttonModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    fadeModule,
    labelEditUiModule,
    modelSourceModule,
    resolveContainerConfiguration,
    zorderModule
} from '~glsp-sprotty';
import { defaultModule } from './base/default.module';
import { boundsModule } from './features/bounds/bounds-module';
import { commandPaletteModule } from './features/command-palette/command-palette-module';
import { contextMenuModule } from './features/context-menu/context-menu-module';
import { copyPasteModule } from './features/copy-paste/copy-paste-modules';
import { decorationModule } from './features/decoration/decoration-module';
import { exportModule } from './features/export/export-modules';
import { typeHintsModule } from './features/hints/type-hints-module';
import { hoverModule } from './features/hover/hover-module';
import { labelEditModule } from './features/label-edit/label-edit-module';
import { layoutModule } from './features/layout/layout-module';
import { navigationModule } from './features/navigation/navigation-module';
import { routingModule } from './features/routing/routing-module';
import { selectModule } from './features/select/select-module';
import { sourceModelWatcherModule } from './features/source-model-watcher/source-model-wacher-module';
import { statusModule } from './features/status/status-module';
import { svgMetadataModule } from './features/svg-metadata/svg-metadata-module';
import { toolPaletteModule } from './features/tool-palette/tool-palette-module';
import { changeBoundsToolModule } from './features/tools/change-bounds/change-boounds-tool-module';
import { deletionToolModule } from './features/tools/deletion/deletion-tool-module';
import { edgeCreationToolModule } from './features/tools/edge-creation/edege-creation-module';
import { edgeEditToolModule } from './features/tools/edge-edit/edge-edit-module';
import { marqueeSelectionToolModule } from './features/tools/marquee-selection/marquee-selection-module';
import { nodeCreationToolModule } from './features/tools/node-creation/node-creation-module';
import { toolFocusLossModule } from './features/tools/tool-focus-loss-module';
import { markerNavigatorModule, validationModule } from './features/validation/validation-modules';
import { viewportModule } from './features/viewport/viewport-modules';

export const DEFAULT_MODULES = [
    defaultModule,
    buttonModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    exportModule,
    fadeModule,
    boundsModule,
    commandPaletteModule,
    contextMenuModule,
    decorationModule,
    labelEditModule,
    hoverModule,
    selectModule,
    copyPasteModule,
    viewportModule,
    labelEditUiModule,
    layoutModule,
    markerNavigatorModule,
    typeHintsModule,
    modelSourceModule,
    sourceModelWatcherModule,
    navigationModule,
    routingModule,
    toolPaletteModule,
    edgeCreationToolModule,
    edgeEditToolModule,
    deletionToolModule,
    nodeCreationToolModule,
    changeBoundsToolModule,
    marqueeSelectionToolModule,
    toolFocusLossModule,
    validationModule,
    zorderModule,
    svgMetadataModule,
    statusModule
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
 * @param container The container that should be initialized
 * @param containerConfigurations
 *          Custom modules to be loaded in addition to the default modules and/or default modules that should be excluded.
 * @throws An error if the first module to load is not the `defaultModule` (or an equivalent custom replacement module)
 * @returns The initialized container.
 */
export function initializeDiagramContainer(container: Container, ...containerConfigurations: ContainerConfiguration): Container {
    const modules = resolveContainerConfiguration(...DEFAULT_MODULES, ...containerConfigurations);
    // The `defaultModule` (or a custom replacement module with the same `featureId`) should be the first module that is
    // loaded into the container
    const firstModule = modules[0];
    if (!firstModule || !(firstModule instanceof FeatureModule && firstModule.featureId === defaultModule.featureId)) {
        throw new Error(
            'Invalid module configuration. The first module to load should be the `defaultModule` (or an equivalent replacement module)'
        );
    }
    container.load(...modules);
    return container;
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
