/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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

import { inject, injectable } from 'inversify';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { Action, CenterAction, KeyListener, KeyTool, SModelElement, TYPES } from '~glsp-sprotty';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { SelectionService } from '../../../base/selection-service';
import { GLSPTool } from '../../../base/tool-manager/glsp-tool-manager';
import { SetAccessibleKeyShortcutAction } from '../key-shortcut/accessible-key-shortcut';
import { ZoomElementAction, ZoomViewportAction } from '../move-zoom/zoom-handler';

/**
 * Zoom viewport and elements when its focused and arrow keys are hit.
 */
@injectable()
export class ZoomKeyTool implements GLSPTool {
    static ID = 'glsp.zoom-key-tool';

    isEditTool = false;

    protected readonly zoomKeyListener = new ZoomKeyListener(this);

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: GLSPActionDispatcher;
    @inject(SelectionService) selectionService: SelectionService;

    get id(): string {
        return ZoomKeyTool.ID;
    }

    enable(): void {
        this.keytool.register(this.zoomKeyListener);
        this.zoomKeyListener.registerShortcutKey();
    }

    disable(): void {
        this.keytool.deregister(this.zoomKeyListener);
    }
}

export class ZoomKeyListener extends KeyListener {
    static readonly defaultZoomInFactor = 1.1;
    static readonly defaultZoomOutFactor = 0.9;
    protected readonly token = ZoomKeyListener.name;

    constructor(protected tool: ZoomKeyTool) {
        super();
    }

    registerShortcutKey(): void {
        this.tool.actionDispatcher.onceModelInitialized().then(() => {
            this.tool.actionDispatcher.dispatchAll([
                SetAccessibleKeyShortcutAction.create({
                    token: this.token,
                    keys: [
                        { shortcuts: ['+'], description: 'Zoom in to element or viewport', group: 'Zoom', position: 0 },
                        { shortcuts: ['-'], description: 'Zoom out to element or viewport', group: 'Zoom', position: 1 },
                        { shortcuts: ['CTRL', '0'], description: 'Reset zoom to default', group: 'Zoom', position: 2 },
                        { shortcuts: ['CTRL', '+'], description: 'Zoom in via Grid', group: 'Zoom', position: 3 }
                    ]
                })
            ]);
        });
    }

    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        const selectedElementIds = this.tool.selectionService.getSelectedElementIDs();

        if (this.matchesZoomOutKeystroke(event)) {
            if (selectedElementIds.length > 0) {
                return [ZoomElementAction.create(selectedElementIds, ZoomKeyListener.defaultZoomOutFactor)];
            } else {
                return [ZoomViewportAction.create(ZoomKeyListener.defaultZoomOutFactor)];
            }
        } else if (this.matchesZoomInKeystroke(event)) {
            if (selectedElementIds.length > 0) {
                return [ZoomElementAction.create(selectedElementIds, ZoomKeyListener.defaultZoomInFactor)];
            } else {
                return [ZoomViewportAction.create(ZoomKeyListener.defaultZoomInFactor)];
            }
        } else if (this.matchesMinZoomLevelKeystroke(event)) {
            return [CenterAction.create(selectedElementIds)];
        }
        return [];
    }

    protected matchesZoomInKeystroke(event: KeyboardEvent): boolean {
        /** here event.key is used for '+', as keycode 187 is already declared for 'Equals' in {@link matchesKeystroke}.*/
        return event.key === '+' || matchesKeystroke(event, 'NumpadAdd');
    }

    protected matchesMinZoomLevelKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Digit0', 'ctrl') || matchesKeystroke(event, 'Numpad0', 'ctrl');
    }

    protected matchesZoomOutKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Minus') || matchesKeystroke(event, 'NumpadSubtract');
    }
}
