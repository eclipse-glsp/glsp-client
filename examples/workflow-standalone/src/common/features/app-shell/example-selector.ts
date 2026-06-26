/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import { EXAMPLES, ExampleEntry } from '../../examples-manifest';

/** URL parameter that selects the initially loaded example. */
export const SOURCE_PARAM = 'source';

/** `localStorage` key persisting the collapsed state (e.g. across a manual page reload). */
const COLLAPSED_KEY = 'glsp-examples-collapsed';
const COLLAPSED_CLASS = 'example-selector--collapsed';

/** Invoked when the user picks an example; the host swaps the diagram in place. */
export type ExampleSelectionListener = (entry: ExampleEntry) => void;

/**
 * Renders the left-side example selector: a collapsible, explorer-style list of the
 * bundled {@link EXAMPLES}, grouped by language, with the active entry highlighted.
 *
 * The panel lives in the app shell (outside the diagram container) so it survives a
 * language switch. Selecting an entry invokes {@link onSelect}; the host swaps the
 * diagram in place (no page reload), and the active highlight is updated here.
 */
export function renderExampleSelector(panel: HTMLElement, activeId: string, onSelect: ExampleSelectionListener): void {
    panel.replaceChildren();
    panel.classList.add('example-selector--ready');
    panel.classList.toggle(COLLAPSED_CLASS, isCollapsed());

    // Shown only while collapsed: a slim rail with a single button to re-expand.
    const expand = createIconButton('es-expand', 'Show examples', '»');
    expand.addEventListener('click', () => setCollapsed(panel, false));

    const header = document.createElement('div');
    header.className = 'es-header';
    const title = document.createElement('span');
    title.className = 'es-title';
    title.textContent = 'Examples';
    const collapse = createIconButton('es-collapse', 'Hide examples', '«');
    collapse.addEventListener('click', () => setCollapsed(panel, true));
    header.append(title, collapse);

    const groups = document.createElement('div');
    groups.className = 'es-groups';
    for (const [group, entries] of groupByLanguage(EXAMPLES)) {
        groups.appendChild(createGroup(group, entries, activeId, onSelect));
    }

    panel.append(expand, header, groups);
}

function isCollapsed(): boolean {
    try {
        return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
        return false;
    }
}

function setCollapsed(panel: HTMLElement, collapsed: boolean): void {
    panel.classList.toggle(COLLAPSED_CLASS, collapsed);
    try {
        localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
        // ignore — collapsing still works for the current session without persistence
    }
}

function createIconButton(className: string, label: string, glyph: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = `<span aria-hidden="true">${glyph}</span>`;
    return button;
}

/** Groups the entries by language, preserving first-seen order. */
function groupByLanguage(entries: ExampleEntry[]): Map<string, ExampleEntry[]> {
    const groups = new Map<string, ExampleEntry[]>();
    for (const entry of entries) {
        const bucket = groups.get(entry.group) ?? [];
        bucket.push(entry);
        groups.set(entry.group, bucket);
    }
    return groups;
}

function createGroup(group: string, entries: ExampleEntry[], activeId: string, onSelect: ExampleSelectionListener): HTMLElement {
    const section = document.createElement('div');
    section.className = 'es-group';
    // A language slug drives the per-language accent colour (see app.css).
    section.dataset.language = slug(group);

    const header = document.createElement('div');
    header.className = 'es-group-header';
    header.innerHTML = `<span class="es-dot" aria-hidden="true"></span><span class="es-group-name">${group}</span>`;

    const list = document.createElement('div');
    list.className = 'es-list';
    entries.forEach(entry => list.appendChild(createRow(entry, activeId, onSelect)));

    section.append(header, list);
    return section;
}

function createRow(entry: ExampleEntry, activeId: string, onSelect: ExampleSelectionListener): HTMLElement {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'es-row';
    row.textContent = entry.file;
    if (entry.id === activeId) {
        row.classList.add('es-row--active');
        row.setAttribute('aria-current', 'true');
    }
    row.addEventListener('click', () => {
        if (row.classList.contains('es-row--active')) {
            return;
        }
        setActiveRow(row);
        onSelect(entry);
    });
    return row;
}

/** Moves the active highlight to the given row. */
function setActiveRow(row: HTMLElement): void {
    row.closest('.example-selector')
        ?.querySelectorAll('.es-row')
        .forEach(other => {
            other.classList.remove('es-row--active');
            other.removeAttribute('aria-current');
        });
    row.classList.add('es-row--active');
    row.setAttribute('aria-current', 'true');
}

function slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
