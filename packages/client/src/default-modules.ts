/********************************************************************************
 * Copyright (c) 2021-2025 EclipseSource and others.
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
    BindingContext,
    ContainerConfiguration,
    FeatureModule,
    TYPES,
    ViewerOptions,
    buttonModule,
    configureViewerOptions,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    fadeModule,
    modelSourceModule,
    resolveContainerConfiguration
} from '@eclipse-glsp/sprotty';
import { Container } from 'inversify';
import { defaultModule } from './base/default.module';
import { IDiagramOptions } from './base/model/diagram-loader';
import { boundsModule } from './features/bounds/bounds-module';
import { resizeModule } from './features/change-bounds/resize/resize-module';
import { commandPaletteModule } from './features/command-palette/command-palette-module';
import { contextMenuModule } from './features/context-menu/context-menu-module';
import { copyPasteModule } from './features/copy-paste/copy-paste-modules';
import { decorationModule } from './features/decoration/decoration-module';
import { elementTemplateModule } from './features/element-template/element-template-module';
import { exportModule } from './features/export/export-modules';
import { typeHintsModule } from './features/hints/type-hints-module';
import { hoverModule } from './features/hover/hover-module';
import { labelEditUiModule } from './features/label-edit-ui/label-edit-ui-module';
import { labelEditModule } from './features/label-edit/label-edit-module';
import { layoutModule } from './features/layout/layout-module';
import { navigationModule } from './features/navigation/navigation-module';
import { routingModule } from './features/routing/routing-module';
import { selectModule } from './features/select/select-module';
import { sourceModelWatcherModule } from './features/source-model-watcher/source-model-watcher-module';
import { statusModule } from './features/status/status-module';
import { svgMetadataModule } from './features/svg-metadata/svg-metadata-module';
import { toolPaletteModule } from './features/tool-palette/tool-palette-module';
import { changeBoundsToolModule } from './features/tools/change-bounds/change-bounds-tool-module';
import { deletionToolModule } from './features/tools/deletion/deletion-tool-module';
import { edgeCreationToolModule } from './features/tools/edge-creation/edege-creation-module';
import { edgeEditToolModule } from './features/tools/edge-edit/edge-edit-module';
import { marqueeSelectionToolModule } from './features/tools/marquee-selection/marquee-selection-module';
import { nodeCreationToolModule } from './features/tools/node-creation/node-creation-module';
import { toolFocusLossModule } from './features/tools/tool-focus-loss-module';
import { markerNavigatorModule, validationModule } from './features/validation/validation-modules';
import { viewportModule } from './features/viewport/viewport-modules';
import { zorderModule } from './features/zorder/zorder-module';

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
    elementTemplateModule,
    nodeCreationToolModule,
    changeBoundsToolModule,
    marqueeSelectionToolModule,
    toolFocusLossModule,
    validationModule,
    zorderModule,
    svgMetadataModule,
    statusModule,
    resizeModule
] as const;

/**
 * Wraps the {@link configureDiagramOptions} utility function in a module. Adopters can either include this
 * module into the container {@link ModuleConfiguration} or configure the container after its creation
 * (e.g. using the {@link configureDiagramOptions} utility function).
 * @param diagramOptions The diagram instance specific configuration options
 * @param viewerOptions Optional {@link ViewerOptions} that should be configured
 * @returns The corresponding {@link FeatureModule}
 */
export function createDiagramOptionsModule(diagramOptions: IDiagramOptions, viewerOptions?: Partial<ViewerOptions>): FeatureModule {
    return new FeatureModule((bind, unbind, isBound, rebind) =>
        configureDiagramOptions({ bind, unbind, isBound, rebind }, diagramOptions, viewerOptions)
    );
}

/**
 * Utility function to bind the diagram instance specific configuration options.
 * In addition to binding the {@link IDiagramOptions} this function also overrides the
 * {@link ViewerOptions} to match the given client id.
 * @param context The binding context
 * @param diagramOptions The {@link IDiagramOptions} that should be bound
 * @param viewerOptions Optional {@link ViewerOptions} that should be configured
 */
export function configureDiagramOptions(
    context: BindingContext,
    diagramOptions: IDiagramOptions,
    viewerOptions?: Partial<ViewerOptions>
): void {
    configureViewerOptions(context, {
        baseDiv: diagramOptions.clientId,
        hiddenDiv: diagramOptions.clientId + '_hidden',
        zoomLimits: { min: 0.1, max: 20 },
        ...viewerOptions
    });
    context.bind(TYPES.IDiagramOptions).toConstantValue(diagramOptions);
}

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
