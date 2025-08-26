/********************************************************************************
 * Copyright (c) 2024-2025 EclipseSource and others.
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

import { Action } from '@eclipse-glsp/sprotty';

export interface ZoomFactors {
    in: number;
    out: number;
}

export namespace ZoomFactors {
    export const DEFAULT = { in: 1.2, out: 0.8 };
}

/**
 * Zooms the diagram canvas.
 * If `elementIds` is provided, the zoom is centered on the elements with the given identifiers.
 */
export interface ZoomAction extends Action {
    kind: typeof ZoomAction.KIND;
    /**
     * Specifies the elements to be zoomed in/out
     */
    elementIds?: string[];
    /**
     * Specifies the amount by which the viewport should be zoomed
     */
    zoomFactor: number;
}

export namespace ZoomAction {
    export const KIND = 'zoom';

    export function is(object: any): object is ZoomAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { elementIds?: string[]; zoomFactor: number }): ZoomAction {
        return { kind: KIND, ...options };
    }
}
