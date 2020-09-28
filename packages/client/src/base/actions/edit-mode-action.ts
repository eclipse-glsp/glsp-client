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

@injectable()
export class SetEditModeAction implements Action {
    static readonly KIND = "setEditMode";
    constructor(public readonly editMode: string = EditMode.EDITABLE, public readonly kind: string = SetEditModeAction.KIND) { }
}

export function isSetEditModeAction(action: Action): action is SetEditModeAction {
    return action !== undefined && (action.kind === SetEditModeAction.KIND)
        && "editMode" in action && typeof action["editMode"] === "string";
}

export namespace EditMode {
    export const READONLY: string = "readonly";
    export const EDITABLE: string = "editable";
}
