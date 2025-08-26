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
import { Action, matchesKeystroke, SetUIExtensionVisibilityAction, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { messages, repeatOnMessagesUpdated } from '../../base/messages';
import type { IShortcutManager } from '../../base/shortcuts/shortcuts-manager';
import { KeyboardGridMetadata, KeyboardNodeGridMetadata } from '../accessibility/keyboard-grid/constants';
import { ToolPalette } from '../tool-palette/tool-palette';
import { BaseEditTool } from '../tools/base-tools';
import { FocusDomAction } from './actions';
import { KeyboardPointerMetadata } from './keyboard-pointer/constants';

@injectable()
export class GlobalKeyListenerTool extends BaseEditTool {
    static ID = 'glsp.global-key-listener';
    static TOKEN = Symbol.for(GlobalKeyListenerTool.name);

    protected alreadyRegistered = false;

    @inject(TYPES.IShortcutManager)
    protected readonly shortcutManager: IShortcutManager;

    get id(): string {
        return GlobalKeyListenerTool.ID;
    }

    enable(): void {
        if (!this.alreadyRegistered) {
            this.alreadyRegistered = true;
            document.addEventListener('keyup', this.trigger.bind(this));

            repeatOnMessagesUpdated(() =>
                this.shortcutManager.register(GlobalKeyListenerTool.TOKEN, [
                    {
                        shortcuts: ['ALT', 'P'],
                        description: messages.focus.shortcut_focus_palette,
                        group: messages.shortcut.group_tool_palette,
                        position: 0
                    },
                    {
                        shortcuts: ['ALT', 'G'],
                        description: messages.focus.shortcut_focus_graph,
                        group: messages.shortcut.group_graph,
                        position: 0
                    }
                ])
            );
        }
    }

    trigger(event: KeyboardEvent): void {
        this.actionDispatcher.dispatchAll(this.handleKeyEvent(event));
    }

    protected handleKeyEvent(event: KeyboardEvent): Action[] {
        if (this.matchesSetFocusOnToolPalette(event)) {
            return [FocusDomAction.create(ToolPalette.ID)];
        } else if (this.matchesSetFocusOnDiagram(event)) {
            return [FocusDomAction.create('graph')];
        } else if (this.matchesReleaseFocusFromToolPalette(event)) {
            return [
                SetUIExtensionVisibilityAction.create({ extensionId: KeyboardPointerMetadata.ID, visible: false, contextElementsId: [] }),
                SetUIExtensionVisibilityAction.create({ extensionId: KeyboardGridMetadata.ID, visible: false, contextElementsId: [] }),
                SetUIExtensionVisibilityAction.create({ extensionId: KeyboardNodeGridMetadata.ID, visible: false, contextElementsId: [] })
            ];
        }
        return [];
    }

    protected matchesSetFocusOnToolPalette(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyP', 'alt');
    }
    protected matchesSetFocusOnDiagram(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyG', 'alt');
    }
    protected matchesReleaseFocusFromToolPalette(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }
}
