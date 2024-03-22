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

import { Container, ContainerModule } from 'inversify';
import { MaybeArray, asArray, distinctAdd, hasFunctionProp, hasNumberProp, remove } from '../utils';

/**
 * Initializes a container with the given {@link ContainerConfiguration}. The container configuration
 * consists of the set of {@link ContainerModule}s that should be loaded in the container.
 * In addition, for more fine-grained control {@link ModuleConfiguration}s can be passed as part fo the container configuration
 * Module loading is distinct,this means each module will only get loaded once even if it is configured multiple times.
  @param containerConfigurations
 *          Custom modules to be loaded in addition to the default modules and/or default modules that should be excluded.
  @returns The initialized container.
 */
export function initializeContainer(container: Container, ...containerConfigurations: ContainerConfiguration): Container {
    const modules = resolveContainerConfiguration(...containerConfigurations);
    container.load(...modules);
    return container;
}

/**
 * Processes the given container configurations and returns the corresponding set of {@link ContainerModule}s.
 * Container configurations are processed in the order they are passed. If a module is configured to be removed
 * it can be added again in a later configuration.
 * @param containerConfigurations The container configurations to resolves
 * @returns an Array of resolved container modules
 */
export function resolveContainerConfiguration(...containerConfigurations: ContainerConfiguration): ContainerModule[] {
    const modules: ContainerModule[] = [];
    containerConfigurations.forEach(config => {
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
    return modules;
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
 * remove (i.e. not load) default modules.
 */
export interface ModuleConfiguration {
    /** Set of modules that should be loaded into the container. Loading */
    add?: MaybeArray<ContainerModule>;
    /** Set of modules that should be loaded into the container */
    remove?: MaybeArray<ContainerModule>;
}
