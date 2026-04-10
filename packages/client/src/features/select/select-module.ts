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
import { FeatureModule, SelectKeyboardListener, TYPES, bindAsService, configureCommand } from '@eclipse-glsp/sprotty';
import { SelectAllCommand, SelectCommand } from '../../base/selection-service';
import { SelectFeedbackCommand } from './select-feedback-command';
import { RankedSelectMouseListener } from './select-mouse-listener';

export const selectModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        configureCommand(context, SelectCommand);
        configureCommand(context, SelectAllCommand);
        configureCommand(context, SelectFeedbackCommand);
        bindAsService(context, TYPES.MouseListener, RankedSelectMouseListener);
    },
    { featureId: Symbol('select') }
);

/**
 * Feature module that is intended for the standalone deployment of GLSP (i.e. plain webapp)
 * When integrated into an application frame (e.g Theia/VS Code) this module is typically omitted and/or replaced
 * with an application native module.
 */
export const standaloneSelectModule = new FeatureModule(
    bind => {
        bindAsService(bind, TYPES.KeyListener, SelectKeyboardListener);
    },
    { featureId: Symbol('standaloneSelect'), requires: selectModule }
);
