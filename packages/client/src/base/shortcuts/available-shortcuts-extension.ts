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

import { GModelRoot, matchesKeystroke, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { groupBy } from 'lodash';
import { GLSPAbstractUIExtension } from '../../base/ui-extension/ui-extension';
import { messages } from '../messages';
import type { IShortcutManager, ShortcutRegistration } from './shortcuts-manager';

@injectable()
export class AvailableShortcutsUIExtension extends GLSPAbstractUIExtension {
    static readonly ID = 'key-shortcut';
    protected container: HTMLDivElement;
    protected shortcutsContainer: HTMLDivElement;

    @inject(TYPES.IShortcutManager)
    protected readonly shortcutManager: IShortcutManager;

    id(): string {
        return AvailableShortcutsUIExtension.ID;
    }

    containerClass(): string {
        return AvailableShortcutsUIExtension.ID;
    }

    override show(root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
        super.show(root, ...contextElementIds);
        this.shortcutsContainer.focus();
        this.toDisposeOnHide.push(this.shortcutManager.onDidChange(() => this.refreshUI()));
    }

    protected refreshUI(): void {
        this.shortcutsContainer.innerHTML = '';

        const registrations = this.shortcutManager.getRegistrations();
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
        groupTable.classList.add('shortcut-table');
        const tableHead = document.createElement('thead');
        const tableBody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        const commandCell = document.createElement('th');
        const keybindingCell = document.createElement('th');

        commandCell.classList.add('column-title');

        commandCell.innerText = messages.shortcut.header_command;
        keybindingCell.innerText = messages.shortcut.header_shortcut;

        headerRow.appendChild(commandCell);
        headerRow.appendChild(keybindingCell);
        tableHead.appendChild(headerRow);

        for (const [group, shortcuts] of Object.entries(grouped)) {
            tableBody.appendChild(this.createGroupHeader(group));
            shortcuts.forEach(s => {
                tableBody.appendChild(this.createEntry(s));
            });
        }

        groupTable.appendChild(tableHead);
        groupTable.appendChild(tableBody);

        this.shortcutsContainer.append(groupTable);
    }

    protected createGroupHeader(group: string): HTMLElement {
        const entryRow = document.createElement('tr');
        const groupElement = document.createElement('td');
        const text = document.createElement('strong');
        const emptyElement = document.createElement('td');

        text.innerText = group;
        groupElement.appendChild(text);
        entryRow.appendChild(groupElement);
        entryRow.appendChild(emptyElement);

        return entryRow;
    }

    protected getShortcutHTML(shortcuts: string[]): HTMLElement {
        const shortcutKeys = document.createElement('span');
        shortcutKeys.innerHTML = shortcuts.map(key => `<kbd>${key}</kbd>`).join(' + ');

        return shortcutKeys;
    }

    protected createEntry(registration: ShortcutRegistration): HTMLDivElement {
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
        menuTitle.innerText = messages.shortcut.title;
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
        containerElement.ariaLabel = messages.shortcut.menu_title;

        this.refreshUI();
    }
}
