/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable, postConstruct } from "inversify";
import {
    AbstractUIExtension,
    Action,
    EnableDefaultToolsAction,
    EnableToolsAction,
    IActionHandler,
    ICommand,
    IToolManager,
    SetUIExtensionVisibilityAction,
    SModelRoot,
    TYPES
} from "sprotty";
import { matchesKeystroke } from "sprotty/lib/utils/keyboard";

import { GLSPActionDispatcher } from "../../base/action-dispatcher";
import { isSetContextActionsAction, RequestContextActions, SetContextActions } from "../../base/actions/context-actions";
import { EditModeListener, EditorContextService } from "../../base/editor-context";
import { MarqueeMouseTool } from "../tools/marquee-mouse-tool";
import { MouseDeleteTool } from "../tools/delete-tool";
import { RequestMarkersAction } from "../validation/validate";
import { PaletteItem } from "./palette-item";

const CLICKED_CSS_CLASS = "clicked";
const SEARCH_ICON = "fa-search";
const PALETTE_ICON = "fa-palette";
const CHEVRON_DOWN = "fa-chevron-down";
const PALETTE_HEIGHT = "500px";

@injectable()
export class EnableToolPaletteAction implements Action {
    static readonly KIND = "enableToolPalette";
    readonly kind = EnableToolPaletteAction.KIND;
}

@injectable()
export class ToolPalette extends AbstractUIExtension implements IActionHandler, EditModeListener {
    static readonly ID = "tool-palette";

    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: GLSPActionDispatcher;
    @inject(TYPES.IToolManager) protected readonly toolManager: IToolManager;
    @inject(EditorContextService) protected readonly editorContext: EditorContextService;

    protected paletteItems: PaletteItem[];
    protected paletteItemsCopy: PaletteItem[] = [];
    protected bodyDiv?: HTMLElement;
    protected lastActivebutton?: HTMLElement;
    protected defaultToolsButton: HTMLElement;
    protected searchField: HTMLInputElement;
    modelRootId: string;

    id() { return ToolPalette.ID; }
    containerClass() { return ToolPalette.ID; }

    @postConstruct()
    postConstruct(): void {
        this.editorContext.register(this);
    }

    initialize(): boolean {
        if (!this.paletteItems) {
            return false;
        }
        return super.initialize();
    }

    protected initializeContents(_containerElement: HTMLElement): void {
        this.createHeader();
        this.createBody();
        this.lastActivebutton = this.defaultToolsButton;
    }

    protected onBeforeShow(_containerElement: HTMLElement, root: Readonly<SModelRoot>) {
        this.modelRootId = root.id;
        this.containerElement.style.maxHeight = PALETTE_HEIGHT;
    }

    protected addMinimizePaletteButton(): void {
        const baseDiv = document.getElementById(this.options.baseDiv);
        const minPaletteDiv = document.createElement("div");
        minPaletteDiv.classList.add("minimize-palette-button");
        this.containerElement.classList.add("collapsible-palette");
        if (baseDiv) {
            const insertedDiv = baseDiv.insertBefore(minPaletteDiv, baseDiv.firstChild);
            const minimizeIcon = createIcon(["fas", CHEVRON_DOWN]);
            this.updateMinimizePaletteButtonTooltip(minPaletteDiv);
            minimizeIcon.onclick = _event => {
                if (this.isPaletteMaximized()) {
                    this.containerElement.style.maxHeight = "0px";
                } else {
                    this.containerElement.style.maxHeight = PALETTE_HEIGHT;
                }
                this.updateMinimizePaletteButtonTooltip(minPaletteDiv);
                changeCSSClass(minimizeIcon, PALETTE_ICON);
                changeCSSClass(minimizeIcon, "fa");
                changeCSSClass(minimizeIcon, "fas");
                changeCSSClass(minimizeIcon, CHEVRON_DOWN);
            };
            insertedDiv.appendChild(minimizeIcon);
        }
    }

    protected updateMinimizePaletteButtonTooltip(button: HTMLDivElement) {
        if (this.isPaletteMaximized()) {
            button.title = 'Minimize palette';
        } else {
            button.title = 'Maximize palette';
        }
    }

    protected isPaletteMaximized() {
        return this.containerElement && this.containerElement.style.maxHeight !== "0px";
    }

    protected createBody(): void {
        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("palette-body");
        let tabIndex = 0;
        this.paletteItems.sort(compare)
            .forEach(item => {
                if (item.children) {
                    const group = createToolGroup(item);
                    item.children.sort(compare).forEach(child => group.appendChild(this.createToolButton(child, tabIndex++)));
                    bodyDiv.appendChild(group);
                } else {
                    bodyDiv.appendChild(this.createToolButton(item, tabIndex++));
                }
            });
        if (this.paletteItems.length === 0) {
            const noResultsDiv = document.createElement("div");
            noResultsDiv.innerText = "No results found.";
            noResultsDiv.classList.add("tool-button");
            bodyDiv.appendChild(noResultsDiv);
        }
        // Remove existing body to refresh filtered entries
        if (this.bodyDiv) {
            this.containerElement.removeChild(this.bodyDiv);
        }
        this.containerElement.appendChild(bodyDiv);
        this.bodyDiv = bodyDiv;
    }

    protected createHeader(): void {
        this.addMinimizePaletteButton();
        const headerCompartment = document.createElement("div");
        headerCompartment.classList.add("palette-header");
        headerCompartment.append(this.createHeaderTitle());
        headerCompartment.appendChild(this.createHeaderTools());
        headerCompartment.appendChild(this.searchField = this.createHeaderSearchField());
        this.containerElement.appendChild(headerCompartment);
    }

    private createHeaderTools(): HTMLElement {
        const headerTools = document.createElement("div");
        headerTools.classList.add("header-tools");

        this.defaultToolsButton = this.createDefaultToolButton();
        headerTools.appendChild(this.defaultToolsButton);

        const deleteToolButton = this.createMouseDeleteToolButton();
        headerTools.appendChild(deleteToolButton);

        const marqueeToolButton = this.createMarqueeToolButton();
        headerTools.appendChild(marqueeToolButton);

        const validateActionButton = this.createValidateButton();
        headerTools.appendChild(validateActionButton);

        // Create button for Search
        const searchIcon = this.createSearchButton();
        headerTools.appendChild(searchIcon);

        return headerTools;
    }

    protected createDefaultToolButton() {
        const button = createIcon(["fas", "fa-mouse-pointer", "fa-xs", "clicked"]);
        button.id = "btn_default_tools";
        button.title = 'Enable selection tool';
        button.onclick = this.onClickStaticToolButton(this.defaultToolsButton);
        return button;
    }

    protected createMouseDeleteToolButton() {
        const deleteToolButton = createIcon(["fas", "fa-eraser", "fa-xs"]);
        deleteToolButton.title = 'Enable deletion tool';
        deleteToolButton.onclick = this.onClickStaticToolButton(deleteToolButton, MouseDeleteTool.ID);
        return deleteToolButton;
    }

    protected createMarqueeToolButton() {
        const marqueeToolButton = createIcon(["far", "fa-object-group", "fa-xs"]);
        marqueeToolButton.title = 'Enable marquee tool';
        marqueeToolButton.onclick = this.onClickStaticToolButton(marqueeToolButton, MarqueeMouseTool.ID);
        return marqueeToolButton;
    }

    protected createValidateButton() {
        const validateActionButton = createIcon(["fas", "fa-check-square", "fa-xs"]);
        validateActionButton.title = 'Validate model';
        validateActionButton.onclick = _event => {
            const modelIds: string[] = [this.modelRootId];
            this.actionDispatcher.dispatch(new RequestMarkersAction(modelIds));
        };
        return validateActionButton;
    }

    protected createSearchButton() {
        const searchIcon = createIcon(["fas", SEARCH_ICON, "state-icon", "fa-xs"]);
        searchIcon.onclick = (_ev) => {
            const searchField = document.getElementById(this.containerElement.id + "_search_field");
            if (searchField) {
                if (searchField.style.display === "inline") {
                    searchField.style.display = "none";
                } else {
                    searchField.style.display = "inline";
                    searchField.focus();
                }
            }
        };
        searchIcon.classList.add("search-icon");
        searchIcon.title = 'Filter palette entries';
        return searchIcon;
    }

    protected createHeaderSearchField(): HTMLInputElement {
        const searchField = document.createElement("input");
        searchField.classList.add("search-input");
        searchField.id = this.containerElement.id + "_search_field";
        searchField.type = "text";
        searchField.placeholder = " Search...";
        searchField.style.display = "none";
        searchField.onkeyup = () => this.requestFilterUpdate(this.searchField.value);
        searchField.onkeydown = (ev) => this.clearOnEscape(ev);
        return searchField;
    }

    protected createHeaderTitle(): HTMLElement {
        const header = document.createElement("div");
        header.classList.add("header-icon");
        header.appendChild(createIcon(["fa", "fa-palette"]));
        header.insertAdjacentText("beforeend", "Palette");
        return header;
    }

    protected createToolButton(item: PaletteItem, index: number): HTMLElement {
        const button = document.createElement("div");
        button.tabIndex = index;
        button.classList.add("tool-button");
        button.innerHTML = item.label;
        button.onclick = this.onClickCreateToolButton(button, item);
        button.onkeydown = (ev) => this.clearToolOnEscape(ev);
        return button;
    }

    protected onClickCreateToolButton(button: HTMLElement, item: PaletteItem) {
        return (_ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                this.actionDispatcher.dispatchAll(item.actions);
                this.changeActiveButton(button);
                button.focus();
            }
        };
    }

    protected onClickStaticToolButton(button: HTMLElement, toolId?: string) {
        return (_ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                const action = toolId ? new EnableToolsAction([toolId]) : new EnableDefaultToolsAction();
                this.actionDispatcher.dispatch(action);
                this.changeActiveButton(button);
                button.focus();
            }
        };
    }

    changeActiveButton(button?: HTMLElement) {
        if (this.lastActivebutton) {
            this.lastActivebutton.classList.remove(CLICKED_CSS_CLASS);
        }
        if (button) {
            button.classList.add(CLICKED_CSS_CLASS);
            this.lastActivebutton = button;
        } else {
            this.defaultToolsButton.classList.add(CLICKED_CSS_CLASS);
            this.lastActivebutton = this.defaultToolsButton;
        }
    }

    handle(action: Action): ICommand | Action | void {
        if (action.kind === EnableToolPaletteAction.KIND) {
            const requestAction = new RequestContextActions(ToolPalette.ID, {
                selectedElementIds: []
            });
            this.actionDispatcher.requestUntil(requestAction).then(response => {
                if (isSetContextActionsAction(response)) {
                    this.paletteItems = response.actions.map(e => e as PaletteItem);
                    this.actionDispatcher.dispatch(new SetUIExtensionVisibilityAction(ToolPalette.ID, !this.editorContext.isReadonly));
                }
            });
        } else if (action instanceof EnableDefaultToolsAction) {
            this.changeActiveButton();
            this.restoreFocus();
        }
    }

    editModeChanged(_oldValue: string, _newValue: string) {
        this.actionDispatcher.dispatch(new SetUIExtensionVisibilityAction(ToolPalette.ID, !this.editorContext.isReadonly));
    }

    protected clearOnEscape(event: KeyboardEvent) {
        if (matchesKeystroke(event, "Escape")) {
            this.searchField.value = "";
            this.requestFilterUpdate("");
        }
    }

    protected clearToolOnEscape(event: KeyboardEvent) {
        if (matchesKeystroke(event, "Escape")) {
            this.actionDispatcher.dispatch(new EnableDefaultToolsAction());
        }
    }

    protected handleSetContextActions(action: SetContextActions) {
        this.paletteItems = action.actions.map(e => e as PaletteItem);
        this.createBody();
    }

    protected requestFilterUpdate(filter: string): void {
        // Initialize the copy if it's empty
        if (this.paletteItemsCopy.length === 0) {
            // Creating deep copy
            this.paletteItemsCopy = JSON.parse(JSON.stringify(this.paletteItems));
        }

        // Reset the paletteItems before searching
        this.paletteItems = JSON.parse(JSON.stringify(this.paletteItemsCopy));
        // Filter the entries
        const filteredPaletteItems: PaletteItem[] = [];
        for (const itemGroup of this.paletteItems) {
            if (itemGroup.children) {
                // Fetch the labels according to the filter
                const matchingChildren = itemGroup.children.filter(child => child.label.toLowerCase().includes(filter.toLowerCase()));
                // Add the itemgroup containing the correct entries
                if (matchingChildren.length > 0) {
                    // Clear existing children
                    itemGroup.children.splice(0, itemGroup.children.length);
                    // Push the matching children
                    matchingChildren.forEach(child => itemGroup.children!.push(child));
                    filteredPaletteItems.push(itemGroup);
                }
            }
        }
        this.paletteItems = filteredPaletteItems;
        this.createBody();
    }
}

export function compare(a: PaletteItem, b: PaletteItem): number {
    const sortStringBased = a.sortString.localeCompare(b.sortString);
    if (sortStringBased !== 0) {
        return sortStringBased;
    }
    return a.label.localeCompare(b.label);
}

export function createIcon(cssClasses: string[]) {
    const icon = document.createElement("i");
    icon.classList.add(...cssClasses);
    return icon;
}

export function createToolGroup(item: PaletteItem): HTMLElement {
    const group = document.createElement("div");
    group.classList.add("tool-group");
    group.id = item.id;
    const header = document.createElement("div");
    header.classList.add("group-header");
    if (item.icon) {
        header.appendChild(createIcon(["fas", item.icon]));
    }
    header.insertAdjacentText('beforeend', item.label);
    header.ondblclick = (_ev) => {
        const css = "collapsed";
        changeCSSClass(group, css);
        Array.from(group.children).forEach(child => changeCSSClass(child, css));
        window!.getSelection()!.removeAllRanges();
    };

    group.appendChild(header);
    return group;
}

export function changeCSSClass(element: Element, css: string) {
    element.classList.contains(css) ? element.classList.remove(css) :
        element.classList.add(css);
}
