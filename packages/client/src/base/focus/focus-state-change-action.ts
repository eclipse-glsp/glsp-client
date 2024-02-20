/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
import { Action, hasBooleanProp } from '@eclipse-glsp/sprotty';

/**
 * A `FocusStateChangedAction` is dispatched by the client whenever the
 * diagram focus changes (i.e. focus loss or focus gain).
 */
export interface FocusStateChangedAction extends Action {
    kind: typeof FocusStateChangedAction.KIND;
    /**
     * The new focus state of the diagram.
     */
    hasFocus: boolean;
}

export namespace FocusStateChangedAction {
    export const KIND = 'focusStateChanged';

    export function is(object: any): object is FocusStateChangedAction {
        return Action.hasKind(object, KIND) && hasBooleanProp(object, 'hasFocus');
    }

    export function create(hasFocus = true): FocusStateChangedAction {
        return {
            kind: KIND,
            hasFocus
        };
    }
}
