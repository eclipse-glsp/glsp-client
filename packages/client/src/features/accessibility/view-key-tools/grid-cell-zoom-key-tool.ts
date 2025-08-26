/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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
    KeyListener,
    Point,
    SetViewportAction,
    TYPES,
    Viewport,
    matchesKeystroke
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { messages, repeatOnMessagesUpdated } from '../../../base/messages';
import { SelectionService } from '../../../base/selection-service';
import type { IShortcutManager } from '../../../base/shortcuts/shortcuts-manager';
import { getAbsolutePositionByPoint } from '../../../utils/viewpoint-util';
import { BaseTool } from '../../tools/base-tools';
import type { ZoomFactors } from '../../viewport/zoom-viewport-action';
import { ElementNavigatorKeyListener } from '../element-navigation/diagram-navigation-tool';
import { EnableKeyboardGridAction, KeyboardGridCellSelectedAction, KeyboardGridKeyboardEventAction } from '../keyboard-grid/action';
import { HideToastAction, ShowToastMessageAction } from '../toast/toast-handler';

/**
 * Zoom viewport and elements when its focused and arrow keys are hit.
 */
@injectable()
export class GridCellZoomTool extends BaseTool {
    static ID = 'glsp.accessibility-grid-cell-zoom-tool';
    static TOKEN = Symbol.for(GridCellZoomTool.name);

    protected readonly zoomKeyListener = new GridZoomKeyListener(this);

    @inject(TYPES.IShortcutManager) protected readonly shortcutManager: IShortcutManager;
    @inject(TYPES.ZoomFactors) protected readonly zoomFactors: ZoomFactors;
    @inject(SelectionService) selectionService: SelectionService;

    get id(): string {
        return GridCellZoomTool.ID;
    }

    enable(): void {
        this.toDisposeOnDisable.push(
            this.keyTool.registerListener(this.zoomKeyListener),
            repeatOnMessagesUpdated(() =>
                this.shortcutManager.register(GridCellZoomTool.TOKEN, [
                    {
                        shortcuts: ['CTRL', '+'],
                        description: messages.grid.shortcut_zoom_in,
                        group: messages.shortcut.group_zoom,
                        position: 0
                    }
                ])
            )
        );
    }

    handle(action: Action): Action | void {
        const viewport = this.editorContext.viewport;
        if (viewport) {
            let viewportAction: Action | undefined = undefined;

            if (KeyboardGridCellSelectedAction.is(action) && action.options.originId === GridCellZoomTool.ID) {
                viewportAction = this.zoomKeyListener.setNewZoomFactor(
                    viewport,
                    this.zoomFactors.in,
                    getAbsolutePositionByPoint(this.editorContext.modelRoot, action.options.centerCellPosition)
                );
            } else if (KeyboardGridKeyboardEventAction.is(action) && action.options.originId === GridCellZoomTool.ID) {
                if (matchesKeystroke(action.options.event, 'Minus')) {
                    viewportAction = this.zoomKeyListener.setNewZoomFactor(viewport, this.zoomFactors.out);
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
    constructor(protected tool: GridCellZoomTool) {
        super();
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
                    originId: GridCellZoomTool.ID,
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
