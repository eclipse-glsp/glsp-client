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

    static readonly ID = "tool-palette";

    @postConstruct()
    postConstruct() {
        this.editorContext.register(this);
    }

    initialize() {
        if (!this.paletteItems) {
            return false;
        }
        return super.initialize();
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.createHeader();
        this.createBody();
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>) {
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
            minimizeIcon.onclick = (ev) => {
                if (this.containerElement.style.maxHeight !== "0px") {
                    this.containerElement.style.maxHeight = "0px";
                } else {
                    this.containerElement.style.maxHeight = PALETTE_HEIGHT;
                }
                changeCSSClass(minimizeIcon, PALETTE_ICON);
                changeCSSClass(minimizeIcon, "fa");
                changeCSSClass(minimizeIcon, "fas");
                changeCSSClass(minimizeIcon, CHEVRON_DOWN);
            };
            insertedDiv.appendChild(minimizeIcon);
        }
    }

    protected createBody(): void {
        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("palette-body");
        this.paletteItems.sort(compare)
            .forEach(item => {
                if (item.children) {
                    const group = createToolGroup(item);
                    item.children.sort(compare).forEach(child => group.appendChild(this.createToolButton(child)));
                    bodyDiv.appendChild(group);
                } else {
                    bodyDiv.appendChild(this.createToolButton(item));
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

        // Title header
        const header = document.createElement("div");
        header.classList.add("header-icon");
        header.appendChild(createIcon(["fa", "fa-palette"]));
        header.insertAdjacentText("beforeend", "Palette");
        headerCompartment.append(header);
        // Header Tools Compartment
        const headerTools = document.createElement("div");
        headerTools.classList.add("header-tools");

        // Create button for DefaultTools
        this.defaultToolsButton = createIcon(["fas", "fa-mouse-pointer", "fa-xs", "clicked"]);
        this.defaultToolsButton.id = "btn_default_tools";
        this.defaultToolsButton.onclick = this.onClickStaticToolButton(this.defaultToolsButton);
        headerTools.appendChild(this.defaultToolsButton);
        this.lastActivebutton = this.defaultToolsButton;

        // Create button for MouseDeleteTool
        const deleteToolButton = createIcon(["fas", "fa-eraser", "fa-xs"]);
        deleteToolButton.onclick = this.onClickStaticToolButton(deleteToolButton, MouseDeleteTool.ID);
        headerTools.appendChild(deleteToolButton);

        // Create button for ValidationTool
        const validateActionButton = createIcon(["fas", "fa-check-square", "fa-xs"]);
        validateActionButton.onclick = (ev: MouseEvent) => {
            const modelIds: string[] = [this.modelRootId];
            this.actionDispatcher.dispatch(new RequestMarkersAction(modelIds));
        };
        headerTools.appendChild(validateActionButton);

        // Create button for Search
        const searchIcon = createIcon(["fas", SEARCH_ICON, "state-icon", "fa-xs"]);
        searchIcon.onclick = (ev) => {
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
        this.searchField = document.createElement("input");
        this.searchField.classList.add("search-input");
        this.searchField.id = this.containerElement.id + "_search_field";
        this.searchField.type = "text";
        this.searchField.placeholder = " Search...";
        this.searchField.style.display = "none";
        this.searchField.onkeyup = () => this.requestFilterUpdate(this.searchField.value);
        this.searchField.onkeydown = (ev) => this.clearOnEspace(ev);

        headerTools.appendChild(searchIcon);
        headerCompartment.appendChild(headerTools);
        headerCompartment.appendChild(this.searchField);
        this.containerElement.appendChild(headerCompartment);
    }

    protected createToolButton(item: PaletteItem): HTMLElement {
        const button = document.createElement("div");
        button.classList.add("tool-button");
        button.innerHTML = item.label;
        button.onclick = this.onClickCreateToolButton(button, item);
        return button;
    }

    protected onClickCreateToolButton(button: HTMLElement, item: PaletteItem) {
        return (ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                this.actionDispatcher.dispatchAll(item.actions);
                this.changeActiveButton(button);
                this.restoreFocus();
            }
        };
    }

    protected onClickStaticToolButton(button: HTMLElement, toolId?: string) {
        return (ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                const action = toolId ? new EnableToolsAction([toolId]) : new EnableDefaultToolsAction();
                this.actionDispatcher.dispatch(action);
                this.changeActiveButton(button);
                this.restoreFocus();
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
        }
    }

    editModeChanged(oldValue: string, newValue: string) {
        this.actionDispatcher.dispatch(new SetUIExtensionVisibilityAction(ToolPalette.ID, !this.editorContext.isReadonly));
    }

    protected clearOnEspace(event: KeyboardEvent) {
        if (matchesKeystroke(event, 'Escape')) {
            this.searchField.value = '';
            this.requestFilterUpdate('');
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
    header.ondblclick = (ev) => {
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
