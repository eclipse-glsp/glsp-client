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
import '../../../../css/keyboard.css';

import { Action, ICommand, matchesKeystroke, SetUIExtensionVisibilityAction } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { KeyboardPointerMetadata } from '../keyboard-pointer/constants';
import { KeyboardPointer } from '../keyboard-pointer/keyboard-pointer';
import { KeyboardNodeGridMetadata } from './constants';
import { KeyboardGrid } from './keyboard-grid';
import { GridSearchPaletteMetadata } from './keyboard-grid-search-palette';

@injectable()
export class KeyboardNodeGrid extends KeyboardGrid {
    @inject(KeyboardPointer) protected readonly keyboardPointer: KeyboardPointer;

    protected override triggerActions = [SetUIExtensionVisibilityAction.create({ extensionId: KeyboardPointerMetadata.ID, visible: true })];
    protected override originId = KeyboardPointerMetadata.ID;

    override id(): string {
        return KeyboardNodeGridMetadata.ID;
    }

    override handle(action: Action): void | Action | ICommand {
        // Do nothing
    }

    protected override onKeyDown(event: KeyboardEvent): void {
        super.onKeyDown(event);
        this.showSearchOnEvent(event);

        if (this.keyboardPointer.isVisible) {
            this.keyboardPointer.getKeyListener.keyDown(event);
        }
    }

    protected showSearchOnEvent(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'KeyF', 'ctrl')) {
            event.preventDefault();
            this.actionDispatcher.dispatch(
                SetUIExtensionVisibilityAction.create({
                    extensionId: GridSearchPaletteMetadata.ID,
                    visible: true
                })
            );
            this.hide();
        }
    }
}
