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
 * Send to the server if the graphical representation (diagram) for a specific
 * client/widget id is no longer needed. e.g. the tab containing the diagram has been closed.
 */
@injectable()
export class DisposeClientAction implements Action {
    static readonly KIND = "disposeClient";
    readonly kind = DisposeClientAction.KIND;
}

export function isDisposeClientAction(action: Action): action is DisposeClientAction {
    return action.kind === DisposeClientAction.KIND;
}
