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

import { IUIExtension, LazyInjector, MaybePromise, TYPES, UIExtensionRegistry } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { IDiagramStartup } from '../model/diagram-loader';

@injectable()
export class GLSPUIExtensionRegistry extends UIExtensionRegistry implements IDiagramStartup {
    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    constructor(@optional() extensions: IUIExtension[] = []) {
        super(extensions);
    }

    preLoadDiagram(): MaybePromise<void> {
        this.lazyInjector.getAll<IUIExtension>(TYPES.IUIExtension).forEach(extension => this.register(extension.id(), extension));
    }
}
