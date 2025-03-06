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

import { KeyListener, matchesKeystroke, TYPES, type Action, type GModelElement } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { Disposable } from 'vscode-jsonrpc';
import { SelectionService } from '../../../base/selection-service';
import * as messages from '../../accessibility/toast/messages.json';
import { ShowToastMessageAction } from '../../accessibility/toast/toast-handler';
import type { ShortcutManager } from '../../shortcuts/shortcuts-manager';
import { BaseEditTool } from '../../tools/base-tools';
import { ResizeElementAction, ResizeType } from './resize-handler';

@injectable()
export class ResizeKeyListener extends KeyListener {
    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        const actions = [];
        const selectedElementsIds = this.selectionService.getSelectedElementIDs();

        if (selectedElementsIds.length > 0) {
            if (this.matchesIncreaseSizeKeystroke(event)) {
                actions.push(ResizeElementAction.create(selectedElementsIds, ResizeType.Increase));
            } else if (this.matchesDecreaseSizeKeystroke(event)) {
                actions.push(ResizeElementAction.create(selectedElementsIds, ResizeType.Decrease));
            } else if (this.matchesMinSizeKeystroke(event)) {
                actions.push(ResizeElementAction.create(selectedElementsIds, ResizeType.MinSize));
            }
        }
        return actions;
    }

    enable(): Action[] {
        return [
            ShowToastMessageAction.create({
                id: ResizeKeyTool.TOKEN,
                message: messages.resize.resize_mode_activated
            })
        ];
    }

    disable(): Action[] {
        return [
            ShowToastMessageAction.createWithTimeout({
                id: ResizeKeyTool.TOKEN,
                message: messages.resize.resize_mode_deactivated
            })
        ];
    }

    protected matchesIncreaseSizeKeystroke(event: KeyboardEvent): boolean {
        /** here event.key is used for '+', as keycode 187 is already declared for 'Equals' in {@link matchesKeystroke}.*/
        return event.key === '+' || matchesKeystroke(event, 'NumpadAdd');
    }

    protected matchesMinSizeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Digit0', 'ctrl') || matchesKeystroke(event, 'Numpad0', 'ctrl');
    }

    protected matchesDecreaseSizeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Minus') || matchesKeystroke(event, 'NumpadSubtract');
    }
}

@injectable()
export class ResizeKeyTool extends BaseEditTool {
    static ID = 'glsp.resize-key-tool';
    static TOKEN = Symbol.for(ResizeKeyTool.name);

    get id(): string {
        return ResizeKeyTool.ID;
    }

    @inject(TYPES.IShortcutManager)
    protected readonly shortcutManager: ShortcutManager;
    @inject(ResizeKeyListener)
    protected readonly keyListener: ResizeKeyListener;

    enable(): void {
        this.dispatchActions(this.keyListener.enable());

        this.toDisposeOnDisable.push(
            this.keyTool.registerListener(this.keyListener),
            this.shortcutManager.register(ResizeKeyTool.TOKEN, [
                { shortcuts: ['Escape'], description: 'Deactivate resize handler ', group: 'Resize', position: 0 },
                { shortcuts: ['+'], description: 'Increase size of element', group: 'Resize', position: 1 },
                { shortcuts: ['-'], description: 'Increase size of element', group: 'Resize', position: 2 },
                { shortcuts: ['CTRL', '0'], description: 'Set element size to default', group: 'Resize', position: 3 }
            ]),
            Disposable.create(() => {
                this.dispatchActions(this.keyListener.disable());
            })
        );
    }
}
