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
import { Action, generateRequestId, LabeledAction, RequestAction, ResponseAction } from "sprotty";

import { Args } from "../../base/args";
import { EditorContext } from "../editor-context";

export class RequestContextActions implements RequestAction<SetContextActions> {
    static readonly KIND = "requestContextActions";
    kind = RequestContextActions.KIND;
    constructor(
        public readonly contextId: string,
        public readonly editorContext: EditorContext,
        public readonly requestId: string = generateRequestId()) { }
}

export class SetContextActions implements ResponseAction {
    static readonly KIND = "setContextActions";
    kind = SetContextActions.KIND;
    constructor(public readonly actions: LabeledAction[],
        public readonly responseId: string = '',
        readonly args?: Args) { }
}

export function isSetContextActionsAction(action: Action): action is SetContextActions {
    return action !== undefined && (action.kind === SetContextActions.KIND)
        && (<SetContextActions>action).actions !== undefined;
}
