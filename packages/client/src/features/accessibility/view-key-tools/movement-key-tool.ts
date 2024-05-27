/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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

import { Action, GModelElement, ISnapper, KeyListener, KeyTool, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { SelectionService } from '../../../base/selection-service';
import { Tool } from '../../../base/tool-manager/tool';
import { Grid } from '../../grid/grid';
import { ChangeBoundsManager } from '../../tools/change-bounds/change-bounds-manager';
import { AccessibleKeyShortcutProvider, SetAccessibleKeyShortcutAction } from '../key-shortcut/accessible-key-shortcut';
import { MoveElementAction, MoveViewportAction } from '../move-zoom/move-handler';

/**
 * Moves viewport and elements when its focused and arrow keys are hit.
 */
@injectable()
export class MovementKeyTool implements Tool {
    static ID = 'glsp.movement-key-tool';

    isEditTool = true;

    protected movementKeyListener: MoveKeyListener;

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(SelectionService) selectionService: SelectionService;
    @inject(TYPES.ISnapper) @optional() readonly snapper?: ISnapper;
    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: GLSPActionDispatcher;
    @inject(TYPES.Grid) @optional() protected grid: Grid;
    @inject(ChangeBoundsManager) readonly changeBoundsManager: ChangeBoundsManager;

    get id(): string {
        return MovementKeyTool.ID;
    }

    enable(): void {
        if (!this.movementKeyListener) {
            this.movementKeyListener = new MoveKeyListener(this, this.grid);
        }
        this.keytool.register(this.movementKeyListener);
        this.movementKeyListener.registerShortcutKey();
    }

    disable(): void {
        this.keytool.deregister(this.movementKeyListener);
    }
}

export class MoveKeyListener extends KeyListener implements AccessibleKeyShortcutProvider {
    // Default x distance used if grid is not provided
    static readonly defaultMoveX = 20;

    // Default y distance used if grid is not provided
    static readonly defaultMoveY = 20;

    protected readonly token = MoveKeyListener.name;

    constructor(
        protected readonly tool: MovementKeyTool,
        protected grid: Grid = { x: MoveKeyListener.defaultMoveX, y: MoveKeyListener.defaultMoveY }
    ) {
        super();
    }

    registerShortcutKey(): void {
        this.tool.actionDispatcher.dispatchOnceModelInitialized(
            SetAccessibleKeyShortcutAction.create({
                token: this.token,
                keys: [{ shortcuts: ['⬅  ⬆  ➡  ⬇'], description: 'Move element or viewport', group: 'Move', position: 0 }]
            })
        );
    }

    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        const selectedElementIds = this.tool.selectionService.getSelectedElementIDs();
        const snap = this.tool.changeBoundsManager.usePositionSnap(event);
        const offsetX = snap ? this.grid.x : 1;
        const offsetY = snap ? this.grid.y : 1;

        if (selectedElementIds.length > 0) {
            if (this.matchesMoveUpKeystroke(event)) {
                return [MoveElementAction.create(selectedElementIds, 0, -offsetY, snap)];
            } else if (this.matchesMoveDownKeystroke(event)) {
                return [MoveElementAction.create(selectedElementIds, 0, offsetY, snap)];
            } else if (this.matchesMoveRightKeystroke(event)) {
                return [MoveElementAction.create(selectedElementIds, offsetX, 0, snap)];
            } else if (this.matchesMoveLeftKeystroke(event)) {
                return [MoveElementAction.create(selectedElementIds, -offsetX, 0, snap)];
            }
        } else {
            if (this.matchesMoveUpKeystroke(event)) {
                return [MoveViewportAction.create(0, -offsetY)];
            } else if (this.matchesMoveDownKeystroke(event)) {
                return [MoveViewportAction.create(0, offsetY)];
            } else if (this.matchesMoveRightKeystroke(event)) {
                return [MoveViewportAction.create(offsetX, 0)];
            } else if (this.matchesMoveLeftKeystroke(event)) {
                return [MoveViewportAction.create(-offsetX, 0)];
            }
        }
        return [];
    }

    protected matchesMoveUpKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.tool.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowUp') || (!!unsnap && matchesKeystroke(event, 'ArrowUp', unsnap));
    }

    protected matchesMoveDownKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.tool.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowDown') || (!!unsnap && matchesKeystroke(event, 'ArrowDown', unsnap));
    }

    protected matchesMoveRightKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.tool.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowRight') || (!!unsnap && matchesKeystroke(event, 'ArrowRight', unsnap));
    }

    protected matchesMoveLeftKeystroke(event: KeyboardEvent): boolean {
        const unsnap = this.tool.changeBoundsManager.unsnapModifier();
        return matchesKeystroke(event, 'ArrowLeft') || (!!unsnap && matchesKeystroke(event, 'ArrowLeft', unsnap));
    }
}
