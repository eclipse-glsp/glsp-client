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

import { injectable } from 'inversify';
import { groupBy } from 'lodash';
import { AbstractUIExtension, Action, IActionHandler, ICommand, matchesKeystroke, SModelRoot } from '~glsp-sprotty';

export interface AccessibleKeyShortcutProvider {
    registerShortcutKey(): void;
}

export interface AccessibleKeyShortcut {
    shortcuts: string[];
    description: string;
    group: string;
    position: number;
}

export interface SetAccessibleKeyShortcutAction extends Action {
    kind: typeof SetAccessibleKeyShortcutAction.KIND;
    token: string;
    keys: AccessibleKeyShortcut[];
}

export namespace SetAccessibleKeyShortcutAction {
    export const KIND = 'setAccessibleKeyShortcut';

    export function is(object: any): object is SetAccessibleKeyShortcutAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { token: string; keys: AccessibleKeyShortcut[] }): SetAccessibleKeyShortcutAction {
        return { kind: KIND, token: options.token, keys: options.keys };
    }
}

@injectable()
export class KeyShortcutUIExtension extends AbstractUIExtension implements IActionHandler {
    static readonly ID = 'key-shortcut';
    protected container: HTMLDivElement;
    protected shortcutsContainer: HTMLDivElement;
    protected registrations: Record<string, AccessibleKeyShortcut[]> = {};

    handle(action: Action): ICommand | Action | void {
        if (SetAccessibleKeyShortcutAction.is(action)) {
            this.registrations[action.token] = action.keys;
            if (this.containerElement) {
                this.refreshUI();
            }
        }
    }
    id(): string {
        return KeyShortcutUIExtension.ID;
    }

    containerClass(): string {
        return KeyShortcutUIExtension.ID;
    }

    override show(root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        super.show(root, ...contextElementIds);
        this.shortcutsContainer.focus();
    }

    protected refreshUI(): void {
        this.shortcutsContainer.innerHTML = '';

        const registrations = Object.values(this.registrations).flatMap(r => r);
        registrations.sort((a, b) => {
            if (a.group < b.group) {
                return -1;
            }
            if (a.group > b.group) {
                return 1;
            }

            return a.position - b.position;
        });

        const grouped = groupBy(registrations, k => k.group);

        const groupTable = document.createElement('table');
        const tableHead = document.createElement('thead');
        const tableBody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        const commandCell = document.createElement('th');
        const keybindingCell = document.createElement('th');

        commandCell.classList.add('columnTitle');
        commandCell.classList.add('columnTitle');

        commandCell.innerText = 'Command';
        keybindingCell.innerText = 'Keybinding';

        headerRow.appendChild(commandCell);
        headerRow.appendChild(keybindingCell);
        tableHead.appendChild(headerRow);

        for (const [, shortcuts] of Object.entries(grouped)) {
            shortcuts.forEach(s => {
                tableBody.appendChild(this.createEntry(s));
            });
        }

        groupTable.appendChild(tableHead);
        groupTable.appendChild(tableBody);

        this.shortcutsContainer.append(groupTable);
    }

    protected getShortcutHTML(shortcuts: string[]): HTMLElement {
        const shortcutKeys = document.createElement('span');
        shortcutKeys.innerHTML = shortcuts.map(key => `<kbd>${key}</kbd>`).join(' + ');

        return shortcutKeys;
    }

    protected createEntry(registration: AccessibleKeyShortcut): HTMLDivElement {
        const entryRow = document.createElement('tr');
        const shortcutElement = document.createElement('td');
        const descElement = document.createElement('td');

        const shortcut = this.getShortcutHTML(registration.shortcuts);
        descElement.innerText = registration.description;

        shortcutElement.appendChild(shortcut);
        entryRow.appendChild(descElement);
        entryRow.appendChild(shortcutElement);

        return entryRow;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.container = document.createElement('div');
        this.container.classList.add('keyboard-shortcuts-menu');

        // create title
        const menuTitle = document.createElement('h3');
        menuTitle.classList.add('menu-header');
        menuTitle.innerText = 'Keyboard Shortcuts';
        this.container.appendChild(menuTitle);

        const closeBtn = document.createElement('button');
        closeBtn.id = 'key-shortcut-close-btn';
        closeBtn.textContent = 'x';
        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        this.container.appendChild(closeBtn);

        // create shortcuts container
        this.shortcutsContainer = document.createElement('div');
        this.shortcutsContainer.classList.add('keyboard-shortcuts-container');
        this.shortcutsContainer.tabIndex = 30;
        this.shortcutsContainer.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape' || matchesKeystroke(event, 'KeyH', 'alt')) {
                this.hide();
            }
        });

        this.container.appendChild(this.shortcutsContainer);
        containerElement.appendChild(this.container);
        containerElement.ariaLabel = 'Shortcut-Menu';

        this.refreshUI();
    }
}
