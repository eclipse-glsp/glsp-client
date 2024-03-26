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

import { BindingContext, IUIExtension, MaybePromise, SprottyUIExtensionRegistry, TYPES, bindOrRebind } from '@eclipse-glsp/sprotty';
import { decorate, injectable, unmanaged } from 'inversify';
import { IContributionInitializer, IContributionProvider } from './contribution-provider';

@injectable()
export class UIExtensionRegistry extends SprottyUIExtensionRegistry implements IContributionInitializer {
    constructor() {
        super([]);
    }

    initializeContributions(provider: IContributionProvider): MaybePromise<void> {
        provider.getAll<IUIExtension>(TYPES.IUIExtension).forEach(extension => this.register(extension.id(), extension));
    }
}

let baseClassDecorated = false;
export function bindUIExtensionRegistry(context: Omit<BindingContext, 'unbind'>): void {
    context.bind(UIExtensionRegistry).toSelf().inSingletonScope();
    bindOrRebind(context, TYPES.UIExtensionRegistry).toService(UIExtensionRegistry);
    context.bind(TYPES.IContributionInitializer).toService(UIExtensionRegistry);
    if (!baseClassDecorated) {
        decorate(unmanaged(), SprottyUIExtensionRegistry, 0);
        baseClassDecorated = true;
    }
}
