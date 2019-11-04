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
import { ContainerModule } from "inversify";
import { configureActionHandler, configureCommand } from "sprotty/lib";

import { GLSP_TYPES } from "../../types";
import { SetTypeHintsAction } from "./action-definition";
import { ApplyEditConfigCommand, TypeHintsEditConfigProvider } from "./type-hints-action-initializer";

const modelHintsModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(TypeHintsEditConfigProvider).toSelf().inSingletonScope();
    configureActionHandler({ bind, isBound }, SetTypeHintsAction.KIND, TypeHintsEditConfigProvider);
    bind(GLSP_TYPES.IEditConfigProvider).toService(TypeHintsEditConfigProvider);
    configureCommand({ bind, isBound }, ApplyEditConfigCommand);
});

export default modelHintsModule;
