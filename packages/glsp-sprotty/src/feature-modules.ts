/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
/* eslint-disable no-restricted-imports */

import { FeatureModule, bindOrRebind } from '@eclipse-glsp/protocol';
import { EditLabelUI as SprottyEditLabelUI } from 'sprotty';
import sprottyDefaultModule from 'sprotty/lib/base/di.config';
import sprottyButtonModule from 'sprotty/lib/features/button/di.config';
import sprottyEdgeIntersectionModule from 'sprotty/lib/features/edge-intersection/di.config';
import sprottyEdgeLayoutModule from 'sprotty/lib/features/edge-layout/di.config';
import {
    edgeEditModule as sprottyEdgeEditModule,
    labelEditUiModule as sprottyLabelEditUiModule
} from 'sprotty/lib/features/edit/di.config';
import sprottyExpandModule from 'sprotty/lib/features/expand/di.config';
import sprottyFadeModule from 'sprotty/lib/features/fade/di.config';
import sprottyMoveModule from 'sprotty/lib/features/move/di.config';
import sprottyOpenModule from 'sprotty/lib/features/open/di.config';
import sprottyUpdateModule from 'sprotty/lib/features/update/di.config';
import sprottyZorderModule from 'sprotty/lib/features/zorder/di.config';
import sprottyModelSourceModule from 'sprotty/lib/model-source/di.config';
import { EditLabelUI } from './ui-extension-override';

export const buttonModule = new FeatureModule(sprottyButtonModule.registry);
export const edgeEditModule = new FeatureModule(sprottyEdgeEditModule.registry);
export const edgeIntersectionModule = new FeatureModule(sprottyEdgeIntersectionModule.registry);
export const edgeLayoutModule = new FeatureModule(sprottyEdgeLayoutModule.registry);
export const expandModule = new FeatureModule(sprottyExpandModule.registry);
export const fadeModule = new FeatureModule(sprottyFadeModule.registry);
export const modelSourceModule = new FeatureModule(sprottyModelSourceModule.registry);
export const moveModule = new FeatureModule(sprottyMoveModule.registry);
export const openModule = new FeatureModule(sprottyOpenModule.registry);
export const updateModule = new FeatureModule(sprottyUpdateModule.registry);
export const zorderModule = new FeatureModule(sprottyZorderModule.registry);

export const labelEditUiModule = new FeatureModule((bind, unbind, isBound, rebind, ...rest) => {
    const context = { bind, unbind, isBound, rebind };
    sprottyLabelEditUiModule.registry(bind, unbind, isBound, rebind, ...rest);
    bind(EditLabelUI).toSelf().inSingletonScope();
    bindOrRebind(context, SprottyEditLabelUI).toService(EditLabelUI);
});

export { sprottyDefaultModule };
