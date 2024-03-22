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
import { interfaces } from 'inversify';

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
 * Checks wether the given service identifier is already bound in the given context
 * then either calls  the `bind` or `rebind` function respectively.
 *
 * As this is just a convenience function
 * ```ts
 * bindOrRebind({bind,isBound,rebind}, MyService).to(SomeOtherService);
 * ```
 * is equivalent to:
 * ```
 * if (isBound(MyService)) {
 *    rebind(MyService).to(SomeOtherService);
 * } else {
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
 * if (!isBound(MyService)) {
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
    const bind = typeof context === 'object' ? context.bind.bind(context) : context;
    bind(targetService).toSelf().inSingletonScope();
    bind(serviceIdentifier).toService(targetService);
}
