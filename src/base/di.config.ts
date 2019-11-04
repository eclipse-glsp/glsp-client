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
import { configureActionHandler, configureCommand, SetModelCommand, Tool, TYPES } from "sprotty/lib";

import { SetOperationsAction } from "../features/operation/set-operations";
import { GLSP_TYPES } from "../types";
import { GLSPCommandStack } from "./command-stack";
import { FeedbackAwareUpdateModelCommand, SetModelActionHandler } from "./model/update-model-command";
import { createToolFactory, GLSPToolManagerActionHandler } from "./tool-manager/tool-manager-action-handler";


const defaultGLSPModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, _unbind, isBound, rebind };
    // Tool manager initialization ------------------------------------
    configureActionHandler(context, SetOperationsAction.KIND, GLSPToolManagerActionHandler);
    bind(GLSP_TYPES.IToolFactory).toFactory<Tool>((createToolFactory()));

    // Model update initialization ------------------------------------
    configureCommand(context, FeedbackAwareUpdateModelCommand);
    configureActionHandler(context, SetModelCommand.KIND, SetModelActionHandler);

    rebind(TYPES.ICommandStack).to(GLSPCommandStack);
});

export default defaultGLSPModule;
