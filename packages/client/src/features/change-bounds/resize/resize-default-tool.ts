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

import { KeyListener, matchesKeystroke, TYPES, type Action, type GModelElement, type IActionDispatcher } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { messages, repeatOnMessagesUpdated } from '../../../base/messages';
import { SelectionService } from '../../../base/selection-service';
import type { ShortcutManager } from '../../../base/shortcuts/shortcuts-manager';
import { EnableToolsAction } from '../../../base/tool-manager/tool';
import { BaseEditTool } from '../../tools/base-tools';
import { isResizable } from '../model';
import { ResizeKeyTool } from './resize-tool';

@injectable()
export class DefaultResizeKeyListener extends KeyListener {
    @inject(TYPES.IActionDispatcher)
    protected readonly actionDispatcher: IActionDispatcher;
    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        const selectedElementsIds = this.selectionService
            .getSelectedElements()
            .filter(isResizable)
            .map(e => e.id);

        if (selectedElementsIds.length > 0) {
            if (this.matchesActivateResizeModeKeystroke(event)) {
                return [EnableToolsAction.create([ResizeKeyTool.ID])];
            }
        }

        return [];
    }

    protected matchesActivateResizeModeKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyA', 'alt');
    }
}

@injectable()
export class DefaultResizeKeyTool extends BaseEditTool {
    static ID = 'glsp.default-resize-key-tool';
    static TOKEN = Symbol.for(DefaultResizeKeyTool.name);

    get id(): string {
        return DefaultResizeKeyTool.ID;
    }

    @inject(TYPES.IShortcutManager)
    protected readonly shortcutManager: ShortcutManager;
    @inject(DefaultResizeKeyListener)
    protected readonly keyListener: DefaultResizeKeyListener;

    enable(): void {
        this.toDisposeOnDisable.push(
            this.keyTool.registerListener(this.keyListener),
            repeatOnMessagesUpdated(() =>
                this.shortcutManager.register(DefaultResizeKeyTool.TOKEN, [
                    {
                        shortcuts: ['ALT', 'A'],
                        description: messages.resize.shortcut_activate,
                        group: messages.shortcut.group_resize,
                        position: 0
                    }
                ])
            )
        );
    }
}
