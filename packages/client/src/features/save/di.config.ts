/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { bindAsService } from '@eclipse-glsp/protocol';
import { ContainerModule } from 'inversify';
import { TYPES } from '../../base/types';
import { SaveModelKeyboardListener } from './save-keylistener';

/**
 * This module is not required the diagram is deployed in Theia with the `GLSPDiagramWidget`
 * but only intended to be used in a standalone deployment of GLSP.
 */
const saveModule = new ContainerModule(bind => {
    bindAsService(bind, TYPES.KeyListener, SaveModelKeyboardListener);
});

export default saveModule;
