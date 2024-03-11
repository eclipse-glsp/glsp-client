/*******************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 * Modifications: (c) 2024 EclipseSource and others.
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
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
 *******************************************************************************/
// eslint-disable-next-line max-len
// based on https://github.com/eclipse-theia/theia/blob/9ff0cedff1d591b0eb4be97a05f6d992789d0a24/packages/core/src/common/contribution-provider.ts

import { interfaces } from 'inversify';
import { BindingContext } from './di-util';

export const ContributionProvider = Symbol('ContributionProvider');

export interface ContributionProvider<T extends object> {
    /**
     * @param recursive `true` if the contributions should be collected from the parent containers as well. Otherwise, `false`.
     * It is `false` by default.
     */
    getContributions(recursive?: boolean): T[];
}

class ContainerBasedContributionProvider<T extends object> implements ContributionProvider<T> {
    protected services: T[] | undefined;

    constructor(
        protected readonly serviceIdentifier: interfaces.ServiceIdentifier<T>,
        protected readonly container: interfaces.Container
    ) {}

    getContributions(recursive?: boolean): T[] {
        if (this.services === undefined) {
            const currentServices: T[] = [];
            let currentContainer: interfaces.Container | undefined = this.container;
            while (currentContainer !== undefined) {
                if (currentContainer.isBound(this.serviceIdentifier)) {
                    try {
                        currentServices.push(...currentContainer.getAll(this.serviceIdentifier));
                    } catch (error) {
                        console.error(error);
                    }
                }
                currentContainer = recursive === true && currentContainer.parent ? currentContainer.parent : undefined;
            }
            this.services = currentServices;
        }
        return this.services;
    }
}

export function bindContributionProvider(context: Pick<BindingContext, 'bind'> | interfaces.Bind, id: symbol): void {
    const bind = typeof context === 'object' ? context.bind.bind(context) : context;
    bind(ContributionProvider)
        .toDynamicValue(ctx => new ContainerBasedContributionProvider(id, ctx.container))
        .inSingletonScope()
        .whenTargetNamed(id);
}
