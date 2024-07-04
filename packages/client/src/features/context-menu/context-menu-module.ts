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
import { ContextMenuProviderRegistry, FeatureModule, IContextMenuService, TYPES, bindAsService } from '@eclipse-glsp/sprotty';
import { GLSPContextMenuMouseListener } from './glsp-context-menu-mouse-listener';
import { ServerContextMenuItemProvider } from './server-context-menu-provider';

export const contextMenuModule = new FeatureModule(
    bind => {
        bind(TYPES.IContextMenuServiceProvider).toProvider<IContextMenuService>(ctx => async () => {
            if (ctx.container.isBound(TYPES.IContextMenuService)) {
                return ctx.container.get<IContextMenuService>(TYPES.IContextMenuService);
            }
            console.warn("'TYPES.IContextMenuService' is not bound. Use no-op implementation instead");
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return { show: () => {} };
        });

        bindAsService(bind, TYPES.MouseListener, GLSPContextMenuMouseListener);
        bind(TYPES.IContextMenuProviderRegistry).to(ContextMenuProviderRegistry);
        bindAsService(bind, TYPES.IContextMenuItemProvider, ServerContextMenuItemProvider);
    },
    { featureId: Symbol('contextMenu') }
);
