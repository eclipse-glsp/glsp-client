/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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

import { FeatureModule, TYPES, bindAsService, configureActionHandler, configureCommand } from '@eclipse-glsp/sprotty';
import '../../../css/debug.css';
import { DebugBoundsDecorator } from './debug-bounds-decorator';
import { DebugManager } from './debug-manager';
import { EnableDebugModeAction, EnableDebugModeCommand } from './debug-model';

export const debugModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };

        configureCommand(context, EnableDebugModeCommand);

        bindAsService(context, TYPES.IDebugManager, DebugManager);
        configureActionHandler(context, EnableDebugModeAction.KIND, DebugManager);

        bindAsService(context, TYPES.IVNodePostprocessor, DebugBoundsDecorator);
    },
    { featureId: Symbol('debug') }
);
