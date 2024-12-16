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

import { getServiceIdentifierAsString, interfaces } from 'inversify';
import { MaybeArray } from '../utils/array-util';
import { AnyObject } from '../utils/type-util';
import { BindingContext } from './inversify-util';

/**
 * The lazy injector can be used to retrieve services from the container in deferred fashion.
 * Instead of directly injecting the service, the service provider can be injected and used to retrieve the service
 * at a later point when it is actually needed. Services are cached after the first retrieval.
 *
 * The lazy injector bound in transient scope. This means each injecting class gets its own instance.
 *
 * This can be used in places where eager injection via decorator would lead to circular dependency issues.
 * For example if injecting the following service causes a circular dependency:
 * ```ts
 * @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
 * ```
 * You can use the lazy injector to resolve the dependency issue as follows:
 *
 * ```ts
 * @inject(LazyInjector) protected lazyInjector: LazyInjector;
 * get actionDispatcher(): IActionDispatcher {
 *    return this.lazyInjector.get(TYPES.IActionDispatcher);
 * }
 * ```
 *
 * Use the lazy injector with caution. In general direct constructor or property injection is always preferred.
 * The lazy injector should only be used in cases where direct injection is not possible due to circular dependencies.
 * Also keep in mind that the lazy injector should not be accessed in the constructor or `@postConstruct` method of a class.
 * This would defeat the purpose of the lazy injector and lead to the same circular dependency issues.
 */
export interface LazyInjector {
    /**
     * Retrieves the service for the given identifier from the container.
     * Use this method to retrieve services that you would annotate with `@inject(...)` when using normal eager injection.
     * @throws An error if the service is not bound in or multiple services are bound to the identifier.
     * @param serviceIdentifier The service identifier to retrieve the service for.
     */
    get<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T;
    /**
     * Retrieves the service for the given identifier from the container. If the service is not bound `undefined` will be returned
     * Use this method to retrieve services that you would annotate with `@inject(...)@optional` when using normal eager injection.
     * @throws An error if multiple services are bound to the identifier.
     * @param serviceIdentifier The service identifier to retrieve the service for.
     */
    getOptional<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T | undefined;

    /**
     * Retrieves all services for the given service identifier from the container. If the service is not bound an empty array
     * will be returned.
     * Use this method to retrieve services that you would annotate with `@multiInject(...)@optional()` when using normal eager injection.
     * @param serviceIdentifier The service identifier to retrieve the services for.
     */
    getAll<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T[];
}
export const LazyInjector = Symbol('LazyInjector');

/**
 * Default implementation of the {@link LazyInjector} interface. This implementation
 * will be bound when using the {@link bindLazyInjector} function.
 */

export class DefaultLazyInjector implements LazyInjector {
    protected cache = new Map<interfaces.ServiceIdentifier<AnyObject>, MaybeArray<AnyObject> | undefined>();

    constructor(protected readonly container: interfaces.Container) {}

    get<T extends object>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
        const service = this.getOptional(serviceIdentifier);
        if (service === undefined) {
            throw new Error('No matching bindings found for serviceIdentifier:' + getServiceIdentifierAsString(serviceIdentifier));
        }
        return service;
    }

    getOptional<T extends object>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T | undefined {
        if (this.cache.has(serviceIdentifier)) {
            return this.cache.get(serviceIdentifier) as T | undefined;
        }

        const service = this.container.isBound(serviceIdentifier) ? this.container.get<T>(serviceIdentifier) : undefined;
        this.cache.set(serviceIdentifier, service);
        return service;
    }

    getAll<T extends object>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T[] {
        if (this.cache.has(serviceIdentifier)) {
            return this.cache.get(serviceIdentifier) as T[];
        }
        const services = this.container.isBound(serviceIdentifier) ? this.container.getAll<T>(serviceIdentifier) : [];
        this.cache.set(serviceIdentifier, services);
        return services;
    }
}

export function bindLazyInjector(context: Pick<BindingContext, 'bind'> | interfaces.Bind): void {
    const bind = typeof context === 'object' ? context.bind.bind(context) : context;
    bind(LazyInjector).toDynamicValue(ctx => new DefaultLazyInjector(ctx.container));
}
