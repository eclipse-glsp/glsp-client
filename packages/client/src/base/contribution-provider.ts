/*******************************************************************************
 * Copyright (c) 2017-2024 TypeFox and others.
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

import { AnyObject, MaybePromise, TYPES } from '@eclipse-glsp/sprotty';
import { interfaces } from 'inversify';
import { Ranked } from './ranked';

/**
 * A `IContributionProvider` allows to retrieve multi-bound services like action handlers, tools, etc.
 * from the injection container. In contrast to direct multi-injection, using a contribution provider allows to defer the retrieval
 * of the services until they are actually needed. This is useful to work around circular dependencies between services.
 * After the first retrieval, the contributions are cached and returned from the cache on subsequent calls. In addition, the provider
 * is typically bound in singleton scope to ensure that all injecting classes receive the same set of contributions.
 *
 */
export interface IContributionProvider {
    /**
     * Receives all contributions (i.e services) that are bound to the given identifier in the container.
     * Will return an empty array if no contributions are found.
     * @serviceIdentifier The identifier of the contributions to retrieve.
     * @param options Additional configuration options.
     *      `recursive`: `true` if the contributions should be collected from the parent containers as well. Otherwise, `false` (default).
     *      `sort`: An optional custom sort function to sort the retrieved contributions.
     */
    getAll<T extends AnyObject>(
        serviceIdentifier: interfaces.ServiceIdentifier<T>,
        options?: { recursive?: boolean; sort?: (a: T, b: T) => number }
    ): T[];

    /**
     * Activates the contributions. This method needs to be called on startup and invokes
     * all registered `@link IContributionsInitializer`s. The diagram loader will invoke this method
     * when the `load` method is called. If you need to activate the contributions before that you can
     * also call this method manually.
     */
    activate(): Promise<void>;
}

export class DefaultContributionProvider implements IContributionProvider {
    protected services = new Map<interfaces.ServiceIdentifier<AnyObject>, AnyObject[]>();
    protected activated = false;

    constructor(protected readonly container: interfaces.Container) {}

    getAll<T extends AnyObject>(
        serviceIdentifier: interfaces.ServiceIdentifier<T>,
        options: { recursive?: boolean; sort?: (a: T, b: T) => number } = { recursive: false }
    ): T[] {
        let services = this.services.get(serviceIdentifier);
        if (services === undefined) {
            const currentServices: T[] = [];
            currentServices.sort();
            let currentContainer: interfaces.Container | undefined = this.container;
            while (currentContainer !== undefined) {
                if (currentContainer.isBound(serviceIdentifier)) {
                    try {
                        currentServices.push(...currentContainer.getAll(serviceIdentifier));
                    } catch (error) {
                        console.error(error);
                    }
                }
                currentContainer = options.recursive === true && currentContainer.parent ? currentContainer.parent : undefined;
            }
            services = options.sort ? currentServices.sort(options.sort) : currentServices;
            this.services.set(serviceIdentifier, services);
        }
        return services as T[];
    }

    async activate(): Promise<void> {
        if (this.activated) {
            return;
        }
        const initializers = this.getAll<IContributionInitializer>(TYPES.IContributionInitializer, { sort: Ranked.sort });
        for (const initializer of initializers) {
            await initializer.initializeContributions(this);
        }
        this.activated = true;
    }
}

export interface IContributionInitializer extends Partial<Ranked> {
    initializeContributions(provider: IContributionProvider): MaybePromise<void>;
}
