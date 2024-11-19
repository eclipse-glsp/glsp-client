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

import {
    Action,
    CenterAction,
    GModelElement,
    GModelRoot,
    IActionDispatcher,
    KeyListener,
    KeyTool,
    Point,
    SetViewportAction,
    TYPES,
    Viewport,
    isViewport,
    matchesKeystroke
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../../base/editor-context-service';
import { SelectionService } from '../../../base/selection-service';
import { Tool } from '../../../base/tool-manager/tool';
import { getAbsolutePositionByPoint } from '../../../utils/viewpoint-util';
import { ZoomFactor } from '../../viewport/utils';
import { ElementNavigatorKeyListener } from '../element-navigation/diagram-navigation-tool';
import { SetAccessibleKeyShortcutAction } from '../key-shortcut/accessible-key-shortcut';
import { EnableKeyboardGridAction, KeyboardGridCellSelectedAction, KeyboardGridKeyboardEventAction } from '../keyboard-grid/action';
import * as messages from '../toast/messages.json';
import { HideToastAction, ShowToastMessageAction } from '../toast/toast-handler';

/**
 * Zoom viewport and elements when its focused and arrow keys are hit.
 */
@injectable()
export class GridZoomTool implements Tool {
    static ID = 'glsp.accessibility-grid-zoom-tool';

    isEditTool = false;

    protected readonly zoomKeyListener = new GridZoomKeyListener(this);

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: IActionDispatcher;
    @inject(SelectionService) selectionService: SelectionService;
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    get id(): string {
        return GridZoomTool.ID;
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

            if (KeyboardGridCellSelectedAction.is(action) && action.options.originId === GridZoomTool.ID) {
                viewportAction = this.zoomKeyListener.setNewZoomFactor(
                    this.editorContextService.modelRoot,
                    ZoomFactor.Default.IN,
                    getAbsolutePositionByPoint(this.editorContextService.modelRoot, action.options.centerCellPosition)
                );
            } else if (KeyboardGridKeyboardEventAction.is(action) && action.options.originId === GridZoomTool.ID) {
                if (matchesKeystroke(action.options.event, 'Minus')) {
                    viewportAction = this.zoomKeyListener.setNewZoomFactor(this.editorContextService.modelRoot, ZoomFactor.Default.OUT);
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

export class GridZoomKeyListener extends KeyListener {
    protected readonly token = GridZoomKeyListener.name;

    constructor(protected tool: GridZoomTool) {
        super();
    }

    registerShortcutKey(): void {
        this.tool.actionDispatcher.dispatchOnceModelInitialized(
            SetAccessibleKeyShortcutAction.create({
                token: this.token,
                keys: [{ shortcuts: ['CTRL', '+'], description: 'Zoom in via Grid', group: 'Zoom', position: 0 }]
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
        return SetViewportAction.create(viewport.id, newViewport, { animate: false });
    }

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        if (this.matchesZoomViaGrid(event)) {
            return [
                EnableKeyboardGridAction.create({
                    originId: GridZoomTool.ID,
                    triggerActions: []
                }),

                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ElementNavigatorKeyListener.name),
                    message: messages.grid.zoom_in_grid
                })
            ];
        }
        return [];
    }

    protected matchesZoomViaGrid(event: KeyboardEvent): boolean {
        return event.key === '+' && event.ctrlKey;
    }
}
