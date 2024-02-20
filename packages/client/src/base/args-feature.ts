/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { Args, GModelElement } from '@eclipse-glsp/sprotty';

export const argsFeature = Symbol('argsFeature');

/**
 * Adds an optional `args` property to a {@link GModelElement}. This allows
 * to add arbitrary arguments to the element (on client or server side) without having
 * to extend the model class.
 *
 * Feature extension interface for {@link argsFeature}.
 */
export interface ArgsAware {
    args?: Args;
}

export function isArgsAware(element?: GModelElement): element is GModelElement & ArgsAware {
    return element !== undefined && element.hasFeature(argsFeature);
}

export function hasArgs(element?: GModelElement): element is GModelElement & Required<ArgsAware> {
    return element !== undefined && isArgsAware(element) && element.args !== undefined;
}

export function ensureArgs(element?: GModelElement): element is GModelElement & Required<ArgsAware> {
    if (!isArgsAware(element)) {
        return false;
    }
    if (element.args === undefined) {
        element.args = {};
    }
    return true;
}
