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

import { inject, injectable, optional } from 'inversify';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { Action, EnableDefaultToolsAction, EnableToolsAction, ISnapper, KeyListener, KeyTool, SModelElement, TYPES } from '~glsp-sprotty';
import { GLSPTool } from '../../../base/tool-manager/glsp-tool-manager';
import { IMovementRestrictor } from '../../change-bounds/movement-restrictor';
import { SelectionService } from '../../select/selection-service';
import { ResizeElementAction, ResizeType } from './resize-key-handler';

@injectable()
export class ResizeKeyTool implements GLSPTool {
    static ID = 'glsp.resize-key-tool';

    isEditTool = true;

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IMovementRestrictor) @optional() readonly movementRestrictor?: IMovementRestrictor;
    @inject(TYPES.ISnapper) @optional() readonly snapper?: ISnapper;
    @inject(TYPES.SelectionService) readonly selectionService: SelectionService;

    protected resizeKeyListener: ResizeKeyListener = new ResizeKeyListener(this);

    get id(): string {
        return ResizeKeyTool.ID;
    }

    enable(): void {
        this.keytool.register(this.resizeKeyListener);
    }

    disable(): void {
        this.keytool.deregister(this.resizeKeyListener);
    }
}
@injectable()
export class ResizeKeyListener extends KeyListener {
    protected isEditMode = false;

    constructor(protected readonly tool: ResizeKeyTool) {
        super();
    }

    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        const actions = [];
        const selectedElementsIds = this.tool.selectionService.getSelectedElementIDs();

        if (this.isEditMode && this.matchesDeactivateResizeModeKeystroke(event)) {
            this.isEditMode = false;
            actions.push(EnableDefaultToolsAction.create());
        }

        if (selectedElementsIds.length > 0) {
            if (!this.isEditMode && this.matchesActivateResizeModeKeystroke(event)) {
                this.isEditMode = true;
                actions.push(EnableToolsAction.create([ResizeKeyTool.ID]));
            }

            if (this.isEditMode) {
                if (this.matchesIncreaseSizeKeystroke(event)) {
                    actions.push(ResizeElementAction.create(selectedElementsIds, ResizeType.Increase));
                } else if (this.matchesDecreaseSizeKeystroke(event)) {
                    actions.push(ResizeElementAction.create(selectedElementsIds, ResizeType.Decrease));
                } else if (this.matchesMinSizeKeystroke(event)) {
                    actions.push(ResizeElementAction.create(selectedElementsIds, ResizeType.MinSize));
                }
            }
        }
        return actions;
    }

    protected matchesIncreaseSizeKeystroke(event: KeyboardEvent): boolean {
        /** here event.key is used for '+', as keycode 187 is already declared for 'Equals' in {@link matchesKeystroke}.*/
        return event.key === '+' || matchesKeystroke(event, 'NumpadAdd');
    }

    protected matchesActivateResizeModeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyA', 'alt');
    }

    protected matchesDeactivateResizeModeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }

    protected matchesMinSizeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Digit0', 'ctrl') || matchesKeystroke(event, 'Numpad0', 'ctrl');
    }

    protected matchesDecreaseSizeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Minus') || matchesKeystroke(event, 'NumpadSubtract');
    }
}
