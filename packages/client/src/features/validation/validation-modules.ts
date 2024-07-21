/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { FeatureModule, SetMarkersAction, TYPES, bindAsService, configureActionHandler, configureCommand } from '@eclipse-glsp/sprotty';
import {
    GModelElementComparator,
    LeftToRightTopToBottomComparator,
    MarkerNavigator,
    MarkerNavigatorContextMenuItemProvider,
    MarkerNavigatorKeyListener,
    NavigateToMarkerAction,
    NavigateToMarkerActionHandler
} from './marker-navigator';
import { ApplyMarkersCommand, DeleteMarkersCommand, SetMarkersActionHandler, ValidationFeedbackEmitter } from './validate';

export const validationModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        configureActionHandler(context, SetMarkersAction.KIND, SetMarkersActionHandler);
        configureCommand(context, ApplyMarkersCommand);
        configureCommand(context, DeleteMarkersCommand);
        bind(ValidationFeedbackEmitter).toSelf().inSingletonScope();
    },
    { featureId: Symbol('validation') }
);

export const markerNavigatorModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        bind(GModelElementComparator).to(LeftToRightTopToBottomComparator).inSingletonScope();
        bind(MarkerNavigator).toSelf().inSingletonScope();
        configureActionHandler({ bind, isBound }, NavigateToMarkerAction.KIND, NavigateToMarkerActionHandler);
    },
    { featureId: Symbol('markerNavigator') }
);

/**
 * Feature module that is intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 */
export const standaloneMarkerNavigatorModule = new FeatureModule(
    bind => {
        bindAsService(bind, TYPES.IContextMenuProvider, MarkerNavigatorContextMenuItemProvider);
        bindAsService(bind, TYPES.KeyListener, MarkerNavigatorKeyListener);
    },
    { featureId: Symbol('standaloneMarkerNavigator'), requires: markerNavigatorModule }
);
