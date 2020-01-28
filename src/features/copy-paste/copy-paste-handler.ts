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
import { MousePositionTracker, TYPES } from "sprotty";
import uuid = require("uuid");

import { GLSP_TYPES } from "../../types";
import { GLSPActionDispatcher } from "../request-response/glsp-action-dispatcher";
import { SelectionService } from "../select/selection-service";
import { ClipboardData, CutOperationAction, PasteOperationAction, RequestClipboardDataAction } from "./copy-paste-actions";

export interface ICopyPasteHandler {
    handleCopy(e: ClipboardEvent): void;
    handleCut(e: ClipboardEvent): void;
    handlePaste(e: ClipboardEvent): void;
}

@injectable()
export class LocalClipboardDataStore {
    protected id?: string;
    protected data?: ClipboardData;

    put(id: string, data: ClipboardData) {
        this.id = id;
        this.data = data;
    }

    get(id: string): ClipboardData | undefined {
        if (id !== this.id) {
            return undefined;
        }
        return this.data;
    }
}

interface ClipboardId {
    readonly clipboardId: string;
}

function toClipboardId(clipboardId: string): string {
    return JSON.stringify({ clipboardId });
}

function isClipboardId(jsonData: any): jsonData is ClipboardId {
    return 'clipboardId' in jsonData;
}

const CLIPBOARD_DATA_FORMAT = "application/json";

@injectable()
export class ServerCopyPasteHandler implements ICopyPasteHandler {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher;
    @inject(LocalClipboardDataStore) protected clipboadDataStore: LocalClipboardDataStore;
    @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService;
    @inject(MousePositionTracker) protected mousePositionTracker: MousePositionTracker;

    handleCopy(e: ClipboardEvent) {
        if (e.clipboardData && this.shouldCopy(e)) {
            const clipboardId = uuid();
            e.clipboardData.setData(CLIPBOARD_DATA_FORMAT, toClipboardId(clipboardId));
            this.actionDispatcher
                .request(RequestClipboardDataAction.create(Array.from(this.selectionService.getSelectedElementIDs()),
                    this.mousePositionTracker.lastPositionOnDiagram))
                .then(action => this.clipboadDataStore.put(clipboardId, action.clipboardData));
            e.preventDefault();
        }
    }

    handleCut(e: ClipboardEvent): void {
        if (e.clipboardData && this.shouldCopy(e)) {
            this.handleCopy(e);
            this.actionDispatcher.dispatch(new CutOperationAction(Array.from(this.selectionService.getSelectedElementIDs()),
                this.mousePositionTracker.lastPositionOnDiagram));
        }
    }

    handlePaste(e: ClipboardEvent): void {
        if (e.clipboardData && e.clipboardData.getData(CLIPBOARD_DATA_FORMAT)) {
            const jsonData = JSON.parse(e.clipboardData.getData(CLIPBOARD_DATA_FORMAT));
            if (isClipboardId(jsonData)) {
                const clipboardData = this.clipboadDataStore.get(jsonData.clipboardId);
                if (clipboardData) {
                    this.actionDispatcher
                        .dispatch(new PasteOperationAction(clipboardData, Array.from(this.selectionService.getSelectedElementIDs()),
                            this.mousePositionTracker.lastPositionOnDiagram));
                }
            }
        }
    }

    protected shouldCopy(e: ClipboardEvent) {
        return this.selectionService.hasSelectedElements() && e.srcElement instanceof HTMLBodyElement;
    }

}
