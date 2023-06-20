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
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { Action, KeyListener, KeyTool, SModelElement, SetUIExtensionVisibilityAction, Tool } from '~glsp-sprotty';
import { SearchAutocompletePalette } from './search-palette';

@injectable()
export class SearchAutocompletePaletteTool implements Tool {
    static readonly ID = 'glsp.search-autocomplete-palette-tool';

    protected readonly keyListener = new SearchAutocompletePaletteKeyListener();

    @inject(KeyTool) protected keyTool: KeyTool;

    get id(): string {
        return SearchAutocompletePaletteTool.ID;
    }

    enable(): void {
        this.keyTool.register(this.keyListener);
    }

    disable(): void {
        this.keyTool.deregister(this.keyListener);
    }
}

export class SearchAutocompletePaletteKeyListener extends KeyListener {
    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
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
