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

import { Action, GModelElement, KeyListener, matchesKeystroke, SetUIExtensionVisibilityAction, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { messages, repeatOnMessagesUpdated } from '../../../base/messages';
import type { IShortcutManager } from '../../../base/shortcuts/shortcuts-manager';
import { BaseTool } from '../../tools/base-tools';
import { SearchAutocompletePalette } from './search-palette';

@injectable()
export class SearchAutocompletePaletteTool extends BaseTool {
    static readonly ID = 'glsp.search-autocomplete-palette-tool';
    static readonly TOKEN = Symbol.for(SearchAutocompletePaletteTool.ID);

    protected readonly keyListener = new SearchAutocompletePaletteKeyListener(this);
    @inject(TYPES.IShortcutManager)
    protected readonly shortcutManager: IShortcutManager;

    get id(): string {
        return SearchAutocompletePaletteTool.ID;
    }

    enable(): void {
        this.toDisposeOnDisable.push(
            this.keyTool.registerListener(this.keyListener),
            repeatOnMessagesUpdated(() =>
                this.shortcutManager.register(SearchAutocompletePaletteTool.TOKEN, [
                    {
                        shortcuts: ['CTRL', 'F'],
                        description: messages.search.shortcut_activate,
                        group: messages.shortcut.group_search,
                        position: 0
                    }
                ])
            )
        );
    }
}

export class SearchAutocompletePaletteKeyListener extends KeyListener {
    constructor(protected tool: SearchAutocompletePaletteTool) {
        super();
    }

    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        if (this.matchesSearchActivateKeystroke(event)) {
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: SearchAutocompletePalette.ID,
                    visible: true
                })
            ];
        }
        return [];
    }

    protected matchesSearchActivateKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyF', 'ctrl');
    }
}
