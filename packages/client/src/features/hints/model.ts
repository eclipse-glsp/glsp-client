/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { GModelElement, GModelElementSchema } from '@eclipse-glsp/sprotty';

export const containerFeature = Symbol('containable');

/**
 *  Feature extension interface for {@link containerFeature}.
 */
export interface Containable {
    isContainableElement(input: GModelElement | GModelElementSchema | string): boolean;
}

/**
 * A union type for all elements that can contain other elements.
 */
export type ContainerElement = GModelElement & Containable;

export function isContainable(element: GModelElement): element is ContainerElement {
    return element.hasFeature(containerFeature);
}

export const reparentFeature = Symbol('reparentFeature');

/**
 *  Feature extension interface for {@link reparentFeature}.
 */
export interface Reparentable {}

export function isReparentable(element: GModelElement): element is GModelElement & Reparentable {
    return element.hasFeature(reparentFeature);
}
