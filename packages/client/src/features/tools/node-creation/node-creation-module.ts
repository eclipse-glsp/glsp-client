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
import {
    FeatureModule,
    TYPES,
    TriggerNodeCreationAction,
    bindAsService,
    configureActionHandler,
    configureModelElement
} from '@eclipse-glsp/sprotty';
import { elementTemplateModule } from '../../element-template/element-template-module';
import { ContainerManager } from './container-manager';
import { InsertIndicator } from './insert-indicator';
import { NodeCreationTool } from './node-creation-tool';
import { InsertIndicatorView } from './node-creation-views';

export const nodeCreationToolModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        bindAsService(context, TYPES.IContainerManager, ContainerManager);
        bindAsService(context, TYPES.ITool, NodeCreationTool);
        configureActionHandler(context, TriggerNodeCreationAction.KIND, NodeCreationTool);
        configureModelElement(context, InsertIndicator.TYPE, InsertIndicator, InsertIndicatorView);
    },
    {
        featureId: Symbol('nodeCreationTool'),
        requires: elementTemplateModule
    }
);
