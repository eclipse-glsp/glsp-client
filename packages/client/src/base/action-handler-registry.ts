/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { ContributionProvider } from '@eclipse-glsp/protocol/lib/utils/contribution-provider';
import { ActionHandlerRegistration, ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, named } from 'inversify';

@injectable()
export class GLSPActionHandlerRegistry extends ActionHandlerRegistry {
    @inject(ContributionProvider)
    @named(TYPES.ActionHandlerRegistration)
    protected readonly registrations: ContributionProvider<ActionHandlerRegistration>;

    @inject(ContributionProvider)
    @named(TYPES.IActionHandlerInitializer)
    protected readonly initializers: ContributionProvider<IActionHandlerInitializer>;

    protected initialized = false;

    constructor() {
        super([], []);
    }

    protected init(): void {
        if (!this.initialized) {
            this.initialized = true;
            this.registrations.getContributions().forEach(registration => this.register(registration.actionKind, registration.factory()));
            this.initializers.getContributions().forEach(initializer => this.initializeActionHandler(initializer));
        }
    }

    override register(key: string, instance: IActionHandler): void {
        this.init();
        super.register(key, instance);
    }

    override get(key: string): IActionHandler[] {
        this.init();
        return super.get(key);
    }

    override initializeActionHandler(initializer: IActionHandlerInitializer): void {
        this.init();
        super.initializeActionHandler(initializer);
    }

    /**
     * Retrieve a set of all action kinds for which (at least) one
     * handler is registered
     * @returns the set of handled action kinds
     */
    getHandledActionKinds(): string[] {
        this.init();
        return Array.from(this.elements.keys());
    }
}
