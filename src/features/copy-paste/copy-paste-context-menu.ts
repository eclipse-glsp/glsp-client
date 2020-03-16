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
import { inject, injectable } from "inversify";
import {
    Action,
    IActionDispatcher,
    IActionHandler,
    IContextMenuItemProvider,
    isDeletable,
    isSelected,
    MenuItem,
    Point,
    SModelRoot,
    TYPES
} from "sprotty/lib";

import { GLSP_TYPES } from "../../base/types";
import { GLSPServerStatusAction, ServerMessageAction } from "../../model-source/glsp-server-status";
import { SelectionService } from "../select/selection-service";

export class InvokeCopyAction implements Action {
    static readonly KIND = "invoke-copy";
    kind = InvokeCopyAction.KIND;
}

export class InvokePasteAction implements Action {
    static readonly KIND = "invoke-paste";
    kind = InvokePasteAction.KIND;
}

export class InvokeCutAction implements Action {
    static readonly KIND = "invoke-cut";
    kind = InvokeCutAction.KIND;
}

@injectable()
export class InvokeCopyPasteActionHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    handle(action: Action) {
        switch (action.kind) {
            case InvokeCopyAction.KIND:
                document.execCommand('copy');
                break;
            case InvokePasteAction.KIND:
                // in a browser without additional permission we can't invoke the paste command
                // the user needs to invoke it from the browser, so notify the user about it
                this.notifyUserToUseShortcut();
                break;
            case InvokeCutAction.KIND:
                document.execCommand('cut');
                break;
        }
    }

    protected notifyUserToUseShortcut() {
        const message = 'Please use the browser\'s paste command or shortcut.';
        const timeout = 10000;
        const severity = 'WARNING';
        this.dispatcher.dispatchAll([
            <GLSPServerStatusAction>{ kind: GLSPServerStatusAction.KIND, severity, timeout, message },
            <ServerMessageAction>{ kind: ServerMessageAction.KIND, severity, timeout, message }
        ]);
    }
}

@injectable()
export class CopyPasteContextMenuItemProvider implements IContextMenuItemProvider {
    @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService;
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected).filter(isDeletable));
        this.selectionService.updateSelection(root, selectedElements.map(element => element.id), []);
        return Promise.resolve([
            {
                id: "copy",
                label: "Copy",
                group: "copy-paste",
                actions: [new InvokeCopyAction()],
                isEnabled: () => selectedElements.length > 0
            },
            {
                id: "cut",
                label: "Cut",
                group: "copy-paste",
                actions: [new InvokeCutAction()],
                isEnabled: () => selectedElements.length > 0
            },
            {
                id: "paste",
                label: "Paste",
                group: "copy-paste",
                actions: [new InvokePasteAction()],
                isEnabled: () => true
            }
        ]);
    }
}
