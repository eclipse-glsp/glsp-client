/********************************************************************************
 * Copyright (c) 2024-2025 EclipseSource and others.
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

import { Action, CenterAction, GModelElement, KeyListener, matchesKeystroke, MoveViewportAction, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { SelectionService } from '../../base/selection-service';
import { Grid } from '../grid/grid';
import { IChangeBoundsManager } from '../tools/change-bounds/change-bounds-manager';
import { ZoomAction, ZoomFactors } from './zoom-viewport-action';

@injectable()
export class MoveViewportKeyListener extends KeyListener {
    @inject(SelectionService)
    protected readonly selectionService: SelectionService;
    @inject(TYPES.IChangeBoundsManager)
    protected readonly changeBoundsManager: IChangeBoundsManager;
    @inject(TYPES.Grid)
    @optional()
    protected readonly grid = Grid.DEFAULT;

    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        const selectedElementIds = this.selectionService.getSelectedElementIDs();
        const snap = this.changeBoundsManager.usePositionSnap(event);
        const offsetX = snap ? this.grid.x : 1;
        const offsetY = snap ? this.grid.y : 1;

        if (selectedElementIds.length === 0) {
            if (this.matchesMoveUpKeystroke(event)) {
                return [MoveViewportAction.create({ moveX: 0, moveY: -offsetY })];
            } else if (this.matchesMoveDownKeystroke(event)) {
                return [MoveViewportAction.create({ moveX: 0, moveY: offsetY })];
            } else if (this.matchesMoveRightKeystroke(event)) {
                return [MoveViewportAction.create({ moveX: offsetX, moveY: 0 })];
            } else if (this.matchesMoveLeftKeystroke(event)) {
                return [MoveViewportAction.create({ moveX: -offsetX, moveY: 0 })];
            }
        }
        return [];
    }

    protected matchesMoveUpKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowUp');
    }

    protected matchesMoveDownKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowDown');
    }

    protected matchesMoveRightKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowRight');
    }

    protected matchesMoveLeftKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowLeft');
    }
}

@injectable()
export class ZoomKeyListener extends KeyListener {
    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        const selectedElementIds = this.selectionService.getSelectedElementIDs();

        if (selectedElementIds.length === 0) {
            if (this.matchesZoomOutKeystroke(event)) {
                return [ZoomAction.create({ zoomFactor: ZoomFactors.DEFAULT.out })];
            } else if (this.matchesZoomInKeystroke(event)) {
                return [ZoomAction.create({ zoomFactor: ZoomFactors.DEFAULT.in })];
            } else if (this.matchesMinZoomLevelKeystroke(event)) {
                return [CenterAction.create(selectedElementIds)];
            }
        } else {
            if (this.matchesZoomOutKeystroke(event)) {
                if (selectedElementIds.length > 0) {
                    return [
                        ZoomAction.create({
                            elementIds: selectedElementIds,
                            zoomFactor: ZoomFactors.DEFAULT.out
                        })
                    ];
                }
            } else if (this.matchesZoomInKeystroke(event)) {
                if (selectedElementIds.length > 0) {
                    return [ZoomAction.create({ elementIds: selectedElementIds, zoomFactor: ZoomFactors.DEFAULT.in })];
                }
            } else if (this.matchesMinZoomLevelKeystroke(event)) {
                return [CenterAction.create(selectedElementIds)];
            }
        }

        return [];
    }

    protected matchesZoomInKeystroke(event: KeyboardEvent): boolean {
        /** here event.key is used for '+', as keycode 187 is already declared for 'Equals' in {@link matchesKeystroke}.*/
        return !event.ctrlKey && (event.key === '+' || matchesKeystroke(event, 'NumpadAdd'));
    }

    protected matchesMinZoomLevelKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Digit0', 'ctrl') || matchesKeystroke(event, 'Numpad0', 'ctrl');
    }

    protected matchesZoomOutKeystroke(event: KeyboardEvent): boolean {
        return !event.ctrlKey && (matchesKeystroke(event, 'Minus') || matchesKeystroke(event, 'NumpadSubtract'));
    }
}
