/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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

import { isMoveable, KeyListener, matchesKeystroke, type Action, type GModelElement } from '@eclipse-glsp/sprotty';
import type { SelectionService } from '../../base/selection-service';
import { Grid } from '../grid/grid';
import type { IChangeBoundsManager } from '../tools/change-bounds/change-bounds-manager';
import { MoveElementRelativeAction } from './move-element-action';

export class MoveElementKeyListener extends KeyListener {
    constructor(
        protected readonly selectionService: SelectionService,
        protected readonly changeBoundsManager: IChangeBoundsManager,
        protected readonly grid: Grid = Grid.DEFAULT
    ) {
        super();
    }

    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        const selectedElementIds = this.selectionService
            .getSelectedElements()
            .filter(element => isMoveable(element))
            .map(element => element.id);
        const snap = this.changeBoundsManager.usePositionSnap(event);
        const offsetX = snap ? this.grid.x : 1;
        const offsetY = snap ? this.grid.y : 1;

        if (selectedElementIds.length > 0) {
            if (this.matchesMoveUpKeystroke(event)) {
                return [MoveElementRelativeAction.create({ elementIds: selectedElementIds, moveX: 0, moveY: -offsetY, snap })];
            } else if (this.matchesMoveDownKeystroke(event)) {
                return [MoveElementRelativeAction.create({ elementIds: selectedElementIds, moveX: 0, moveY: offsetY, snap })];
            } else if (this.matchesMoveRightKeystroke(event)) {
                return [MoveElementRelativeAction.create({ elementIds: selectedElementIds, moveX: offsetX, moveY: 0, snap })];
            } else if (this.matchesMoveLeftKeystroke(event)) {
                return [MoveElementRelativeAction.create({ elementIds: selectedElementIds, moveX: -offsetX, moveY: 0, snap })];
            }
        }
        return [];
    }

    protected matchesMoveUpKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowUp') || (!!unsnap && matchesKeystroke(event, 'ArrowUp', unsnap));
    }

    protected matchesMoveDownKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowDown') || (!!unsnap && matchesKeystroke(event, 'ArrowDown', unsnap));
    }

    protected matchesMoveRightKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowRight') || (!!unsnap && matchesKeystroke(event, 'ArrowRight', unsnap));
    }

    protected matchesMoveLeftKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowLeft') || (!!unsnap && matchesKeystroke(event, 'ArrowLeft', unsnap));
    }
}
