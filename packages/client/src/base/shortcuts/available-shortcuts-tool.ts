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

import { Action, GModelElement, KeyListener, SetUIExtensionVisibilityAction, matchesKeystroke } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { BaseTool } from '../../features/tools/base-tools';
import { AvailableShortcutsUIExtension } from './available-shortcuts-extension';

@injectable()
export class AvailableShortcutsTool extends BaseTool {
    static ID = 'available-shortcuts-tool';

    protected shortcutKeyListener = new AccessibleShortcutKeyListener();

    get id(): string {
        return AvailableShortcutsTool.ID;
    }

    enable(): void {
        this.toDisposeOnDisable.push(this.keyTool.registerListener(this.shortcutKeyListener));
    }
}

export class AccessibleShortcutKeyListener extends KeyListener {
    protected readonly token = Symbol(AccessibleShortcutKeyListener.name);
    override keyDown(element: GModelElement, event: KeyboardEvent): Action[] {
        if (this.matchesActivateShortcutHelpKeystroke(event)) {
            return [SetUIExtensionVisibilityAction.create({ extensionId: AvailableShortcutsUIExtension.ID, visible: true })];
        }
        return [];
    }

    protected matchesActivateShortcutHelpKeystroke(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'KeyH', 'alt');
    }
}
