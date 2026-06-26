/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { ContainerConfiguration, FeatureModule, configureDefaultModelElements, initializeDiagramContainer } from '@eclipse-glsp/client';
import { Container } from 'inversify';

/**
 * Diagram module for the `gmodel-demo` example language.
 *
 * `.gm` files are a serialized form of the direct GModel using only default
 * primitives, so registering the standard model elements with their default
 * views is all that is needed. No custom types and — deliberately — no creation
 * tooling are configured: the language is load-and-interact only.
 */
export const gmodelDemoDiagramModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureDefaultModelElements(context);
    },
    { featureId: Symbol('gmodelDemoDiagram') }
);

export function createGModelDemoDiagramContainer(...containerConfiguration: ContainerConfiguration): Container {
    return initializeGModelDemoDiagramContainer(new Container(), ...containerConfiguration);
}

export function initializeGModelDemoDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, gmodelDemoDiagramModule, ...containerConfiguration);
}
