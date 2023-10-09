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
import { inject, injectable } from 'inversify';
import { SetUIExtensionVisibilityAction, Action } from '@eclipse-glsp/sprotty';
import { Tool } from '../../base/tool-manager/tool';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { ToolPalette } from '../tool-palette/tool-palette';
import { FocusDomAction } from './actions';
import { KeyboardGridMetadata, KeyboardNodeGridMetadata } from '../accessibility/keyboard-grid/constants';
import { KeyboardPointerMetadata } from './keyboard-pointer/constants';
import { AccessibleKeyShortcutProvider, SetAccessibleKeyShortcutAction } from './key-shortcut/accessible-key-shortcut';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { KeyboardToolPalette } from './keyboard-tool-palette/keyboard-tool-palette';

@injectable()
export class GlobalKeyListenerTool implements Tool, AccessibleKeyShortcutProvider {
    static ID = 'glsp.global-key-listener';

    isEditTool = false;
    protected alreadyRegistered = false;

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    get id(): string {
        return GlobalKeyListenerTool.ID;
    }

    enable(): void {
        if (!this.alreadyRegistered) {
            this.alreadyRegistered = true;
            document.addEventListener('keyup', this.trigger.bind(this));
            this.registerShortcutKey();
        }
    }

    disable(): void {
        // It is not possible to remove the handlers after registration
        // The handlers need to be available all the time to work correctly
    }

    registerShortcutKey(): void {
        this.actionDispatcher.onceModelInitialized().then(() => {
            this.actionDispatcher.dispatchAll([
                SetAccessibleKeyShortcutAction.create({
                    token: KeyboardToolPalette.name,
                    keys: [{ shortcuts: ['ALT', 'P'], description: 'Focus on tool palette', group: 'Tool-Palette', position: 0 }]
                }),
                SetAccessibleKeyShortcutAction.create({
                    token: 'Graph',
                    keys: [{ shortcuts: ['ALT', 'G'], description: 'Focus on graph', group: 'Graph', position: 0 }]
                })
            ]);
        });
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
