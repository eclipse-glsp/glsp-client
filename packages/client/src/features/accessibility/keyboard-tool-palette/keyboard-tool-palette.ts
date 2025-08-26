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
import {
    Action,
    ICommand,
    KeyCode,
    matchesKeystroke,
    PaletteItem,
    RequestContextActions,
    RequestMarkersAction,
    SetContextActions,
    SetUIExtensionVisibilityAction,
    TriggerNodeCreationAction
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { messages } from '../../../base/messages';
import { EnableDefaultToolsAction, EnableToolsAction } from '../../../base/tool-manager/tool';
import { compare, createIcon, createToolGroup, EnableToolPaletteAction, ToolPalette } from '../../tool-palette/tool-palette';
import { MouseDeleteTool } from '../../tools/deletion/delete-tool';
import { MarqueeMouseTool } from '../../tools/marquee-selection/marquee-mouse-tool';
import { FocusDomAction } from '../actions';
import { EdgeAutocompletePaletteMetadata } from '../edge-autocomplete/edge-autocomplete-palette';
import { ElementNavigatorKeyListener } from '../element-navigation/diagram-navigation-tool';
import { KeyboardNodeGridMetadata } from '../keyboard-grid/constants';
import { ShowToastMessageAction } from '../toast/toast-handler';

const SEARCH_ICON_ID = 'search';
const SELECTION_TOOL_KEY: KeyCode[] = ['Digit1', 'Numpad1'];
const DELETION_TOOL_KEY: KeyCode[] = ['Digit2', 'Numpad2'];
const MARQUEE_TOOL_KEY: KeyCode[] = ['Digit3', 'Numpad3'];
const VALIDATION_TOOL_KEY: KeyCode[] = ['Digit4', 'Numpad4'];
const SEARCH_TOOL_KEY: KeyCode[] = ['Digit5', 'Numpad5'];
const SHOW_SHORTCUTS_CLASS = 'accessibility-show-shortcuts';

const AVAILABLE_KEYS: KeyCode[] = [
    'KeyA',
    'KeyB',
    'KeyC',
    'KeyD',
    'KeyE',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyI',
    'KeyJ',
    'KeyK',
    'KeyL',
    'KeyM',
    'KeyN',
    'KeyO',
    'KeyP',
    'KeyQ',
    'KeyR',
    'KeyS',
    'KeyT',
    'KeyU',
    'KeyV',
    'KeyX',
    'KeyY',
    'KeyZ'
];

const HEADER_TOOL_KEYS: KeyCode[][] = [SELECTION_TOOL_KEY, DELETION_TOOL_KEY, MARQUEE_TOOL_KEY, VALIDATION_TOOL_KEY, SEARCH_TOOL_KEY];

@injectable()
export class KeyboardToolPalette extends ToolPalette {
    protected deleteToolButton: HTMLElement;
    protected marqueeToolButton: HTMLElement;
    protected validateToolButton: HTMLElement;
    protected searchToolButton: HTMLElement;

    protected keyboardIndexButtonMapping = new Map<number, HTMLElement>();
    protected headerToolsButtonMapping = new Map<number, HTMLElement>();

    protected get interactablePaletteItems(): PaletteItem[] {
        return this.paletteItems
            .sort(compare)
            .map(item => item.children?.sort(compare) ?? [item])
            .reduce((acc, val) => acc.concat(val), []);
    }

    protected override initializeContents(_containerElement: HTMLElement): void {
        this.containerElement.setAttribute('aria-label', messages.tool_palette.label);
        this.containerElement.tabIndex = 20;
        this.containerElement.classList.add('accessibility-tool-palette');
        this.addMinimizePaletteButton();
        this.createHeader();
        this.createBody();
        this.lastActiveButton = this.defaultToolsButton;

        this.containerElement.onkeyup = ev => {
            this.clearToolOnEscape(ev);
            if (this.isShortcutsVisible()) {
                this.selectItemOnCharacter(ev);
                this.triggerHeaderToolsByKey(ev);
            }
        };
    }

    override handle(action: Action): ICommand | Action | void {
        if (EnableToolPaletteAction.is(action)) {
            const requestAction = RequestContextActions.create({
                contextId: ToolPalette.ID,
                editorContext: {
                    selectedElementIds: []
                }
            });
            this.actionDispatcher.requestUntil(requestAction).then(response => {
                if (SetContextActions.is(response)) {
                    this.paletteItems = response.actions.map(e => e as PaletteItem);
                    this.actionDispatcher.dispatchAll([
                        SetUIExtensionVisibilityAction.create({ extensionId: ToolPalette.ID, visible: !this.editorContext.isReadonly })
                    ]);
                }
            });
        } else if (FocusDomAction.is(action) && action.id === ToolPalette.ID) {
            if (this.containerElement.contains(document.activeElement)) {
                this.toggleShortcutVisibility();
            } else {
                this.showShortcuts();
            }
            this.containerElement.focus();
        } else {
            super.handle(action);
        }
    }

    protected override createBody(): void {
        const bodyDiv = document.createElement('div');
        bodyDiv.classList.add('palette-body');
        const tabIndex = 21;
        let toolButtonCounter = 0;

        this.keyboardIndexButtonMapping.clear();
        this.paletteItems.sort(compare).forEach(item => {
            if (item.children) {
                const group = createToolGroup(item);
                item.children.sort(compare).forEach(child => {
                    const button = this.createKeyboardToolButton(child, tabIndex, toolButtonCounter);
                    group.appendChild(button);
                    this.keyboardIndexButtonMapping.set(toolButtonCounter, button);
                    toolButtonCounter++;
                });
                bodyDiv.appendChild(group);
            } else {
                const button = this.createKeyboardToolButton(item, tabIndex, toolButtonCounter);
                bodyDiv.appendChild(button);
                this.keyboardIndexButtonMapping.set(toolButtonCounter, button);
                toolButtonCounter++;
            }
        });

        if (this.paletteItems.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.innerText = messages.tool_palette.no_items;
            noResultsDiv.classList.add('tool-button');
            bodyDiv.appendChild(noResultsDiv);
        }
        // Replace existing body to refresh filtered entries
        if (this.bodyDiv) {
            this.containerElement.removeChild(this.bodyDiv);
        }
        this.containerElement.appendChild(bodyDiv);
        this.bodyDiv = bodyDiv;
    }

    protected override createHeaderTools(): HTMLElement {
        this.headerToolsButtonMapping.clear();
        let mappingIndex = 0;

        const headerTools = document.createElement('div');
        headerTools.classList.add('header-tools');

        this.defaultToolsButton = this.createDefaultToolButton();
        this.headerToolsButtonMapping.set(mappingIndex++, this.defaultToolsButton);
        headerTools.appendChild(this.defaultToolsButton);

        this.deleteToolButton = this.createMouseDeleteToolButton();
        this.headerToolsButtonMapping.set(mappingIndex++, this.deleteToolButton);
        headerTools.appendChild(this.deleteToolButton);

        this.marqueeToolButton = this.createMarqueeToolButton();
        this.headerToolsButtonMapping.set(mappingIndex++, this.marqueeToolButton);
        headerTools.appendChild(this.marqueeToolButton);

        this.validateToolButton = this.createValidateButton();
        this.headerToolsButtonMapping.set(mappingIndex++, this.validateToolButton);
        headerTools.appendChild(this.validateToolButton);

        const resetViewportButton = this.createResetViewportButton();
        this.headerToolsButtonMapping.set(mappingIndex++, resetViewportButton);
        headerTools.appendChild(resetViewportButton);

        if (this.gridManager) {
            const toggleGridButton = this.createToggleGridButton();
            this.headerToolsButtonMapping.set(mappingIndex++, toggleGridButton);
            headerTools.appendChild(toggleGridButton);
        }

        if (this.debugManager) {
            const toggleDebugButton = this.createToggleDebugButton();
            this.headerToolsButtonMapping.set(mappingIndex++, toggleDebugButton);
            headerTools.appendChild(toggleDebugButton);
        }

        // Create button for Search
        this.searchToolButton = this.createSearchButton();
        this.headerToolsButtonMapping.set(mappingIndex++, this.searchToolButton);
        headerTools.appendChild(this.searchToolButton);

        return headerTools;
    }

    protected override createDefaultToolButton(): HTMLElement {
        const button = createIcon('inspect');
        button.id = 'btn_default_tools';
        button.title = messages.tool_palette.selection_button;
        button.onclick = this.onClickStaticToolButton(button);
        button.appendChild(this.createKeyboardShotcut(SELECTION_TOOL_KEY[0]));

        return button;
    }

    protected override createMouseDeleteToolButton(): HTMLElement {
        const deleteToolButton = createIcon('chrome-close');
        deleteToolButton.title = messages.tool_palette.delete_button;
        deleteToolButton.onclick = this.onClickStaticToolButton(deleteToolButton, MouseDeleteTool.ID);
        deleteToolButton.appendChild(this.createKeyboardShotcut(DELETION_TOOL_KEY[0]));

        return deleteToolButton;
    }

    protected override createMarqueeToolButton(): HTMLElement {
        const marqueeToolButton = createIcon('screen-full');
        marqueeToolButton.title = messages.tool_palette.marquee_button;
        const toastMessageAction = ShowToastMessageAction.createWithTimeout({
            id: Symbol.for(ElementNavigatorKeyListener.name),
            message: messages.tool_palette.marquee_message
        });
        marqueeToolButton.onclick = this.onClickStaticToolButton(marqueeToolButton, MarqueeMouseTool.ID, toastMessageAction);
        marqueeToolButton.appendChild(this.createKeyboardShotcut(MARQUEE_TOOL_KEY[0]));

        return marqueeToolButton;
    }

    protected override createValidateButton(): HTMLElement {
        const validateToolButton = createIcon('pass');
        validateToolButton.title = messages.tool_palette.validate_button;
        validateToolButton.onclick = _event => {
            const modelIds: string[] = [this.modelRootId];
            this.actionDispatcher.dispatch(RequestMarkersAction.create(modelIds));
        };
        validateToolButton.appendChild(this.createKeyboardShotcut(VALIDATION_TOOL_KEY[0]));

        return validateToolButton;
    }

    protected override onClickStaticToolButton(button: HTMLElement, toolId?: string, action?: Action) {
        return (_ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                const defaultAction = toolId ? EnableToolsAction.create([toolId]) : EnableDefaultToolsAction.create();
                if (action) {
                    this.actionDispatcher.dispatchAll([defaultAction, action]);
                } else {
                    this.actionDispatcher.dispatchAll([defaultAction]);
                }
                this.changeActiveButton(button);
                button.focus();
            }
        };
    }
    protected override createSearchButton(): HTMLElement {
        const searchIcon = createIcon(SEARCH_ICON_ID);
        searchIcon.onclick = _ev => {
            const searchField = document.getElementById(this.containerElement.id + '_search_field');
            if (searchField) {
                if (searchField.style.display === 'none') {
                    searchField.style.display = '';
                    searchField.focus();
                } else {
                    searchField.style.display = 'none';
                }
            }
        };
        searchIcon.classList.add('search-icon');
        searchIcon.title = messages.tool_palette.search_button;
        searchIcon.appendChild(this.createKeyboardShotcut(SEARCH_TOOL_KEY[0]));

        return searchIcon;
    }

    protected override createHeaderSearchField(): HTMLInputElement {
        const searchField = document.createElement('input');
        searchField.classList.add('search-input');
        searchField.tabIndex = 21;
        searchField.id = this.containerElement.id + '_search_field';
        searchField.type = 'text';
        searchField.placeholder = messages.tool_palette.search_placeholder;
        searchField.style.display = 'none';
        searchField.onkeyup = ev => {
            this.requestFilterUpdate(this.searchField.value);
            ev.stopPropagation();

            if (searchField.value === '') {
                this.focusToolPaletteOnEscape(ev);
            } else {
                this.clearOnEscape(ev);
            }
        };

        return searchField;
    }

    protected focusToolPaletteOnEscape(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.containerElement.focus();
        }
    }

    protected createKeyboardShotcut(keyShortcut: KeyCode): HTMLElement {
        const hint = document.createElement('div');
        hint.classList.add('key-shortcut');
        let keyShortcutValue = keyShortcut.toString();

        if (keyShortcut.includes('Key')) {
            keyShortcutValue = keyShortcut.toString().substring(3);
        } else if (keyShortcut.includes('Digit')) {
            keyShortcutValue = keyShortcut.toString().substring(5);
        }
        hint.innerHTML = keyShortcutValue;
        return hint;
    }

    protected createKeyboardToolButton(item: PaletteItem, tabIndex: number, buttonIndex: number): HTMLElement {
        const button = document.createElement('div');
        // add keyboard index
        if (buttonIndex < AVAILABLE_KEYS.length) {
            button.appendChild(this.createKeyboardShotcut(AVAILABLE_KEYS[buttonIndex]));
        }
        button.tabIndex = tabIndex;
        button.classList.add('tool-button');
        if (item.icon) {
            button.appendChild(createIcon(item.icon));
        }
        button.insertAdjacentText('beforeend', item.label);
        button.onclick = this.onClickCreateToolButton(button, item);

        button.onkeydown = ev => {
            this.clickToolOnEnter(ev, button, item);
            this.clearToolOnEscape(ev);

            if (matchesKeystroke(ev, 'ArrowDown')) {
                if (buttonIndex + 1 > this.keyboardIndexButtonMapping.size - 1) {
                    this.selectItemViaArrowKey(this.keyboardIndexButtonMapping.get(0));
                } else {
                    this.selectItemViaArrowKey(this.keyboardIndexButtonMapping.get(buttonIndex + 1));
                }
            } else if (matchesKeystroke(ev, 'ArrowUp')) {
                if (buttonIndex - 1 < 0) {
                    this.selectItemViaArrowKey(this.keyboardIndexButtonMapping.get(this.keyboardIndexButtonMapping.size - 1));
                } else {
                    this.selectItemViaArrowKey(this.keyboardIndexButtonMapping.get(buttonIndex - 1));
                }
            }
        };

        return button;
    }

    protected clickToolOnEnter(event: KeyboardEvent, button: HTMLElement, item: PaletteItem): void {
        if (matchesKeystroke(event, 'Enter')) {
            if (!this.editorContext.isReadonly) {
                this.actionDispatcher.dispatchAll(item.actions);
                this.changeActiveButton(button);
                this.selectItemOnCharacter(event);
            }
        }
    }

    protected selectItemOnCharacter(event: KeyboardEvent): void {
        let index: number | undefined = undefined;
        const items = this.interactablePaletteItems;

        const itemsCount = items.length < AVAILABLE_KEYS.length ? items.length : AVAILABLE_KEYS.length;

        for (let i = 0; i < itemsCount; i++) {
            const keycode = AVAILABLE_KEYS[i];
            if (matchesKeystroke(event, keycode)) {
                index = i;
                break;
            }
        }

        if (index !== undefined) {
            if (items[index].actions.some(a => a.kind === TriggerNodeCreationAction.KIND)) {
                this.actionDispatcher.dispatchAll([
                    ...items[index].actions,
                    SetUIExtensionVisibilityAction.create({
                        extensionId: KeyboardNodeGridMetadata.ID,
                        visible: true,
                        contextElementsId: []
                    })
                ]);
            } else {
                this.actionDispatcher.dispatchAll([
                    ...items[index].actions,
                    SetUIExtensionVisibilityAction.create({
                        extensionId: EdgeAutocompletePaletteMetadata.ID,
                        visible: true,
                        contextElementsId: []
                    })
                ]);
            }
            this.changeActiveButton(this.keyboardIndexButtonMapping.get(index));
            this.keyboardIndexButtonMapping.get(index)?.focus();
        }
    }

    protected triggerHeaderToolsByKey(event: KeyboardEvent): void {
        let index: number | undefined = undefined;

        for (let i = 0; i < HEADER_TOOL_KEYS.length; i++) {
            for (let j = 0; j < HEADER_TOOL_KEYS[i].length; j++) {
                const keycode = HEADER_TOOL_KEYS[i][j];

                if (matchesKeystroke(event, keycode)) {
                    event.stopPropagation();
                    event.preventDefault();
                    index = i;
                    break;
                }
            }
        }

        if (index !== undefined) {
            this.headerToolsButtonMapping.get(index)?.click();
        }
    }

    protected selectItemViaArrowKey(currentButton: HTMLElement | undefined): void {
        if (currentButton !== undefined) {
            this.changeActiveButton(currentButton);
            currentButton?.focus();
        }
    }

    protected override clearToolOnEscape(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'Escape')) {
            if (event.target instanceof HTMLElement) {
                event.target.blur();
            }
            this.actionDispatcher.dispatch(EnableDefaultToolsAction.create());
        }
    }

    protected toggleShortcutVisibility(): void {
        if (this.isShortcutsVisible()) {
            this.hideShortcuts();
        } else {
            this.showShortcuts();
        }
    }

    protected isShortcutsVisible(): boolean {
        return this.containerElement.classList.contains(SHOW_SHORTCUTS_CLASS);
    }

    protected showShortcuts(): void {
        this.containerElement.classList.add(SHOW_SHORTCUTS_CLASS);
    }

    protected hideShortcuts(): void {
        this.containerElement.classList.remove(SHOW_SHORTCUTS_CLASS);
    }
}
