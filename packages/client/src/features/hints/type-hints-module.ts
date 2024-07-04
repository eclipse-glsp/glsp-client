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
import { FeatureModule, SetTypeHintsAction, TYPES, bindAsService, configureActionHandler, configureCommand } from '@eclipse-glsp/sprotty';
import { ApplyTypeHintsCommand, TypeHintProvider } from './type-hint-provider';

export const typeHintsModule = new FeatureModule(
    (bind, unbind, isBound) => {
        const context = { bind, unbind, isBound };
        bindAsService(context, TYPES.ITypeHintProvider, TypeHintProvider);
        bind(TYPES.IDiagramStartup).toService(TypeHintProvider);
        configureActionHandler(context, SetTypeHintsAction.KIND, TypeHintProvider);
        configureCommand(context, ApplyTypeHintsCommand);
    },
    { featureId: Symbol('typeHints') }
);
