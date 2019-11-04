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
import { Action, LabeledAction, Point } from "sprotty/lib";

export class RequestCommandPaletteActions implements Action {
    static readonly KIND = "requestCommandPaletteActions";
    kind = RequestCommandPaletteActions.KIND;
    constructor(
        public readonly selectedElementIds: string[] = [],
        public readonly text: string,
        public readonly lastMousePosition?: Point) { }
}

export class SetCommandPaletteActions implements Action {
    static readonly KIND = "setCommandPaletteActions";
    kind = SetCommandPaletteActions.KIND;
    constructor(public readonly actions: LabeledAction[]) { }
}

export function isSetCommandPaletteActionsAction(action: Action): action is SetCommandPaletteActions {
    return action !== undefined && (action.kind === SetCommandPaletteActions.KIND)
        && (<SetCommandPaletteActions>action).actions !== undefined;
}
