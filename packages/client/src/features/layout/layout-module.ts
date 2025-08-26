/********************************************************************************
 * Copyright (c) 2019-2025 EclipseSource and others.
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
import { FeatureModule, TriggerLayoutAction, configureActionHandler } from '@eclipse-glsp/sprotty';
import {
    AlignElementsAction,
    AlignElementsActionHandler,
    ResizeElementsAction,
    ResizeElementsActionHandler
} from './layout-elements-action';
import { TriggerLayoutActionHandler } from './trigger-layout-action-handler';

export const layoutModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        configureActionHandler(context, ResizeElementsAction.KIND, ResizeElementsActionHandler);
        configureActionHandler(context, AlignElementsAction.KIND, AlignElementsActionHandler);
        configureActionHandler(context, TriggerLayoutAction.KIND, TriggerLayoutActionHandler);
    },
    { featureId: Symbol('layout') }
);
