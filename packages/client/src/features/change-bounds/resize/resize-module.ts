/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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

import { FeatureModule, TYPES, bindAsService, configureActionHandler } from '@eclipse-glsp/sprotty';
import { DefaultResizeKeyListener, DefaultResizeKeyTool } from './resize-default-tool';
import { ResizeElementAction, ResizeElementHandler } from './resize-handler';
import { ResizeKeyListener, ResizeKeyTool } from './resize-tool';

/**
 * Handles resize actions.
 */
export const resizeModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureActionHandler(context, ResizeElementAction.KIND, ResizeElementHandler);
    },
    { featureId: Symbol('resize') }
);

/**
 * Feature module that is intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 */
export const standaloneResizeModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };

        bindAsService(context, TYPES.IDefaultTool, DefaultResizeKeyTool);
        context.bind(DefaultResizeKeyListener).toSelf();
        bindAsService(context, TYPES.ITool, ResizeKeyTool);
        context.bind(ResizeKeyListener).toSelf();
    },
    { featureId: Symbol('standaloneResize'), requires: resizeModule }
);
