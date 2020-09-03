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
import { Action, generateRequestId, RequestAction, ResponseAction } from "sprotty";

import { EditorContext } from "../../base/editor-context";

export class CutOperationAction implements Action {
    static readonly KIND = "cut";
    kind = CutOperationAction.KIND;
    constructor(public readonly editorContext: EditorContext) { }
}

export class PasteOperationAction implements Action {
    static readonly KIND = "paste";
    kind = PasteOperationAction.KIND;
    constructor(
        public readonly clipboardData: ClipboardData,
        public readonly editorContext: EditorContext) { }
}

export class RequestClipboardDataAction implements RequestAction<SetClipboardDataAction> {
    static readonly KIND = "requestClipboardData";
    kind = RequestClipboardDataAction.KIND;

    constructor(
        public readonly editorContext: EditorContext,
        public readonly requestId: string = generateRequestId()) { }

    static create(editorContext: EditorContext): RequestAction<SetClipboardDataAction> {
        return new RequestClipboardDataAction(editorContext);
    }
}

export type ClipboardData = { [format: string]: string };

export class SetClipboardDataAction implements ResponseAction {
    static readonly KIND = "setClipboardData";
    kind = SetClipboardDataAction.KIND;
    constructor(
        public readonly clipboardData: ClipboardData,
        public readonly responseId: string = '') { }
}
