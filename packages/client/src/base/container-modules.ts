/********************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
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
import { defaultModule } from 'sprotty';
import {
    boundsModule,
    buttonModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    exportModule,
    fadeModule,
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
    layoutCommandsModule,
    markerNavigatorModule,
    modelHintsModule,
    modelSourceModule,
    modelSourceWatcherModule,
    navigationModule,
    openModule,
    paletteModule,
    routingModule,
    toolFeedbackModule,
    toolsModule,
    validationModule,
    zorderModule
} from '../';
import defaultGLSPModule from './di.config';

export const DEFAULT_MODULES = [
    defaultModule,
    defaultGLSPModule,
    boundsModule,
    buttonModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    exportModule,
    fadeModule,
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
    layoutCommandsModule,
    markerNavigatorModule,
    modelHintsModule,
    modelSourceModule,
    modelSourceWatcherModule,
    navigationModule,
    openModule,
    paletteModule,
    routingModule,
    toolFeedbackModule,
    toolsModule,
    validationModule,
    zorderModule
];

export function createClientContainer(...modules: ContainerModule[]): Container {
    const container = new Container();
    container.load(...DEFAULT_MODULES, ...modules);
    return container;
}
