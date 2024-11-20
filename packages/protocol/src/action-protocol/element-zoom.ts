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

import { Action } from './base-protocol';

/**
 * Zooms to given elements.
 * The corresponding namespace declares the action kind as constant and offers helper functions for type guard checks
 * and creating new `ZoomElementAction`.
 */
export interface ZoomElementAction extends Action {
    kind: typeof ZoomElementAction.KIND;
    /**
     * Specifies the elements to be zoomed in/out
     */
    elementIds: string[];
    /**
     * Specifies the amount by which the viewport should be zoomed
     */
    zoomFactor: number;
}

export namespace ZoomElementAction {
    export const KIND = 'zoomElement';

    export function is(object: any): object is ZoomElementAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { elementIds: string[]; zoomFactor: number }): ZoomElementAction {
        return { kind: KIND, ...options };
    }
}
