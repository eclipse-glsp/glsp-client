/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import "../../css/glsp-sprotty.css";

import { ContainerModule } from "inversify";
import { configureActionHandler, configureCommand, SetModelCommand, TYPES } from "sprotty";

import { GLSPCommandStack } from "./command-stack";
import { EditorContextService } from "./editor-context";
import { FeedbackAwareUpdateModelCommand, SetModelActionHandler } from "./model/update-model-command";
import { SelectionClearingMouseListener } from "./selection-clearing-mouse-listener";
import { GLSPToolManager } from "./tool-manager/glsp-tool-manager";

const defaultGLSPModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, _unbind, isBound, rebind };
    bind(EditorContextService).toSelf().inSingletonScope();

    // Model update initialization ------------------------------------
    configureCommand(context, FeedbackAwareUpdateModelCommand);
    configureActionHandler(context, SetModelCommand.KIND, SetModelActionHandler);

    bind(TYPES.MouseListener).to(SelectionClearingMouseListener);

    rebind(TYPES.ICommandStack).to(GLSPCommandStack);
    rebind(TYPES.IToolManager).to(GLSPToolManager).inSingletonScope();
});

export default defaultGLSPModule;
