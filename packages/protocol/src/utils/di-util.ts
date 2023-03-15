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
import { Container, ContainerModule, interfaces } from 'inversify';
import { asArray, distinctAdd, MaybeArray, remove } from './array-util';
import { hasFunctionProp, hasNumberProp } from './type-util';

/**
 * A wrapper interface to get access to the binding related functions
 * for an inversify container.
 */
export interface BindingContext {
    bind: interfaces.Bind;
    unbind: interfaces.Unbind;
    isBound: interfaces.IsBound;
    rebind: interfaces.Rebind;
}

/**
 * Initializes a container with the given {@link ContainerConfiguration}. The container configuration
 * consists of the set of {@link ContainerModule}s that should be loaded in the container and/or
 * In addition, for more fine-grained control {@link ModuleConfiguration}s can be passed as part fo the container configuration
 * Module loading is distinct,this means each module will only get loaded once even if it is configured multiple times.
  @param containerConfiguration
 *          Custom modules to be loaded in addition to the default modules and/or default modules that should be excluded.
  @returns The initialized container.
 */
export function initializeContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    const modules: ContainerModule[] = [];
    containerConfiguration.forEach(config => {
        if (isContainerModule(config)) {
            distinctAdd(modules, config);
        } else {
            if (config.remove) {
                remove(modules, ...asArray(config.remove));
            }
            if (config.add) {
                distinctAdd(modules, ...asArray(config.add));
            }
        }
    });
    container.load(...modules);
    return container;
}

/**
 * The container modules might originate form different inversify contexts (e.g. `inversify` vs. `@theia/core/shared/inversify`).
 * If this is the case an instanceof check can return  false negative.
 * => use a simple typeguard instead.
 */
function isContainerModule(config: ContainerModule | ModuleConfiguration): config is ContainerModule {
    return hasNumberProp(config, 'id') && hasFunctionProp(config, 'registry');
}

/**
 * Union type for the set of {@link ContainerModule}s and addition {@link ModuleConfiguration}s
 * used to configure a DI container.
 */
export type ContainerConfiguration = Array<ContainerModule | ModuleConfiguration>;

/**
 * Can be passed to create DI container utility functions to configure additional modules or
 *  remove (i.e. not load) default modules.
 */
export interface ModuleConfiguration {
    /** Set of modules that should be loaded into the container. Loading */
    add?: MaybeArray<ContainerModule>;
    /** Set of modules that should be loaded into the container */
    remove?: MaybeArray<ContainerModule>;
}

/**
 * Checks wether the given service identifier is already bound in the given context
 * then either calls  the `bind` or `rebind` function respectively.
 *
 * As this is just a convenience function
 * ```ts
 * bindOrRebind({bind,isBound,rebind}, MyService).to(SomeOtherService);
 * ```
 * is equivalent to:
 * ```
 * if (isBound(MyService)){
 *    rebind(MyService).to(SomeOtherService);
 * }else {
 *    bind(MyService).to(SomeOtherService);
 * }
 * ```
 * @param context The binding context
 * @param serviceIdentifier The service identifier
 * @returns The result of the `bind` or `rebind` function
 */
export function bindOrRebind<T>(
    context: Omit<BindingContext, 'unbind'>,
    serviceIdentifier: interfaces.ServiceIdentifier<T>
): interfaces.BindingToSyntax<T> {
    if (context.isBound(serviceIdentifier)) {
        return context.rebind(serviceIdentifier);
    }
    return context.bind(serviceIdentifier);
}

/**
 * Only binds the given service identifier if it's not already bound in the given context.
 *
 * As this is just a convenience function
 * ```ts
 * lazyBind({bind,isBound}, MyService)?.to(SomeOtherService);
 * ```
 * is equivalent to:
 * ```
 * if (!isBound(MyService)){
 *    bind(MyService).to(SomeOtherService);
 * }
 * ```
 * @param context The binding context
 * @param serviceIdentifier The service identifier
 * @returns The result of the `bind` function or `undefined` if the service was already bound
 */
export function lazyBind<T>(
    context: Pick<BindingContext, 'bind' | 'isBound'>,
    serviceIdentifier: interfaces.ServiceIdentifier<T>
): interfaces.BindingToSyntax<T> | undefined {
    if (context.isBound(serviceIdentifier)) {
        return undefined;
    }
    return context.bind(serviceIdentifier);
}

/**
 * Binds the given service identifier to the given target service in the given context.
 * In addition, the target service is bound to itself in singleton scope. This ensures
 * that services can be rebound individually even if they are multi-injected.
 *
 * As this is just a convenience function
 * ```ts
 * bindAsService(bind,SomeOtherService,MyServiceImpl);
 * ```
 * is equivalent to:
 * ```ts
 * bind(MyServiceImpl).toSelf.inSingletonScope():
 * bind(SomeOtherService).toService(MyServiceImpl);
 * ```
 * @param serviceIdentifier
 * @param toServiceIdentifier
 */
export function bindAsService<S, T extends S>(
    context: Pick<BindingContext, 'bind'> | interfaces.Bind,
    serviceIdentifier: interfaces.ServiceIdentifier<S>,
    targetService: interfaces.ServiceIdentifier<T>
): void {
    const bind = typeof context === 'object' ? context.bind : context;
    bind(targetService).toSelf().inSingletonScope();
    bind(serviceIdentifier).toService(targetService);
}
