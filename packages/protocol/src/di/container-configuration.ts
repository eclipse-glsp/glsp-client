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
import { MaybeArray, asArray, distinctAdd, remove } from '../utils/array-util';
import { hasFunctionProp, hasNumberProp } from '../utils/type-util';
import { FeatureModule } from './feature-module';

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
 * it can be added again in a later configuration. This also means in case of `replace` configurations that affect the same feature id
 * the last configuration wins.
 * @param containerConfigurations The container configurations to resolve
 * @throws An error if featureModule ids are not unique in the resolved module array
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
            if (config.replace) {
                asArray(config.replace).forEach(replace => {
                    const existingIndex = modules.findIndex(m => m instanceof FeatureModule && m.featureId === replace.featureId);
                    if (existingIndex >= 0) {
                        modules[existingIndex] = replace;
                    } else {
                        console.warn(
                            `Could not find module to replace with feature id ${replace.featureId.toString()}.` +
                                'Adding replacement module to the end of the resolved configurations.'
                        );
                        distinctAdd(modules, replace);
                    }
                });
            }
        }
    });

    // Check for duplicate feature ids in resolved modules
    const featureIds = new Set<symbol>();
    const duplicates: FeatureModule[] = [];
    modules.forEach(module => {
        if (module instanceof FeatureModule) {
            if (featureIds.has(module.featureId)) {
                duplicates.push(module);
            } else {
                featureIds.add(module.featureId);
            }
        }
    });
    if (duplicates.length > 0) {
        const culprits = duplicates.map(m => m.featureId.toString()).join(', ');
        throw new Error(`Could not resolve container configuration. Non-unique feature ids found in container configuration: ${culprits}`);
    }
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
    /** Set of modules that should be loaded into the container. */
    add?: MaybeArray<ContainerModule>;
    /** Set of modules that should be loaded into the container */
    remove?: MaybeArray<ContainerModule>;
    /**
     * Set of feature modules that should be loaded into the container and
     * replace potential already configured modules with the same feature id.
     * When resolving the replacement module will be added at the index of the module it replaces.
     * If there is no module to replace, the replacement module will be added to the end of the list (i.e. behaves like `add`).
     */
    replace?: MaybeArray<FeatureModule>;
}
