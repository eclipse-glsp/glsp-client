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
import {
    Action,
    CenterAction,
    KeyListener,
    KeyTool,
    Point,
    GModelElement,
    GModelRoot,
    SetViewportAction,
    TYPES,
    Viewport,
    isViewport
} from '@eclipse-glsp/sprotty';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { SelectionService } from '../../../base/selection-service';
import { Tool } from '../../../base/tool-manager/tool';
import { SetAccessibleKeyShortcutAction } from '../key-shortcut/accessible-key-shortcut';
import { ZoomElementAction, ZoomViewportAction } from '../move-zoom/zoom-handler';
import { EnableKeyboardGridAction, KeyboardGridCellSelectedAction, KeyboardGridKeyboardEventAction } from '../keyboard-grid/action';
import { getAbsolutePositionByPoint } from '../../../utils/viewpoint-util';
import { EditorContextService } from '../../../base/editor-context-service';
import { HideToastAction, ShowToastMessageAction } from '../toast/toast-handler';
import { ElementNavigatorKeyListener } from '../element-navigation/diagram-navigation-tool';
import * as messages from '../toast/messages.json';

/**
 * Zoom viewport and elements when its focused and arrow keys are hit.
 */
@injectable()
export class ZoomKeyTool implements Tool {
    static ID = 'glsp.zoom-key-tool';

    isEditTool = false;

    protected readonly zoomKeyListener = new ZoomKeyListener(this);

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: GLSPActionDispatcher;
    @inject(SelectionService) selectionService: SelectionService;
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

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

    handle(action: Action): Action | void {
        if (isViewport(this.editorContextService.modelRoot)) {
            let viewportAction: Action | undefined = undefined;

            if (KeyboardGridCellSelectedAction.is(action) && action.options.originId === ZoomKeyTool.ID) {
                viewportAction = this.zoomKeyListener.setNewZoomFactor(
                    this.editorContextService.modelRoot,
                    ZoomKeyListener.defaultZoomInFactor,
                    getAbsolutePositionByPoint(this.editorContextService.modelRoot, action.options.centerCellPosition)
                );
            } else if (KeyboardGridKeyboardEventAction.is(action) && action.options.originId === ZoomKeyTool.ID) {
                if (matchesKeystroke(action.options.event, 'Minus')) {
                    viewportAction = this.zoomKeyListener.setNewZoomFactor(
                        this.editorContextService.modelRoot,
                        ZoomKeyListener.defaultZoomOutFactor
                    );
                } else if (matchesKeystroke(action.options.event, 'Digit0', 'ctrl')) {
                    viewportAction = CenterAction.create([]);
                }
            }

            if (viewportAction) {
                this.actionDispatcher.dispatchAll([
                    viewportAction,
                    HideToastAction.create({ id: Symbol.for(ElementNavigatorKeyListener.name) })
                ]);
            }
        }
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
        this.tool.actionDispatcher.dispatchOnceModelInitialized(
            SetAccessibleKeyShortcutAction.create({
                token: this.token,
                keys: [
                    { shortcuts: ['+'], description: 'Zoom in to element or viewport', group: 'Zoom', position: 0 },
                    { shortcuts: ['-'], description: 'Zoom out to element or viewport', group: 'Zoom', position: 1 },
                    { shortcuts: ['CTRL', '0'], description: 'Reset zoom to default', group: 'Zoom', position: 2 },
                    { shortcuts: ['CTRL', '+'], description: 'Zoom in via Grid', group: 'Zoom', position: 3 }
                ]
            })
        );
    }

    setNewZoomFactor(viewport: GModelElement & GModelRoot & Viewport, zoomFactor: number, point?: Point): SetViewportAction {
        let newViewport: Viewport;
        const newZoom = viewport.zoom * zoomFactor;

        if (point) {
            newViewport = {
                scroll: {
                    x: point.x - (0.5 * viewport.canvasBounds.width) / newZoom,
                    y: point.y - (0.5 * viewport.canvasBounds.height) / newZoom
                },
                zoom: newZoom
            };
        } else {
            newViewport = {
                scroll: viewport.scroll,
                zoom: newZoom
            };
        }
        return SetViewportAction.create(viewport.id, newViewport, { animate: true });
    }

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        const selectedElementIds = this.tool.selectionService.getSelectedElementIDs();

        if (this.matchesZoomViaGrid(event)) {
            return [
                EnableKeyboardGridAction.create({
                    originId: ZoomKeyTool.ID,
                    triggerActions: []
                }),

                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ElementNavigatorKeyListener.name),
                    message: messages.grid.zoom_in_grid
                })
            ];
        } else if (this.matchesZoomOutKeystroke(event)) {
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

    protected matchesZoomViaGrid(event: KeyboardEvent): boolean {
        return event.key === '+' && event.ctrlKey;
    }
    protected matchesMinZoomLevelKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Digit0', 'ctrl') || matchesKeystroke(event, 'Numpad0', 'ctrl');
    }

    protected matchesZoomOutKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Minus') || matchesKeystroke(event, 'NumpadSubtract');
    }
}
