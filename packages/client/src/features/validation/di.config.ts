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
import { bindAsService, SetMarkersAction } from '@eclipse-glsp/protocol';
import { ContainerModule } from 'inversify';
import { configureActionHandler, configureCommand } from 'sprotty';
import { TYPES } from '../../base/types';
import {
    LeftToRightTopToBottomComparator,
    MarkerNavigator,
    MarkerNavigatorContextMenuItemProvider,
    MarkerNavigatorKeyListener,
    NavigateToMarkerAction,
    NavigateToMarkerActionHandler,
    SModelElementComparator
} from './marker-navigator';
import { ApplyMarkersCommand, DeleteMarkersCommand, SetMarkersActionHandler, ValidationFeedbackEmitter } from './validate';

export const validationModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };
    configureActionHandler(context, SetMarkersAction.KIND, SetMarkersActionHandler);
    configureCommand(context, ApplyMarkersCommand);
    configureCommand(context, DeleteMarkersCommand);
    bind(ValidationFeedbackEmitter).toSelf().inSingletonScope();
});

export const markerNavigatorModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(SModelElementComparator).to(LeftToRightTopToBottomComparator).inSingletonScope();
    bind(MarkerNavigator).toSelf().inSingletonScope();
    configureActionHandler({ bind, isBound }, NavigateToMarkerAction.KIND, NavigateToMarkerActionHandler);
});

/**
 * This module is not required if the diagram is deployed in Theia but only intended to be used
 * in a standalone deployment of GLSP. If the GLSP diagram is in Theia use the Theia-native
 * `registerMarkerNavigationCommands()` in `glsp-theia-integration` instead.
 */
export const markerNavigatorContextMenuModule = new ContainerModule(bind => {
    bindAsService(bind, TYPES.IContextMenuProvider, MarkerNavigatorContextMenuItemProvider);
    bindAsService(bind, TYPES.KeyListener, MarkerNavigatorKeyListener);
});
