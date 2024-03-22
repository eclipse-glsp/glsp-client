/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { BindingContext, IUIExtension, LazyInjector, MaybePromise, TYPES, UIExtensionRegistry, bindOrRebind } from '@eclipse-glsp/sprotty';
import { decorate, inject, injectable, unmanaged } from 'inversify';
import { IDiagramStartup } from './model';

@injectable()
export class GLSPUIExtensionRegistry extends UIExtensionRegistry implements IDiagramStartup {
    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    constructor() {
        super([]);
    }

    preLoadDiagram(): MaybePromise<void> {
        this.lazyInjector.getAll<IUIExtension>(TYPES.IUIExtension).forEach(extension => this.register(extension.id(), extension));
    }
}

let baseClassDecorated = false;
export function bindUIExtensionRegistry(context: Omit<BindingContext, 'unbind'>): void {
    context.bind(GLSPUIExtensionRegistry).toSelf().inSingletonScope();
    bindOrRebind(context, TYPES.UIExtensionRegistry).toService(GLSPUIExtensionRegistry);
    context.bind(TYPES.IDiagramStartup).toService(GLSPUIExtensionRegistry);
    if (!baseClassDecorated) {
        decorate(unmanaged(), UIExtensionRegistry, 0);
        baseClassDecorated = true;
    }
}
