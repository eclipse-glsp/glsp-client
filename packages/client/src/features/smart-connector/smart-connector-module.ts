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
import {
    FeatureModule,
    TYPES,
    bindAsService,
    configureActionHandler,
    OpenSmartConnectorAction,
    CloseSmartConnectorAction,
    MoveAction,
    SetBoundsAction,
    SetViewportAction,
    DeleteElementOperation,
    ChangeSmartConnectorStateAction
} from '@eclipse-glsp/sprotty';
import '../../../css/smart-connector.css';
import { SmartConnector, SmartConnectorKeyListener } from './smart-connector';

export const smartConnectorModule = new FeatureModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };
    bindAsService(context, TYPES.IUIExtension, SmartConnector);
    bind(TYPES.IDiagramStartup).toService(SmartConnector);
    configureActionHandler(context, OpenSmartConnectorAction.KIND, SmartConnector);
    configureActionHandler(context, CloseSmartConnectorAction.KIND, SmartConnector);
    configureActionHandler(context, ChangeSmartConnectorStateAction.KIND, SmartConnector);
    configureActionHandler(context, MoveAction.KIND, SmartConnector);
    configureActionHandler(context, SetBoundsAction.KIND, SmartConnector);
    configureActionHandler(context, SetViewportAction.KIND, SmartConnector);
    configureActionHandler(context, DeleteElementOperation.KIND, SmartConnector);
    bindAsService(bind, TYPES.KeyListener, SmartConnectorKeyListener);
});
