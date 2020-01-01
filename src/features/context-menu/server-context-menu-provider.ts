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
import {
    Action,
    IContextMenuItemProvider,
    isSelected,
    LabeledAction,
    Point,
    SModelElement,
    subtract,
    TYPES
} from "sprotty/lib";

import { ContextActions, isSetContextActionsAction, RequestContextActions } from "../context-actions/action-definitions";
import { GLSPActionDispatcher } from "../request-response/glsp-action-dispatcher";

export namespace ServerContextMenu {
    export const KEY = "context-menu";
}

@injectable()
export class ServerContextMenuItemProvider implements IContextMenuItemProvider {

    constructor(@inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher) { }

    getItems(root: Readonly<SModelElement>, lastMousePosition?: Point): Promise<LabeledAction[]> {
        const selectedElementIds = Array.from(root.index.all().filter(isSelected).map(e => e.id));
        const localPosition = lastMousePosition ? root.root.parentToLocal(subtract(lastMousePosition, root.root.canvasBounds)) : undefined;
        const requestAction = new RequestContextActions(selectedElementIds, localPosition, { [ContextActions.UI_CONTROL_KEY]: ServerContextMenu.KEY });
        return this.actionDispatcher.requestUntil(requestAction).then(response => this.getContextActionsFromResponse(response));
    }

    getContextActionsFromResponse(action: Action): LabeledAction[] {
        if (isSetContextActionsAction(action)) {
            return action.actions;
        }
        return [];
    }
}
