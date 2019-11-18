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
import { TYPES } from "sprotty/lib";

import { GLSP_TYPES } from "../../types";
import { IContextMenuService } from "./context-menu-service";
import { ContextMenuProviderRegistry } from "./menu-providers";
import { ContextMenuMouseListener } from "./mouse-listener";
import { ServerContextMenuItemProvider } from "./server-context-menu-provider";

const glspContextMenuModule = new ContainerModule(bind => {
    bind(GLSP_TYPES.IContextMenuServiceProvider).toProvider<IContextMenuService>(ctx => {
        return () => {
            return new Promise<IContextMenuService>((resolve, reject) => {
                if (ctx.container.isBound(GLSP_TYPES.IContextMenuService)) {
                    resolve(ctx.container.get<IContextMenuService>(GLSP_TYPES.IContextMenuService));
                } else {
                    reject();
                }
            });
        };
    });
    bind(TYPES.MouseListener).to(ContextMenuMouseListener);
    bind(GLSP_TYPES.IContextMenuProviderRegistry).to(ContextMenuProviderRegistry);
    bind(GLSP_TYPES.IContextMenuProvider).to(ServerContextMenuItemProvider);
});

export default glspContextMenuModule;
