/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
    ActionHandlerRegistration,
    ActionHandlerRegistry,
    BindingContext,
    IActionHandlerInitializer,
    TYPES,
    bindOrRebind
} from '@eclipse-glsp/sprotty';
import { decorate, inject, injectable, unmanaged } from 'inversify';
import { IContributionProvider } from './contribution-provider';

@injectable()
export class GLSPActionHandlerRegistry extends ActionHandlerRegistry {
    @inject(TYPES.IContributionProvider)
    protected contributionProvider: IContributionProvider;

    protected initialized = false;

    constructor() {
        super([], []);
    }
    /**
     * Retrieve a set of all action kinds for which (at least) one
     * handler is registered
     * @returns the set of handled action kinds
     */
    getHandledActionKinds(): string[] {
        return Array.from(this.elements.keys());
    }

    initialize(): void {
        if (this.initialized) {
            return;
        }

        this.contributionProvider
            .getAll<ActionHandlerRegistration>(TYPES.ActionHandlerRegistration)
            .forEach(registration => this.register(registration.actionKind, registration.factory()));
        this.contributionProvider
            .getAll<IActionHandlerInitializer>(TYPES.IActionHandlerInitializer)
            .forEach(initializer => this.initializeActionHandler(initializer));
    }
}

let baseClassDecorated = false;
export function bindActionHandlerRegistry(context: Omit<BindingContext, 'unbind'>): void {
    context.bind(GLSPActionHandlerRegistry).toSelf().inSingletonScope();
    bindOrRebind(context, ActionHandlerRegistry).toService(GLSPActionHandlerRegistry);
    if (!baseClassDecorated) {
        decorate(unmanaged(), ActionHandlerRegistry, 0);
        decorate(unmanaged(), ActionHandlerRegistry, 1);
        baseClassDecorated = true;
    }
}
