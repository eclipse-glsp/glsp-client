/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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
import { ContainerModule } from 'inversify';
import { BindingContext, TYPES, bindAsService } from '@eclipse-glsp/sprotty';
import { PositionNavigator } from './position-navigator';
import { LocalElementNavigator } from './local-element-navigator';
import { ElementNavigatorTool } from './diagram-navigation-tool';
import '../../../../css/navigation.css';

/**
 * Handles element navigation actions.
 */

export const glspElementNavigationModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    configureElementNavigationTool(context);
});

export function configureElementNavigationTool(context: BindingContext): void {
    bindAsService(context, TYPES.IDefaultTool, ElementNavigatorTool);
    bindAsService(context, TYPES.IElementNavigator, PositionNavigator);
    bindAsService(context, TYPES.ILocalElementNavigator, LocalElementNavigator);
}
