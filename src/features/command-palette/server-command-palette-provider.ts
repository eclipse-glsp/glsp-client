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
import { inject, injectable } from "inversify";
import { Action, ICommandPaletteActionProvider, isSelected, LabeledAction, Point, SModelElement, TYPES } from "sprotty/lib";

import { ContextActions, isSetContextActionsAction, RequestContextActions } from "../context-actions/action-definitions";
import { GLSPActionDispatcher } from "../request-response/glsp-action-dispatcher";

export namespace ServerCommandPalette {
    export const KEY = "command-palette";
    export const TEXT = "text";
    export const INDEX = "index";
}

@injectable()
export class ServerCommandPaletteActionProvider implements ICommandPaletteActionProvider {

    constructor(@inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher) { }

    getActions(root: Readonly<SModelElement>, text: string, lastMousePosition?: Point, index?: number): Promise<LabeledAction[]> {
        const selectedElementIds = Array.from(root.index.all().filter(isSelected).map(e => e.id));
        const requestAction = new RequestContextActions(selectedElementIds, lastMousePosition, {
            [ContextActions.UI_CONTROL_KEY]: ServerCommandPalette.KEY,
            [ServerCommandPalette.TEXT]: text,
            [ServerCommandPalette.INDEX]: index ? index : 0
        });
        return this.actionDispatcher.requestUntil(requestAction).then(response => this.getPaletteActionsFromResponse(response));
    }

    getPaletteActionsFromResponse(action: Action): LabeledAction[] {
        if (isSetContextActionsAction(action)) {
            return action.actions;
        }
        return [];
    }
}
