/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { injectable } from "inversify";
import { Action } from "sprotty";

/**
 * Initializes the graphical representation (diagram) for a specific client session.
 * Each individual diagram on the client side counts as one session and has to provide
 * a unique clientId.
 */
@injectable()
export class InitializeClientSessionAction implements Action {
    static readonly KIND = "initializeClientSession";
    readonly kind = InitializeClientSessionAction.KIND;

    constructor(public readonly clientId: string) { }

}

export function initializeClientSessionAction(action: Action): action is InitializeClientSessionAction {
    return action.kind === InitializeClientSessionAction.KIND;
}

/**
 * Sent to the server if the graphical representation (diagram) for a specific client session
 * is no longer needed. e.g. the tab containing the diagram widget has been closed.
 */
@injectable()
export class DisposeClientSessionAction implements Action {
    static readonly KIND = "disposeClientSession";
    readonly kind = DisposeClientSessionAction.KIND;

    constructor(public readonly clientId: string) { }
}

export function isDisposeClientSessionAction(action: Action): action is DisposeClientSessionAction {
    return action.kind === DisposeClientSessionAction.KIND;
}
