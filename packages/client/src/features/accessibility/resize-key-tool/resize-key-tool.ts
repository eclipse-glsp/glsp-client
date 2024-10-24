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

import { Action, GModelElement, IActionDispatcher, ISnapper, KeyListener, KeyTool, matchesKeystroke, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { SelectionService } from '../../../base/selection-service';
import { EnableDefaultToolsAction, EnableToolsAction, Tool } from '../../../base/tool-manager/tool';
import { IMovementRestrictor } from '../../change-bounds/movement-restrictor';
import { AccessibleKeyShortcutProvider, SetAccessibleKeyShortcutAction } from '../key-shortcut/accessible-key-shortcut';
import * as messages from '../toast/messages.json';
import { ShowToastMessageAction } from '../toast/toast-handler';
import { ResizeElementAction, ResizeType } from './resize-key-handler';

@injectable()
export class ResizeKeyTool implements Tool {
    static ID = 'glsp.resize-key-tool';

    isEditTool = true;

    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(TYPES.IMovementRestrictor) @optional() readonly movementRestrictor?: IMovementRestrictor;
    @inject(TYPES.ISnapper) @optional() readonly snapper?: ISnapper;
    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: IActionDispatcher;
    @inject(SelectionService) readonly selectionService: SelectionService;

    protected resizeKeyListener: ResizeKeyListener = new ResizeKeyListener(this);

    get id(): string {
        return ResizeKeyTool.ID;
    }

    enable(): void {
        this.keytool.register(this.resizeKeyListener);
        this.resizeKeyListener.registerShortcutKey();
    }

    disable(): void {
        this.keytool.deregister(this.resizeKeyListener);
    }
}
@injectable()
export class ResizeKeyListener extends KeyListener implements AccessibleKeyShortcutProvider {
    protected isEditMode = false;
    protected readonly token = ResizeKeyListener.name;

    constructor(protected readonly tool: ResizeKeyTool) {
        super();
    }

    registerShortcutKey(): void {
        this.tool.actionDispatcher.dispatchOnceModelInitialized(
            SetAccessibleKeyShortcutAction.create({
                token: this.token,
                keys: [
                    { shortcuts: ['ALT', 'A'], description: 'Activate resize mode for selected element', group: 'Resize', position: 0 },
                    { shortcuts: ['+'], description: 'Increase size of element', group: 'Resize', position: 1 },
                    { shortcuts: ['-'], description: 'Increase size of element', group: 'Resize', position: 2 },
                    { shortcuts: ['CTRL', '0'], description: 'Set element size to default', group: 'Resize', position: 3 }
                ]
            })
        );
    }

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        const actions = [];
        const selectedElementsIds = this.tool.selectionService.getSelectedElementIDs();

        if (this.isEditMode && this.matchesDeactivateResizeModeKeystroke(event)) {
            this.isEditMode = false;

            this.tool.actionDispatcher.dispatch(
                ShowToastMessageAction.createWithTimeout({
                    id: Symbol.for(ResizeKeyListener.name),
                    message: messages.resize.resize_mode_deactivated
                })
            );

            actions.push(EnableDefaultToolsAction.create());
        }

        if (selectedElementsIds.length > 0) {
            if (!this.isEditMode && this.matchesActivateResizeModeKeystroke(event)) {
                this.isEditMode = true;
                this.tool.actionDispatcher.dispatch(
                    ShowToastMessageAction.create({
                        id: Symbol.for(ResizeKeyListener.name),
                        message: messages.resize.resize_mode_activated
                    })
                );
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
