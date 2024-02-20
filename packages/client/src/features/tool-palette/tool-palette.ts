/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    AbstractUIExtension,
    Action,
    GModelRoot,
    IActionHandler,
    ICommand,
    MarkersReason,
    PaletteItem,
    RequestContextActions,
    RequestMarkersAction,
    SetContextActions,
    SetModelAction,
    SetUIExtensionVisibilityAction,
    TriggerNodeCreationAction,
    UpdateModelAction,
    codiconCSSClasses,
    matchesKeystroke
} from '@eclipse-glsp/sprotty';
import { inject, injectable, postConstruct } from 'inversify';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { EditorContextService, IEditModeListener } from '../../base/editor-context-service';
import { FocusTracker } from '../../base/focus/focus-tracker';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { EnableDefaultToolsAction, EnableToolsAction } from '../../base/tool-manager/tool';
import { MouseDeleteTool } from '../tools/deletion/delete-tool';
import { MarqueeMouseTool } from '../tools/marquee-selection/marquee-mouse-tool';

const CLICKED_CSS_CLASS = 'clicked';
const SEARCH_ICON_ID = 'search';
const PALETTE_ICON_ID = 'symbol-color';
const CHEVRON_DOWN_ICON_ID = 'chevron-right';
const PALETTE_HEIGHT = '500px';

export interface EnableToolPaletteAction extends Action {
    kind: typeof EnableToolPaletteAction.KIND;
}

export namespace EnableToolPaletteAction {
    export const KIND = 'enableToolPalette';

    export function is(object: any): object is EnableToolPaletteAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): EnableToolPaletteAction {
        return { kind: KIND };
    }
}
@injectable()
export class ToolPalette extends AbstractUIExtension implements IActionHandler, IEditModeListener, IDiagramStartup {
    static readonly ID = 'tool-palette';

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    @inject(FocusTracker)
    protected focusTracker: FocusTracker;

    protected paletteItems: PaletteItem[];
    protected paletteItemsCopy: PaletteItem[] = [];
    protected dynamic = false;
    protected bodyDiv?: HTMLElement;
    protected lastActiveButton?: HTMLElement;
    protected defaultToolsButton: HTMLElement;
    protected searchField: HTMLInputElement;
    modelRootId: string;

    id(): string {
        return ToolPalette.ID;
    }
    containerClass(): string {
        return ToolPalette.ID;
    }

    @postConstruct()
    postConstruct(): void {
        this.editorContext.onEditModeChanged(change => this.editModeChanged(change.newValue, change.oldValue));
    }

    override initialize(): boolean {
        if (!this.paletteItems) {
            return false;
        }
        return super.initialize();
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.createHeader();
        this.createBody();
        this.lastActiveButton = this.defaultToolsButton;
        containerElement.setAttribute('aria-label', 'Tool-Palette');
    }

    protected override onBeforeShow(_containerElement: HTMLElement, root: Readonly<GModelRoot>): void {
        this.modelRootId = root.id;
        this.containerElement.style.maxHeight = PALETTE_HEIGHT;
    }

    protected addMinimizePaletteButton(): void {
        const baseDiv = document.getElementById(this.options.baseDiv);
        const minPaletteDiv = document.createElement('div');
        minPaletteDiv.classList.add('minimize-palette-button');
        this.containerElement.classList.add('collapsible-palette');
        if (baseDiv) {
            const insertedDiv = baseDiv.insertBefore(minPaletteDiv, baseDiv.firstChild);
            const minimizeIcon = createIcon(CHEVRON_DOWN_ICON_ID);
            this.updateMinimizePaletteButtonTooltip(minPaletteDiv);
            minimizeIcon.onclick = _event => {
                if (this.isPaletteMaximized()) {
                    this.containerElement.style.maxHeight = '0px';
                } else {
                    this.containerElement.style.maxHeight = PALETTE_HEIGHT;
                }
                this.updateMinimizePaletteButtonTooltip(minPaletteDiv);
                changeCodiconClass(minimizeIcon, PALETTE_ICON_ID);
                changeCodiconClass(minimizeIcon, CHEVRON_DOWN_ICON_ID);
            };
            insertedDiv.appendChild(minimizeIcon);
        }
    }

    protected updateMinimizePaletteButtonTooltip(button: HTMLDivElement): void {
        if (this.isPaletteMaximized()) {
            button.title = 'Minimize palette';
        } else {
            button.title = 'Maximize palette';
        }
    }

    protected isPaletteMaximized(): boolean {
        return this.containerElement && this.containerElement.style.maxHeight !== '0px';
    }

    protected createBody(): void {
        const bodyDiv = document.createElement('div');
        bodyDiv.classList.add('palette-body');
        let tabIndex = 0;
        this.paletteItems.sort(compare).forEach(item => {
            if (item.children) {
                const group = createToolGroup(item);
                item.children.sort(compare).forEach(child => group.appendChild(this.createToolButton(child, tabIndex++)));
                bodyDiv.appendChild(group);
            } else {
                bodyDiv.appendChild(this.createToolButton(item, tabIndex++));
            }
        });
        if (this.paletteItems.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.innerText = 'No results found.';
            noResultsDiv.classList.add('tool-button');
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
        const headerCompartment = document.createElement('div');
        headerCompartment.classList.add('palette-header');
        headerCompartment.append(this.createHeaderTitle());
        headerCompartment.appendChild(this.createHeaderTools());
        headerCompartment.appendChild((this.searchField = this.createHeaderSearchField()));
        this.containerElement.appendChild(headerCompartment);
    }

    protected createHeaderTools(): HTMLElement {
        const headerTools = document.createElement('div');
        headerTools.classList.add('header-tools');

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

    protected createDefaultToolButton(): HTMLElement {
        const button = createIcon('inspect');
        button.id = 'btn_default_tools';
        button.title = 'Enable selection tool';
        button.onclick = this.onClickStaticToolButton(button);
        button.ariaLabel = button.title;
        button.tabIndex = 1;
        return button;
    }

    protected createMouseDeleteToolButton(): HTMLElement {
        const deleteToolButton = createIcon('chrome-close');
        deleteToolButton.title = 'Enable deletion tool';
        deleteToolButton.onclick = this.onClickStaticToolButton(deleteToolButton, MouseDeleteTool.ID);
        deleteToolButton.ariaLabel = deleteToolButton.title;
        deleteToolButton.tabIndex = 1;
        return deleteToolButton;
    }

    protected createMarqueeToolButton(): HTMLElement {
        const marqueeToolButton = createIcon('screen-full');
        marqueeToolButton.title = 'Enable marquee tool';
        marqueeToolButton.onclick = this.onClickStaticToolButton(marqueeToolButton, MarqueeMouseTool.ID);
        marqueeToolButton.ariaLabel = marqueeToolButton.title;
        marqueeToolButton.tabIndex = 1;
        return marqueeToolButton;
    }

    protected createValidateButton(): HTMLElement {
        const validateActionButton = createIcon('pass');
        validateActionButton.title = 'Validate model';
        validateActionButton.onclick = _event => {
            const modelIds: string[] = [this.modelRootId];
            this.actionDispatcher.dispatch(RequestMarkersAction.create(modelIds, { reason: MarkersReason.BATCH }));
            validateActionButton.focus();
        };
        validateActionButton.ariaLabel = validateActionButton.title;
        validateActionButton.tabIndex = 1;
        return validateActionButton;
    }

    protected createSearchButton(): HTMLElement {
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
        searchIcon.title = 'Filter palette entries';
        searchIcon.ariaLabel = searchIcon.title;
        searchIcon.tabIndex = 1;
        return searchIcon;
    }

    protected createHeaderSearchField(): HTMLInputElement {
        const searchField = document.createElement('input');
        searchField.classList.add('search-input');
        searchField.id = this.containerElement.id + '_search_field';
        searchField.type = 'text';
        searchField.placeholder = ' Search...';
        searchField.style.display = 'none';
        searchField.onkeyup = () => this.requestFilterUpdate(this.searchField.value);
        searchField.onkeydown = ev => this.clearOnEscape(ev);
        return searchField;
    }

    protected createHeaderTitle(): HTMLElement {
        const header = document.createElement('div');
        header.classList.add('header-icon');
        header.appendChild(createIcon(PALETTE_ICON_ID));
        header.insertAdjacentText('beforeend', 'Palette');
        return header;
    }

    protected createToolButton(item: PaletteItem, index: number): HTMLElement {
        const button = document.createElement('div');
        button.tabIndex = index;
        button.classList.add('tool-button');
        if (item.icon) {
            button.appendChild(createIcon(item.icon));
        }
        button.insertAdjacentText('beforeend', item.label);
        button.onclick = this.onClickCreateToolButton(button, item);
        button.onkeydown = ev => this.clearToolOnEscape(ev);
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
                const action = toolId ? EnableToolsAction.create([toolId]) : EnableDefaultToolsAction.create();
                this.actionDispatcher.dispatch(action);
                this.changeActiveButton(button);
                button.focus();
            }
        };
    }

    changeActiveButton(button?: HTMLElement): void {
        if (this.lastActiveButton) {
            this.lastActiveButton.classList.remove(CLICKED_CSS_CLASS);
        }
        if (button) {
            button.classList.add(CLICKED_CSS_CLASS);
            this.lastActiveButton = button;
        } else if (this.defaultToolsButton) {
            this.defaultToolsButton.classList.add(CLICKED_CSS_CLASS);
            this.lastActiveButton = this.defaultToolsButton;
        }
    }

    handle(action: Action): ICommand | Action | void {
        this.changeActiveButton();
        if (UpdateModelAction.is(action) || SetModelAction.is(action)) {
            this.reloadPaletteBody();
        } else if (EnableDefaultToolsAction.is(action)) {
            if (this.focusTracker.hasFocus) {
                // if focus was deliberately taken do not restore focus to the palette
                this.focusTracker.diagramElement?.focus();
            }
        }
    }

    editModeChanged(_newValue: string, _oldValue: string): void {
        this.actionDispatcher.dispatch(
            SetUIExtensionVisibilityAction.create({ extensionId: ToolPalette.ID, visible: !this.editorContext.isReadonly })
        );
    }

    protected clearOnEscape(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.searchField.value = '';
            this.requestFilterUpdate('');
        }
    }

    protected clearToolOnEscape(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.actionDispatcher.dispatch(EnableDefaultToolsAction.create());
        }
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

    async preRequestModel(): Promise<void> {
        await this.setPaletteItems();
        if (!this.editorContext.isReadonly) {
            this.show(this.editorContext.modelRoot);
        }
    }

    async postRequestModel(): Promise<void> {
        this.reloadPaletteBody();
    }

    protected async setPaletteItems(): Promise<void> {
        const requestAction = RequestContextActions.create({
            contextId: ToolPalette.ID,
            editorContext: {
                selectedElementIds: []
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.paletteItems = response.actions.map(action => action as PaletteItem);
        this.dynamic = this.paletteItems.some(item => this.hasDynamicAction(item));
    }

    protected hasDynamicAction(item: PaletteItem): boolean {
        const dynamic = !!item.actions.find(action => TriggerNodeCreationAction.is(action) && action.ghostElement?.dynamic);
        if (dynamic) {
            return dynamic;
        }
        return item.children?.some(child => this.hasDynamicAction(child)) || false;
    }

    protected async reloadPaletteBody(): Promise<void> {
        if (this.dynamic) {
            await this.setPaletteItems();
            this.paletteItemsCopy = [];
            this.requestFilterUpdate(this.searchField.value);
        }
    }
}

export function compare(a: PaletteItem, b: PaletteItem): number {
    const sortStringBased = a.sortString.localeCompare(b.sortString);
    if (sortStringBased !== 0) {
        return sortStringBased;
    }
    return a.label.localeCompare(b.label);
}

export function createIcon(codiconId: string): HTMLElement {
    const icon = document.createElement('i');
    icon.classList.add(...codiconCSSClasses(codiconId));
    return icon;
}

export function createToolGroup(item: PaletteItem): HTMLElement {
    const group = document.createElement('div');
    group.classList.add('tool-group');
    group.id = item.id;
    const header = document.createElement('div');
    header.classList.add('group-header');
    if (item.icon) {
        header.appendChild(createIcon(item.icon));
    }
    header.insertAdjacentText('beforeend', item.label);
    header.ondblclick = _ev => {
        const css = 'collapsed';
        changeCSSClass(group, css);
        Array.from(group.children).forEach(child => changeCSSClass(child, css));
        window!.getSelection()!.removeAllRanges();
    };

    group.appendChild(header);
    return group;
}

export function changeCSSClass(element: Element, css: string): void {
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    element.classList.contains(css) ? element.classList.remove(css) : element.classList.add(css);
}

export function changeCodiconClass(element: Element, codiconId: string): void {
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    element.classList.contains(codiconCSSClasses(codiconId)[1])
        ? element.classList.remove(codiconCSSClasses(codiconId)[1])
        : element.classList.add(codiconCSSClasses(codiconId)[1]);
}
