/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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
import { BindingContext, FeatureModule, TYPES, bindAsService } from '@eclipse-glsp/sprotty';
import '../../../../css/navigation.css';
import { ElementNavigatorTool } from './diagram-navigation-tool';
import { LocalElementNavigator } from './local-element-navigator';
import { PositionNavigator } from './position-navigator';

/**
 * Handles element navigation actions.
 */

export const elementNavigationModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureElementNavigationTool(context);
    },
    { featureId: Symbol('elementNavigation') }
);

export function configureElementNavigationTool(context: BindingContext): void {
    bindAsService(context, TYPES.IDefaultTool, ElementNavigatorTool);
    bindAsService(context, TYPES.IElementNavigator, PositionNavigator);
    bindAsService(context, TYPES.ILocalElementNavigator, LocalElementNavigator);
}

export {
    /** Deprecated use {@link elementNavigationModule} instead */
    elementNavigationModule as glspElementNavigationModule
};
