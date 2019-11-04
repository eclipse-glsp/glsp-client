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
    CenterAction,
    ICommandPaletteActionProvider,
    ILogger,
    isNameable,
    LabeledAction,
    name,
    Point,
    SelectAction,
    SModelElement,
    TYPES
} from "sprotty/lib";
import { toArray } from "sprotty/lib/utils/iterable";

import { GLSP_TYPES } from "../../types";
import { isSelected } from "../../utils/smodel-util";
import { RequestResponseSupport } from "../request-response/support";
import { isSetCommandPaletteActionsAction, RequestCommandPaletteActions } from "./action-definitions";

@injectable()
export class NavigationCommandPaletteActionProvider implements ICommandPaletteActionProvider {

    constructor(@inject(TYPES.ILogger) protected logger: ILogger) { }

    getActions(root: Readonly<SModelElement>): Promise<LabeledAction[]> {
        return Promise.resolve(toArray(root.index.all()
            .filter(isNameable)
            .map(nameable => new LabeledAction(`Select ${name(nameable)}`,
                [new SelectAction([nameable.id]), new CenterAction([nameable.id])], 'fa-object-group'))));
    }
}

@injectable()
export class ServerCommandPaletteActionProvider implements ICommandPaletteActionProvider {

    constructor(@inject(GLSP_TYPES.RequestResponseSupport) protected requestResponseSupport: RequestResponseSupport) { }

    getActions(root: Readonly<SModelElement>, text: string, lastMousePosition?: Point): Promise<LabeledAction[]> {
        const selectedElementIds = Array.from(root.index.all().filter(isSelected).map(e => e.id));
        const requestAction = new RequestCommandPaletteActions(selectedElementIds, text, lastMousePosition);
        const responseHandler = this.getPaletteActionsFromResponse;
        const promise = this.requestResponseSupport.dispatchRequest(requestAction, responseHandler);
        return promise;
    }

    getPaletteActionsFromResponse(action: Action): LabeledAction[] {
        if (isSetCommandPaletteActionsAction(action)) {
            return action.actions;
        }
        return [];
    }
}
