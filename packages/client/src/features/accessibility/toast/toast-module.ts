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
import { bindAsService, BindingContext, configureActionHandler, FeatureModule, TYPES } from '@eclipse-glsp/sprotty';
import '../../../../css/toast.css';
import { HideToastAction, ShowToastMessageAction } from './toast-handler';
import { Toast } from './toast-tool';

/**
 * Handles toast/user notification actions.
 */

export const toastModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureToastTool(context);
    },
    { featureId: Symbol('toast') }
);

export function configureToastTool(context: BindingContext): void {
    bindAsService(context, TYPES.IUIExtension, Toast);
    context.bind(TYPES.IDiagramStartup).toService(Toast);
    configureActionHandler(context, ShowToastMessageAction.KIND, Toast);
    configureActionHandler(context, HideToastAction.KIND, Toast);
}

export {
    /** Deprecated use {@link toastModule} instead */
    toastModule as glspToastModule
};
