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

import { AnyObject } from '@eclipse-glsp/sprotty';
import { interfaces } from 'inversify';

/**
 * A service provider that can be used to retrieve services from the container in deferred fashion.
 * Instead of constructing the service at injection time, the service provider can be used to retrieve the service
 * when it is actually needed. Services are cached after the first retrieval.
 * The service provider is typically bound in transient scope. This means each injecting class gets its own instance.
 * This ensures that (cached) retrieved services do respect the scope the where originally bound in.
 *
 * This can be used in places where eager injection via decorator would lead to circular dependencies.
 * For example if injecting the following service causes a circular dependency:
 * ```ts
 * @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
 * ```
 * You can use the service provider to inject it lazily as follows:
 * ```ts
 * @inject(TYPES.IServiceProvider) protected serviceProvider: IServiceProvider;
 * get actionDispatcher(): IActionDispatcher {
 *    return this.serviceProvider.get(TYPES.IActionDispatcher);
 * }
 */
export interface IServiceProvider {
    get<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T;
    getOptional<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T | undefined;
}

export class DefaultServiceProvider implements IServiceProvider {
    protected cache = new Map<interfaces.ServiceIdentifier<AnyObject>, AnyObject>();

    constructor(protected readonly container: interfaces.Container) {}

    get<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
        const service = this.getOptional(serviceIdentifier);
        if (!service) {
            throw new Error(`Service ${serviceIdentifier.toString()} not bound in container`);
        }
        return service;
    }

    getOptional<T extends AnyObject>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T | undefined {
        let service = this.cache.get(serviceIdentifier) as T | undefined;
        if (service === undefined && this.container.isBound(serviceIdentifier)) {
            service = this.container.get<T>(serviceIdentifier);
            this.cache.set(serviceIdentifier, service);
        }
        return service;
    }
}
