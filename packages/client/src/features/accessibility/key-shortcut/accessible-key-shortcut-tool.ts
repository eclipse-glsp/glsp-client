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
import { Action, KeyListener, KeyTool, SModelElement, SetUIExtensionVisibilityAction, matchesKeystroke } from '~glsp-sprotty';
import { BaseEditTool } from '../../tools/base-tools';
import { KeyShortcutUIExtension } from './accessible-key-shortcut';

@injectable()
export class AccessibleKeyShortcutTool extends BaseEditTool {
    static ID = 'accessible-key-shortcut-tool';

    @inject(KeyTool) protected readonly keytool: KeyTool;

    protected shortcutKeyListener = new AccessibleShortcutKeyListener();

    get id(): string {
        return AccessibleKeyShortcutTool.ID;
    }

    enable(): void {
        this.keytool.register(this.shortcutKeyListener);
    }

    override disable(): void {
        this.keytool.deregister(this.shortcutKeyListener);
    }
}

export class AccessibleShortcutKeyListener extends KeyListener {
    protected readonly token = Symbol(AccessibleShortcutKeyListener.name);
    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (this.matchesActivateShortcutHelpKeystroke(event)) {
            return [SetUIExtensionVisibilityAction.create({ extensionId: KeyShortcutUIExtension.ID, visible: true })];
        }
        return [];
    }

    protected matchesActivateShortcutHelpKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyH', 'alt');
    }
}
