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
import { inject, injectable, postConstruct } from 'inversify';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { EditorContextService } from '../../base/editor-context-service';
import { FocusTracker } from '../../base/focus/focus-tracker';
import {
    AbstractUIExtension,
    Action,
    IActionHandler,
    ICommand,
    KeyListener,
    GModelElement,
    GModelRoot,
    matchesKeystroke,
    SetUIExtensionVisibilityAction,
    ViewportResult,
    RequestContextActions,
    SetContextActions,
    PaletteItem,
    TriggerEdgeCreationAction,
    TriggerNodeCreationAction,
    Args,
    SelectionPaletteGroupItem,
    SelectionPaletteNodeItem,
    SelectionPalettePosition,
    KeyCode,
    Viewport,
    Bounds,
    GNode,
    SetViewportAction
} from '@eclipse-glsp/sprotty';
import { GetViewportAction } from 'sprotty-protocol/lib/actions';
import { changeCodiconClass, createIcon } from '../tool-palette/tool-palette';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { ISelectionListener, SelectionService } from '../../base/selection-service';
import { ChangeSelectionPaletteStateAction, SelectionPaletteState } from './selection-palette-actions';

@injectable()
export class SelectionPalette extends AbstractUIExtension implements IActionHandler, IDiagramStartup, ISelectionListener {
    static readonly ID = 'selection-palette';

    protected selectedElementId: string;
    protected selectionPaletteItems: SelectionPaletteGroupItem[];
    protected selectionPaletteContainer: HTMLElement;
    protected expandButton: HTMLElement;

    protected groupIsCollapsed: Record<string, boolean> = {};
    protected groupIsTop: Record<string, boolean> = {};
    protected searchFields: Record<string, HTMLInputElement> = {};

    protected previousElementKeyCode: KeyCode = 'ArrowUp';
    protected nextElementKeyCode: KeyCode = 'ArrowDown';

    // Sets the position of the expand button
    protected expandButtonPosition = SelectionPalettePosition.Top;

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    @inject(FocusTracker)
    protected focusTracker: FocusTracker;

    @inject(SelectionService)
    protected selectionService: SelectionService;

    @postConstruct()
    protected init(): void {
        this.selectionService.onSelectionChanged(change => this.selectionChanged(change.root, change.selectedElements));
    }

    selectionChanged(root: GModelRoot, selectedElements: string[]): void {
        if (selectedElements.length !== 0) {
            this.selectedElementId = selectedElements[0];
            this.actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: SelectionPalette.ID, visible: true }));
        } else {
            this.actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: SelectionPalette.ID, visible: false }));
            this.hideAll();
        }
    }

    override id(): string {
        return SelectionPalette.ID;
    }
    override containerClass(): string {
        return SelectionPalette.ID;
    }

    protected override async onBeforeShow(_containerElement: HTMLElement, root: Readonly<GModelRoot>): Promise<void> {
        const viewportResult: ViewportResult = await this.actionDispatcher.request(GetViewportAction.create());
        const node = root.index.getById(this.selectedElementId) as GNode;
        await this.initAvailableOptions(node);
        this.initBody();
        this.setPosition(viewportResult.viewport, viewportResult.canvasBounds, node);
    }

    protected async initAvailableOptions(contextElement?: GModelElement): Promise<void> {
        const requestAction = RequestContextActions.create({
            contextId: SelectionPalette.ID,
            editorContext: {
                selectedElementIds: [this.selectedElementId],
                args: { nodeType: contextElement!.type }
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.selectionPaletteItems = response.actions.map(e => e as SelectionPaletteGroupItem);
    }

    protected setPosition(viewport: Viewport, canvasBounds: Bounds, node: GNode): void {
        this.setMainPosition(canvasBounds, viewport, node);
        // set position of expand button
        this.setContainerPosition(this.expandButton, this.expandButtonPosition, node.bounds, viewport.zoom);
        // set position of container(s)
        const sameSide = this.selectionPaletteItems.every(e => e.position === this.selectionPaletteItems[0].position);
        if (sameSide) {
            this.setContainerPosition(
                this.selectionPaletteContainer,
                this.selectionPaletteItems[0].position,
                node.bounds,
                viewport.zoom,
                true
            );
        } else {
            for (let i = 0; i < this.selectionPaletteContainer.childElementCount; i++) {
                this.setContainerPosition(
                    this.selectionPaletteContainer.children[i] as HTMLElement,
                    this.selectionPaletteItems[i].position,
                    node.bounds,
                    viewport.zoom
                );
            }
        }
        this.hideSelectionPalette();
    }

    protected setMainPosition(canvasBounds: Bounds, viewport: Viewport, node: GNode): void {
        const zoom = viewport.zoom;
        const calculatedBounds = {
            x: (-viewport.scroll.x + node.bounds.x) * zoom,
            y: (-viewport.scroll.y + node.bounds.y) * zoom,
            width: node.bounds.width * zoom,
            height: node.bounds.height * zoom
        };
        const xCenter = calculatedBounds.x + calculatedBounds.width / 2 - canvasBounds.x;
        const yCenter = calculatedBounds.y + calculatedBounds.height / 2 - canvasBounds.y;
        this.containerElement.style.left = `${xCenter}px`;
        this.containerElement.style.top = `${yCenter}px`;
    }

    protected setContainerPosition(
        element: HTMLElement,
        position: SelectionPalettePosition,
        nodeBounds: Bounds,
        zoom: number,
        single?: boolean
    ): void {
        element.style.transform = `scale(${zoom})`;
        if (single) {
            for (let i = 0; i < element.childElementCount; i++) {
                const child = element.children[i] as HTMLElement;
                child.style.position = 'static';
                if (i < element.childElementCount) {
                    child.style.borderBottom = '0';
                }
            }
        }
        this.setDirectionalProperties(element, position, nodeBounds, zoom);
    }

    protected setDirectionalProperties(element: HTMLElement, position: SelectionPalettePosition, nodeBounds: Bounds, zoom: number): void {
        const nodeHeight = nodeBounds.height * zoom;
        const nodeWidth = nodeBounds.width * zoom;
        let xDiff = -element.offsetWidth / 2;
        let yDiff = (-element.offsetHeight / 2) * zoom;
        if (position === SelectionPalettePosition.Right || position === SelectionPalettePosition.Left) {
            xDiff = nodeWidth / 2 + SelectionPalette.CONTAINER_PADDING_PX * zoom;
            element.style.top = `${yDiff}px`;
        }
        if (position === SelectionPalettePosition.Top || position === SelectionPalettePosition.Bottom) {
            yDiff = nodeHeight / 2 + SelectionPalette.CONTAINER_PADDING_PX * zoom;
            element.style.left = `${xDiff}px`;
        }
        if (position === SelectionPalettePosition.Right) {
            element.style.transformOrigin = 'top left';
            element.style.left = `${xDiff}px`;
        }
        if (position === SelectionPalettePosition.Left) {
            element.style.transformOrigin = 'top right';
            element.style.right = `${xDiff}px`;
        }
        if (position === SelectionPalettePosition.Top) {
            element.style.transformOrigin = 'bottom';
            element.style.bottom = `${yDiff}px`;
        }
        if (position === SelectionPalettePosition.Bottom) {
            element.style.transformOrigin = 'top';
            element.style.top = `${yDiff}px`;
        }
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.initBody();
        this.initExpandButton();
        this.containerElement.appendChild(this.expandButton);
        containerElement.setAttribute('aria-label', 'Selection-Palette');
    }

    protected initBody(): void {
        const selectionPaletteContainer = document.createElement('div');
        selectionPaletteContainer.id = SelectionPalette.SELECTION_PALETTE_CONTAINER_ID;
        for (const item of this.selectionPaletteItems) {
            if (item.children) {
                const group = this.createGroup(item);
                selectionPaletteContainer.appendChild(group);
            }
        }
        if (this.selectionPaletteContainer) {
            this.containerElement.removeChild(this.selectionPaletteContainer);
        }
        this.containerElement.appendChild(selectionPaletteContainer);
        this.selectionPaletteContainer = selectionPaletteContainer;
    }

    protected initExpandButton(): void {
        this.expandButton = document.createElement('div');
        this.expandButton.id = SelectionPalette.EXPAND_BUTTON_ID;
        this.expandButton.innerHTML = '+';
        this.expandButton.onclick = _ev => {
            if (!this.editorContext.isReadonly) {
                this.showSelectionPalette();
            }
        };
        // this.expandButton.onkeydown = ev => {
        //     if(matchesKeystroke(ev, 'Space') && !this.editorContext.isReadonly)
        //         {this.showSelectionPalette();}
        //     };
    }

    // default state
    protected hideSelectionPalette(): void {
        if (this.selectionPaletteContainer && this.expandButton) {
            this.selectionPaletteContainer.style.visibility = 'hidden';
            this.expandButton.style.visibility = 'visible';
        }
    }

    protected showSelectionPalette(): void {
        this.selectionPaletteContainer.style.visibility = 'visible';
        this.expandButton.style.visibility = 'hidden';
    }

    // to avoid onclicks on nested hidden > visible
    protected hideAll(): void {
        if (this.selectionPaletteContainer && this.expandButton) {
            this.selectionPaletteContainer.style.visibility = 'hidden';
            this.expandButton.style.visibility = 'hidden';
        }
    }

    protected createGroup(item: SelectionPaletteGroupItem): HTMLElement {
        const searchField = this.createSearchField(item);
        const group = document.createElement('div');
        if (item.children!.length === 0) {
            return group;
        }
        group.style.position = 'absolute';
        const groupItems = document.createElement('div');
        group.classList.add(SelectionPalette.GROUP_CONTAINER_CLASS);
        groupItems.classList.add(SelectionPalette.GROUP_CLASS);
        group.id = item.id;
        for (const child of item.children!) {
            groupItems.appendChild(this.createToolButton(child));
        }
        if (item.showTitle) {
            const header = this.createGroupHeader(item, groupItems, searchField);
            if (item.position === SelectionPalettePosition.Top) {
                // the header is at the bottom on top
                group.appendChild(groupItems);
                if (item.children!.length > 1) {
                    group.appendChild(searchField);
                }
                group.appendChild(header);
                this.groupIsTop[group.id] = true;
                return group;
            }
            group.appendChild(header);
        }
        if (item.children!.length > 1) {
            group.appendChild(searchField);
        }
        group.appendChild(groupItems);
        this.groupIsTop[group.id] = false;
        return group;
    }

    protected createGroupHeader(group: SelectionPaletteGroupItem, groupItems: HTMLElement, searchField: HTMLElement): HTMLElement {
        const header = document.createElement('div');
        const headerTitle = document.createElement('div');
        header.classList.add(SelectionPalette.HEADER_CLASS);
        // for same css as palette header
        header.classList.add('group-header');
        if (group.icon) {
            headerTitle.appendChild(createIcon(group.icon));
        }
        headerTitle.insertAdjacentText('beforeend', group.label);
        headerTitle.classList.add('header-title');
        header.appendChild(headerTitle);
        header.tabIndex = 0;
        if (group.submenu) {
            const submenuIcon = group.position === SelectionPalettePosition.Top ? createIcon('chevron-up') : createIcon('chevron-down');
            header.appendChild(submenuIcon);
            groupItems.classList.add(SelectionPalette.COLLAPSABLE_CLASS);
            header.onclick = _ev => {
                this.toggleSubmenu(submenuIcon, group, groupItems, searchField);
            };
            header.onkeydown = ev => {
                if (matchesKeystroke(ev, 'Enter')) {
                    this.toggleSubmenu(submenuIcon, group, groupItems, searchField);
                }
                this.handlerHeaderKey(ev, groupItems, header);
            };
            this.groupIsCollapsed[group.id] = true;
        }
        return header;
    }

    protected toggleSubmenu(icon: HTMLElement, group: SelectionPaletteGroupItem, groupItems: HTMLElement, searchField: HTMLElement): void {
        changeCodiconClass(icon, 'chevron-up');
        changeCodiconClass(icon, 'chevron-down');
        this.groupIsCollapsed[group.id] = !this.groupIsCollapsed[group.id];
        if (groupItems.style.maxHeight) {
            groupItems.style.maxHeight = '';
            searchField.style.maxHeight = '';
        } else {
            groupItems.style.maxHeight = SelectionPalette.MAX_HEIGHT_GROUP;
            searchField.style.maxHeight = '50px';
        }
    }

    protected createToolButton(item: PaletteItem): HTMLElement {
        const button = document.createElement('div');
        button.tabIndex = 0;
        button.classList.add(SelectionPalette.TOOL_BUTTON_CLASS);
        if (item.icon) {
            button.appendChild(createIcon(item.icon));
        }
        button.insertAdjacentText('beforeend', item.label);
        button.onclick = this.onClickCreateToolButton(button, item);
        button.onkeydown = ev => this.handleToolButtonKey(ev, item);
        button.id = item.id;
        return button;
    }

    protected createSearchField(itemGroup: SelectionPaletteGroupItem): HTMLElement {
        const searchField = document.createElement('input');
        searchField.classList.add(SelectionPalette.SEARCH_CLASS);
        searchField.id = itemGroup.id + SelectionPalette.SEARCH_FIELD_SUFFIX;
        searchField.type = 'text';
        searchField.placeholder = ' Search...';
        searchField.onkeyup = () => this.requestFilterUpdate(this.searchFields[itemGroup.id].value, itemGroup);
        searchField.onkeydown = ev => this.handleSearchFieldKey(ev, itemGroup);
        this.searchFields[itemGroup.id] = searchField;
        const searchContainer = document.createElement('div');
        const containerClass = itemGroup.submenu
            ? SelectionPalette.SEARCH_SUBMENU_CONTAINER_CLASS
            : SelectionPalette.SEARCH_CONTAINER_CLASS;
        searchContainer.classList.add(containerClass);
        searchContainer.appendChild(searchField);
        return searchContainer;
    }

    // #region event handlers

    protected requestFilterUpdate(filter: string, itemGroup: SelectionPaletteGroupItem): void {
        if (itemGroup.children) {
            const matchingChildren = itemGroup.children.filter(child => child.label.toLowerCase().includes(filter.toLowerCase()));
            const items = document.getElementById(itemGroup.id)?.getElementsByClassName(SelectionPalette.TOOL_BUTTON_CLASS);
            if (items) {
                Array.from(items).forEach(item => {
                    if (matchingChildren.find(child => child.id === item.id)) {
                        (item as HTMLElement).style.display = 'flex';
                    } else {
                        (item as HTMLElement).style.display = 'none';
                    }
                });
            }
        }
    }

    protected handleToolButtonKey(event: KeyboardEvent, item: PaletteItem): void {
        if (matchesKeystroke(event, 'Enter')) {
            this.triggerCreation(item);
        }
        if (event.ctrlKey) {
            // matchesKeystroke with Ctrl and Ctrl+F does not seem to work on Windows 11/Chrome
            // if (matchesKeystroke(event, 'ControlLeft')) {
            // if (matchesKeystroke(event, 'KeyF', 'ctrlCmd')) {
            const parentId = this.selectionPaletteItems.find(e => e.children?.includes(item))!.id;
            const searchFieldId = parentId + SelectionPalette.SEARCH_FIELD_SUFFIX;
            const searchField = document.getElementById(searchFieldId);
            if (searchField) {
                (searchField as HTMLElement).focus();
            }
        }
        this.navigateToolButton(event, item);
        this.closeOnEscapeKey(event);
    }

    protected handleSearchFieldKey(event: KeyboardEvent, itemGroup: SelectionPaletteGroupItem): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.searchFields[itemGroup.id].value = '';
            this.requestFilterUpdate('', itemGroup);
        }
        this.navigateSearchField(event, itemGroup);
    }

    protected handlerHeaderKey(event: KeyboardEvent, groupItems: HTMLElement, header: HTMLElement): void {
        this.navigateHeader(event, groupItems, header);
        this.closeOnEscapeKey(event);
    }

    protected closeOnEscapeKey(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.hideSelectionPalette();
            // assumes that the graph is always the last child of base div
            // this focus is done to "reactivate" the key listener to re-open if needed
            last(document.getElementById(this.options.baseDiv)!).focus();
        }
    }

    // #region navigation handlers

    protected navigateSearchField(event: KeyboardEvent, itemGroup: SelectionPaletteGroupItem): void {
        if (matchesKeystroke(event, this.previousElementKeyCode)) {
            (document.getElementById(itemGroup.children![itemGroup.children!.length - 1].id) as HTMLElement).focus();
        }
        if (matchesKeystroke(event, this.nextElementKeyCode)) {
            (document.getElementById(itemGroup.children![0].id) as HTMLElement).focus();
        }
    }

    protected navigateHeader(event: KeyboardEvent, groupItems: HTMLElement, header: HTMLElement): void {
        const parent = header.parentElement!;
        if (matchesKeystroke(event, this.previousElementKeyCode)) {
            if ((this.groupIsCollapsed[parent.id] || !this.groupIsTop[parent.id]) && previous(parent)) {
                const collapsableHeader = this.getHeaderIfGroupContainsCollapsable(previous(parent));
                if (collapsableHeader && (this.groupIsTop[previous(parent).id] || this.groupIsCollapsed[previous(parent).id])) {
                    collapsableHeader.focus();
                } else {
                    this.getPreviousGroupLastItem(parent).focus();
                }
            } else if (!this.groupIsCollapsed[parent.id] && previous(header)) {
                last(groupItems).focus();
            }
        }
        if (matchesKeystroke(event, this.nextElementKeyCode)) {
            if ((this.groupIsCollapsed[parent.id] || this.groupIsTop[parent.id]) && next(parent)) {
                const collapsableHeader = this.getHeaderIfGroupContainsCollapsable(next(parent));
                if (collapsableHeader && (!this.groupIsTop[next(parent).id] || this.groupIsCollapsed[next(parent).id])) {
                    collapsableHeader.focus();
                } else {
                    this.getNextGroupFirstItem(parent).focus();
                }
            } else if (!this.groupIsCollapsed[parent.id] && next(header)) {
                first(groupItems).focus();
            }
        }
    }

    protected navigateToolButton(event: KeyboardEvent, item: PaletteItem): void {
        const parentId = this.selectionPaletteItems.find(e => e.children?.includes(item))!.id;
        const parent = document.getElementById(parentId)!;
        const toolButton = document.getElementById(item.id)!;
        const collapsableHeader = this.getHeaderIfGroupContainsCollapsable(parent);
        if (matchesKeystroke(event, this.previousElementKeyCode)) {
            const previousGroupCollapsableHeader = this.getHeaderIfGroupContainsCollapsable(previous(parent));
            if (previous(toolButton)) {
                previous(toolButton).focus();
            } else if (collapsableHeader && !this.groupIsTop[parent.id]) {
                collapsableHeader.focus();
            } else if (previousGroupCollapsableHeader && this.groupIsTop[previous(parent).id]) {
                previousGroupCollapsableHeader.focus();
            } else if (previous(parent)) {
                this.getPreviousGroupLastItem(parent).focus();
            }
        }
        if (matchesKeystroke(event, this.nextElementKeyCode)) {
            const nextGroupCollapsableHeader = this.getHeaderIfGroupContainsCollapsable(next(parent));
            if (next(toolButton)) {
                next(toolButton).focus();
            } else if (collapsableHeader && this.groupIsTop[parent.id]) {
                collapsableHeader.focus();
            } else if (nextGroupCollapsableHeader && !this.groupIsTop[next(parent).id]) {
                nextGroupCollapsableHeader.focus();
            } else if (next(parent)) {
                this.getNextGroupFirstItem(parent).focus();
            }
        }
    }

    protected getNextGroupFirstItem(parent: HTMLElement): HTMLElement {
        return parent.nextElementSibling!.getElementsByClassName(SelectionPalette.GROUP_CLASS)[0].firstElementChild as HTMLElement;
    }

    protected getPreviousGroupLastItem(parent: HTMLElement): HTMLElement {
        return parent.previousElementSibling!.getElementsByClassName(SelectionPalette.GROUP_CLASS)[0].lastElementChild as HTMLElement;
    }

    protected getHeaderIfGroupContainsCollapsable(group: HTMLElement): HTMLElement | undefined {
        if (group && group.getElementsByClassName(SelectionPalette.COLLAPSABLE_CLASS).length !== 0) {
            return group.getElementsByClassName(SelectionPalette.HEADER_CLASS)[0] as HTMLElement;
        }
        return undefined;
    }

    // #endregion

    protected onClickCreateToolButton(_button: HTMLElement, item: PaletteItem) {
        return (_ev: MouseEvent) => {
            this.triggerCreation(item);
        };
    }

    protected triggerCreation(item: PaletteItem): void {
        if (!this.editorContext.isReadonly) {
            item.actions.forEach(e => {
                let args: Args;
                if (TriggerEdgeCreationAction.is(e)) {
                    args = { source: this.selectedElementId };
                    e.args = args;
                }
                if (TriggerNodeCreationAction.is(e)) {
                    args = { createEdge: true, source: this.selectedElementId, edgeType: (item as SelectionPaletteNodeItem).edgeType };
                    e.args = args;
                }
            });
            this.actionDispatcher.dispatchAll(
                item.actions.concat([SetUIExtensionVisibilityAction.create({ extensionId: SelectionPalette.ID, visible: false })])
            );
            this.hideAll();
        }
    }

    // #endregion

    handle(action: Action): ICommand | Action | void {
        if (ChangeSelectionPaletteStateAction.is(action)) {
            if (action.state === SelectionPaletteState.Collapse) {
                this.hideSelectionPalette();
            } else if (action.state === SelectionPaletteState.Expand && this.selectionPaletteContainer.style.visibility === 'hidden') {
                this.showSelectionPalette();
                const collapsableHeader = this.getHeaderIfGroupContainsCollapsable(
                    this.selectionPaletteContainer.firstElementChild as HTMLElement
                );
                if (collapsableHeader) {
                    collapsableHeader.focus();
                } else {
                    (
                        this.selectionPaletteContainer.firstElementChild!.getElementsByClassName(SelectionPalette.GROUP_CLASS)[0]
                            .firstElementChild as HTMLElement
                    ).focus();
                }
            }
        } else if (SetViewportAction.is(action)) {
            this.handleSetViewportAction(action.newViewport);
        } else {
            this.actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: SelectionPalette.ID, visible: false }));
            this.hideAll();
        }
    }

    protected handleSetViewportAction(viewport: Viewport): void {
        const root = this.selectionService.getModelRoot();
        const canvasBounds = root.canvasBounds;
        if (!this.selectedElementId) {
            return;
        }
        const node = root.index.getById(this.selectedElementId) as GNode;
        this.setPosition(viewport, canvasBounds, node);
    }

    async preRequestModel(): Promise<void> {
        const requestAction = RequestContextActions.create({
            contextId: SelectionPalette.ID,
            editorContext: {
                selectedElementIds: []
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.selectionPaletteItems = response.actions.map(e => e as SelectionPaletteGroupItem);
    }
}

function next(element: HTMLElement): HTMLElement {
    return element.nextElementSibling as HTMLElement;
}

function previous(element: HTMLElement): HTMLElement {
    return element.previousElementSibling as HTMLElement;
}

function first(element: HTMLElement): HTMLElement {
    return element.firstElementChild as HTMLElement;
}

function last(element: HTMLElement): HTMLElement {
    return element.lastElementChild as HTMLElement;
}

export namespace SelectionPalette {
    export const CONTAINER_PADDING_PX = 20;
    export const MAX_HEIGHT_GROUP = '150px';
    export const SEARCH_FIELD_SUFFIX = '_search_field';
    export const SELECTION_PALETTE_CONTAINER_ID = 'selection-palette-container';
    export const EXPAND_BUTTON_ID = 'selection-palette-expand-button';
    export const GROUP_CONTAINER_CLASS = 'selection-palette-group-container';
    export const HEADER_CLASS = 'selection-palette-group-header';
    export const GROUP_CLASS = 'selection-palette-group';
    export const TOOL_BUTTON_CLASS = 'selection-palette-button';
    export const COLLAPSABLE_CLASS = 'collapsable-group';
    export const SEARCH_CLASS = 'selection-palette-search';
    export const SEARCH_CONTAINER_CLASS = 'selection-palette-search-container';
    export const SEARCH_SUBMENU_CONTAINER_CLASS = 'selection-palette-submenu-search-container';
}

@injectable()
export class SelectionPaletteKeyListener extends KeyListener {
    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Space')) {
            return [ChangeSelectionPaletteStateAction.create(SelectionPaletteState.Expand)];
        }
        if (matchesKeystroke(event, 'Escape')) {
            return [ChangeSelectionPaletteStateAction.create(SelectionPaletteState.Collapse)];
        }
        return [];
    }
}
