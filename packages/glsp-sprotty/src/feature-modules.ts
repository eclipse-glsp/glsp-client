/********************************************************************************
 * Copyright (c) 2023-2025 EclipseSource and others.
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
import { FeatureModule } from '@eclipse-glsp/protocol/lib/di';
import sprottyDefaultModule from 'sprotty/lib/base/di.config';
import sprottyButtonModule from 'sprotty/lib/features/button/di.config';
import sprottyEdgeIntersectionModule from 'sprotty/lib/features/edge-intersection/di.config';
import sprottyEdgeJunctionModule from 'sprotty/lib/features/edge-junction/di.config';
import sprottyEdgeLayoutModule from 'sprotty/lib/features/edge-layout/di.config';
import { edgeEditModule as sprottyEdgeEditModule } from 'sprotty/lib/features/edit/di.config';
import sprottyExpandModule from 'sprotty/lib/features/expand/di.config';
import sprottyFadeModule from 'sprotty/lib/features/fade/di.config';
import sprottyMoveModule from 'sprotty/lib/features/move/di.config';
import sprottyOpenModule from 'sprotty/lib/features/open/di.config';
import sprottyUpdateModule from 'sprotty/lib/features/update/di.config';
import sprottyModelSourceModule from 'sprotty/lib/model-source/di.config';

export const buttonModule = new FeatureModule(sprottyButtonModule.registry, { featureId: Symbol('button') });
export const edgeEditModule = new FeatureModule(sprottyEdgeEditModule.registry, { featureId: Symbol('edgeEdit') });
export const edgeIntersectionModule = new FeatureModule(sprottyEdgeIntersectionModule.registry, { featureId: Symbol('edgeIntersection') });
export const edgeLayoutModule = new FeatureModule(sprottyEdgeLayoutModule.registry, { featureId: Symbol('edgeLayout') });
export const expandModule = new FeatureModule(sprottyExpandModule.registry, { featureId: Symbol('expand') });
export const fadeModule = new FeatureModule(sprottyFadeModule.registry, { featureId: Symbol('fade') });
export const modelSourceModule = new FeatureModule(sprottyModelSourceModule.registry, { featureId: Symbol('modelSource') });
export const moveModule = new FeatureModule(sprottyMoveModule.registry, { featureId: Symbol('move') });
export const openModule = new FeatureModule(sprottyOpenModule.registry, { featureId: Symbol('open') });
export const updateModule = new FeatureModule(sprottyUpdateModule.registry, { featureId: Symbol('update') });
export const edgeJunctionModule = new FeatureModule(sprottyEdgeJunctionModule.registry, { featureId: Symbol('edgeJunction') });

export { sprottyDefaultModule };
