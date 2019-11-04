/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { Action } from "sprotty/lib";

export class IdentifiableRequestAction implements Action {
    static readonly KIND = "identifiableRequestAction";
    kind = IdentifiableRequestAction.KIND;
    constructor(public readonly id: string, public readonly action: Action) { }
}

export class IdentifiableResponseAction implements Action {
    static readonly KIND = "identifiableResponseAction";
    kind = IdentifiableResponseAction.KIND;
    constructor(public readonly id: string, public readonly action: Action) { }
}

export function isIdentifiableRequestAction(action: Action): action is IdentifiableRequestAction {
    return action !== undefined && (action.kind === IdentifiableRequestAction.KIND)
        && (<IdentifiableRequestAction>action).id !== undefined
        && (<IdentifiableRequestAction>action).action !== undefined;
}

export function isIdentifiableResponseAction(action: Action): action is IdentifiableResponseAction {
    return action !== undefined && (action.kind === IdentifiableResponseAction.KIND)
        && (<IdentifiableResponseAction>action).id !== undefined
        && (<IdentifiableResponseAction>action).action !== undefined;
}
