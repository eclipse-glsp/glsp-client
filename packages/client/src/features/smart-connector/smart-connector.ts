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
    OpenSmartConnectorAction,
    SetUIExtensionVisibilityAction,
    ViewportResult,
    RequestContextActions,
    SetContextActions,
    PaletteItem,
    TriggerEdgeCreationAction,
    TriggerNodeCreationAction,
    Args,
    SmartConnectorGroupItem,
    SmartConnectorNodeItem,
    SmartConnectorPosition,
    KeyCode
} from '@eclipse-glsp/sprotty';
import { GetViewportAction } from 'sprotty-protocol/lib/actions';
import { changeCodiconClass, createIcon } from '../tool-palette/tool-palette';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { EnableDefaultToolsAction } from '../../base/tool-manager/tool';

const CONTAINER_PADDING_PX = 20;
const MAX_HEIGHT_GROUP = '150px';
const SEARCH_FIELD_SUFFIX = '_search_field';
const SMART_CONNECTOR_CONTAINER_ID = 'smart-connector-container';
const EXPAND_BUTTON_ID = 'smart-connector-expand-button';
const GROUP_CONTAINER_CLASS = 'smart-connector-group-container';
const HEADER_CLASS = 'smart-connector-group-header';
const GROUP_CLASS = 'smart-connector-group';
const TOOL_BUTTON_CLASS = 'smart-connector-button';
const COLLAPSABLE_CLASS = 'collapsable-group';

@injectable()
export class SmartConnector extends AbstractUIExtension implements IActionHandler, IDiagramStartup {

    static readonly ID = 'smart-connector';

    protected selectedElementId: string;
    protected smartConnectorItems: SmartConnectorGroupItem[];
    protected smartConnectorContainer: HTMLElement;
    protected expandButton: HTMLElement;
    protected currentZoom: number;

    protected smartConnectorGroups: Record<string, HTMLElement> = {};
    protected groupIsCollapsed: Record<string, boolean> = {};
    protected groupIsTop: Record<string, boolean> = {};
    protected searchFields: Record<string, HTMLInputElement> = {};

    protected previousElementKeyCode: KeyCode = 'ArrowUp';
    protected nextElementKeyCode: KeyCode = 'ArrowDown';

    // Sets the position of the expand button
    protected expandButtonPosition = SmartConnectorPosition.Top;

    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    @inject(FocusTracker)
    protected focusTracker: FocusTracker;

    override id(): string {
        return SmartConnector.ID;
    }
    override containerClass(): string {
        return SmartConnector.ID;
    }

    protected override async onBeforeShow(_containerElement: HTMLElement, root: Readonly<GModelRoot>): Promise<void> {
        const viewportResult: ViewportResult = await this.actionDispatcher.request(GetViewportAction.create());
        await this.requestAvailableOptions(root.index.getById(this.selectedElementId));
        this.currentZoom = viewportResult.viewport.zoom;
        const nodeFromDom = document.getElementById(`${this.options.baseDiv}_${this.selectedElementId}`) as any as SVGGElement;
        const nodeBoundsFromDom = nodeFromDom.getBoundingClientRect();
        this.setMainPosition(viewportResult, nodeBoundsFromDom);
        // set position of expand button
        this.setPosition(this.expandButton, this.expandButtonPosition, nodeBoundsFromDom);
        // set position of container(s)
        const sameSide = this.smartConnectorItems.every(e => e.position === this.smartConnectorItems[0].position);
        if (sameSide)
            {this.setPosition(this.smartConnectorContainer, this.smartConnectorItems[0].position, nodeBoundsFromDom);}
        else {
            for (let i = 0; i < this.smartConnectorContainer.childElementCount; i++) {
                this.setPosition(this.smartConnectorContainer.children[i] as HTMLElement, this.smartConnectorItems[i].position,
                    nodeBoundsFromDom, true);
            }
        }
        this.hideSmartConnector();
    }

    protected async requestAvailableOptions(contextElement?: GModelElement): Promise<void> {
        const requestAction = RequestContextActions.create({
            contextId: SmartConnector.ID,
            editorContext: {
                selectedElementIds: [this.selectedElementId],
                args: { nodeType: contextElement!.type }
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.smartConnectorItems = response.actions.map(e => e as SmartConnectorGroupItem);
        this.createBody();
    }

    protected setMainPosition(viewport: ViewportResult, nodeBounds: DOMRect): void {
        const xCenter = nodeBounds.x + nodeBounds.width/2 - viewport.canvasBounds.x;
        const yCenter = nodeBounds.y + nodeBounds.height/2 - viewport.canvasBounds.y;
        this.containerElement.style.left = `${xCenter}px`;
        this.containerElement.style.top = `${yCenter}px`;
    }

    protected setPosition(element: HTMLElement, position: SmartConnectorPosition, nodeBounds: DOMRect, single?: boolean): void {
        const zoom = this.currentZoom;
        element.style.transform = `scale(${zoom})`;
        const nodeHeight = nodeBounds.height;
        const nodeWidth = nodeBounds.width;
        let xDiff = -element.offsetWidth/2;
        let yDiff = -element.offsetHeight/2*zoom;
        if (position === SmartConnectorPosition.Right || position === SmartConnectorPosition.Left) {
            xDiff = nodeWidth/2 + CONTAINER_PADDING_PX*zoom;
            element.style.top = `${yDiff}px`;
        }
        if (position === SmartConnectorPosition.Top || position === SmartConnectorPosition.Bottom) {
            yDiff = nodeHeight/2 + CONTAINER_PADDING_PX*zoom;
            element.style.left = `${xDiff}px`;
        }
        if (position === SmartConnectorPosition.Right) {
            element.style.transformOrigin = 'top left';
            element.style.left = `${xDiff}px`;
        }
        if (position === SmartConnectorPosition.Left) {
            element.style.transformOrigin = 'top right';
            element.style.right = `${xDiff}px`;
        }
        if (position === SmartConnectorPosition.Top) {
            element.style.transformOrigin = 'bottom';
            element.style.bottom = `${yDiff}px`;
        }
        if (position === SmartConnectorPosition.Bottom) {
            element.style.transformOrigin = 'top';
            element.style.top = `${yDiff}px`;
        }
        if (single) {element.style.position = 'absolute';}
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.createBody();
        this.createExpandButton();
        this.containerElement.appendChild(this.expandButton);
        containerElement.setAttribute('aria-label', 'Smart-Connector');
    }

    protected createBody(): void {
        const smartConnectorContainer = document.createElement('div');
        smartConnectorContainer.id = SMART_CONNECTOR_CONTAINER_ID;
        for (const item of this.smartConnectorItems) {
            if (item.children) {
                const group = this.createGroup(item);
                this.smartConnectorGroups[group.id] = group;
                smartConnectorContainer.appendChild(group);
            }
        }
        if (this.smartConnectorContainer) {
            this.containerElement.removeChild(this.smartConnectorContainer);
        }
        this.containerElement.appendChild(smartConnectorContainer);
        this.smartConnectorContainer = smartConnectorContainer;
    }

    protected createExpandButton(): void {
        this.expandButton = document.createElement('div');
        this.expandButton.id = EXPAND_BUTTON_ID;
        this.expandButton.innerHTML = '+';
        this.expandButton.onclick = _ev => {
            if(!this.editorContext.isReadonly)
                {showSmartConnector(this.smartConnectorContainer, this.expandButton);}
            };
        this.expandButton.onkeydown = ev => {
            if(matchesKeystroke(ev, 'Space') && !this.editorContext.isReadonly)
                {showSmartConnector(this.smartConnectorContainer, this.expandButton);}
            };
    }

    // default state
    protected hideSmartConnector(): void {
        if (this.smartConnectorContainer && this.expandButton) {
            this.smartConnectorContainer.style.visibility = 'hidden';
            this.expandButton.style.visibility = 'visible';
        }
    }

    // to avoid onclicks on nested hidden > visible
    protected hideAll(): void {
        if (this.smartConnectorContainer && this.expandButton) {
            this.smartConnectorContainer.style.visibility = 'hidden';
            this.expandButton.style.visibility = 'hidden';
        }
    }

    protected createGroup(item: SmartConnectorGroupItem): HTMLElement {
        const searchField = this.createSearchField(item);
        const group = document.createElement('div');
        if (item.children!.length === 0) {return group;}
        const groupItems = document.createElement('div');
        group.classList.add(GROUP_CONTAINER_CLASS);
        groupItems.classList.add(GROUP_CLASS);
        group.id = item.id;
        for (const child of item.children!) {
            groupItems.appendChild(this.createToolButton(child));
        }
        if (item.showTitle) {
            const header = this.createGroupHeader(item, groupItems, searchField);
            if (item.position === SmartConnectorPosition.Top) {
                // the header is at the bottom on top
                group.appendChild(groupItems);
                if (item.children!.length > 1) {group.appendChild(searchField);}
                group.appendChild(header);
                this.groupIsTop[group.id] = true;
                return group;
            }
            group.appendChild(header);
        }
        if (item.children!.length > 1) {group.appendChild(searchField);}
        group.appendChild(groupItems);
        this.groupIsTop[group.id] = false;
        return group;
    }

    protected createGroupHeader(group: SmartConnectorGroupItem, groupItems: HTMLElement, searchField: HTMLElement): HTMLElement{
        const header = document.createElement('div');
        const headerTitle = document.createElement('div');
        header.classList.add(HEADER_CLASS);
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
            const submenuIcon = group.position === SmartConnectorPosition.Top ? createIcon('chevron-up') : createIcon('chevron-down');
            header.appendChild(submenuIcon);
            groupItems.classList.add(COLLAPSABLE_CLASS);
            header.onclick = _ev => {
                this.toggleSubmenu(submenuIcon, group, groupItems, searchField);
            };
            header.onkeydown = ev => {
                if (matchesKeystroke(ev, 'Enter')) {
                    this.toggleSubmenu(submenuIcon, group, groupItems, searchField);
                }
                this.headerNavigation(ev, groupItems, header);
            };
            this.groupIsCollapsed[group.id] = true;
        }
        return header;
    }

    protected toggleSubmenu(icon: HTMLElement, group: SmartConnectorGroupItem, groupItems: HTMLElement, searchField: HTMLElement): void {
        changeCodiconClass(icon, 'chevron-up');
        changeCodiconClass(icon, 'chevron-down');
        this.groupIsCollapsed[group.id] = !this.groupIsCollapsed[group.id];
        if (groupItems.style.maxHeight) {
            groupItems.style.maxHeight = '';
            searchField.style.maxHeight = '';
        } else {
            groupItems.style.maxHeight = MAX_HEIGHT_GROUP;
            searchField.style.maxHeight = '50px';
        }
    }

    protected createToolButton(item: PaletteItem): HTMLElement {
        const button = document.createElement('div');
        button.tabIndex = 0;
        button.classList.add(TOOL_BUTTON_CLASS);
        if (item.icon) {
            button.appendChild(createIcon(item.icon));
            return button;
        }
        button.insertAdjacentText('beforeend', item.label);
        button.onclick = this.onClickCreateToolButton(button, item);
        button.onkeydown = ev => this.toolButtonKeyHandler(ev, item);
        button.id = item.id;
        return button;
    }

    protected createSearchField(itemGroup: SmartConnectorGroupItem): HTMLElement {
        const searchField = document.createElement('input');
        searchField.classList.add('smart-connector-search');
        searchField.id = itemGroup.id + SEARCH_FIELD_SUFFIX;
        searchField.type = 'text';
        searchField.placeholder = ' Search...';
        searchField.onkeyup = () => this.requestFilterUpdate(this.searchFields[itemGroup.id].value, itemGroup);
        searchField.onkeydown = ev => this.searchFieldKeyHandler(ev, itemGroup);
        this.searchFields[itemGroup.id] = searchField;
        const searchContainer = document.createElement('div');
        const containerClass = itemGroup.submenu ? 'smart-connector-submenu-search-container' : 'smart-connector-search-container';
        searchContainer.classList.add(containerClass);
        searchContainer.appendChild(searchField);
        return searchContainer;
    }

    // #region event handlers

    protected requestFilterUpdate(filter: string, itemGroup: SmartConnectorGroupItem): void {
        if (itemGroup.children) {
            const matchingChildren = itemGroup.children.filter(child => child.label.toLowerCase().includes(filter.toLowerCase()));
            if (matchingChildren.length > 0) {
                const items = document.getElementById(itemGroup.id)?.getElementsByClassName(TOOL_BUTTON_CLASS);
                if (items) {
                    Array.from(items).forEach(item => {
                        if (matchingChildren.find(child => child.id === item.id)) {(item as HTMLElement).style.display = 'block';}
                        else {(item as HTMLElement).style.display = 'none';}
                    });
                }
            }
        }
    }

    protected toolButtonKeyHandler(event: KeyboardEvent, item: PaletteItem): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.actionDispatcher.dispatch(EnableDefaultToolsAction.create());
        }
        if (matchesKeystroke(event, 'Enter')) {
            this.createTool(item);
        }
        if (event.ctrlKey) {
        // matchesKeystroke with Ctrl and Ctrl+F does not seem to work on Windows 11/Chrome
        // if (matchesKeystroke(event, 'ControlLeft')) {
        // if (matchesKeystroke(event, 'KeyF', 'ctrlCmd')) {
            const parentId = this.smartConnectorItems.find(e => e.children?.includes(item))!.id;
            const searchFieldId = parentId + SEARCH_FIELD_SUFFIX;
            const searchField = document.getElementById(searchFieldId);
            if (searchField) {(searchField as HTMLElement).focus();}
        }
        this.toolButtonNavigation(event, item);
    }

    protected searchFieldKeyHandler(event: KeyboardEvent, itemGroup: SmartConnectorGroupItem): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.searchFields[itemGroup.id].value = '';
            this.requestFilterUpdate('', itemGroup);
        }
        this.searchFieldNavigation(event, itemGroup);
    }

    // #region navigation handlers

    protected searchFieldNavigation(event: KeyboardEvent, itemGroup: SmartConnectorGroupItem): void {
        if (matchesKeystroke(event, this.previousElementKeyCode)) {
            (document.getElementById(itemGroup.children![itemGroup.children!.length-1].id) as HTMLElement).focus();
        }
        if (matchesKeystroke(event, this.nextElementKeyCode)) {
            (document.getElementById(itemGroup.children![0].id) as HTMLElement).focus();
        }
    }

    protected headerNavigation(event: KeyboardEvent, groupItems: HTMLElement, header: HTMLElement): void {
        const parent = header.parentElement!;
        if (matchesKeystroke(event, this.previousElementKeyCode)) {
            if ((this.groupIsCollapsed[parent.id] || !this.groupIsTop[parent.id]) && parent.previous()) {
                const collapsableHeader = getHeaderIfGroupContainsCollapsable(parent.previous());
                if (collapsableHeader &&
                    (this.groupIsTop[parent.previous().id] || this.groupIsCollapsed[parent.previous().id])) {collapsableHeader.focus();}
                else {this.getPreviousGroupLastItem(parent).focus();}
            }
            else if (!this.groupIsCollapsed[parent.id] && header.previous()) {(groupItems.last()).focus();}
        }
        if (matchesKeystroke(event, this.nextElementKeyCode)) {
            if ((this.groupIsCollapsed[parent.id] || this.groupIsTop[parent.id]) && parent.next()) {
                const collapsableHeader = getHeaderIfGroupContainsCollapsable(parent.next());
                if (collapsableHeader &&
                    (!this.groupIsTop[parent.next().id] || this.groupIsCollapsed[parent.next().id])) {collapsableHeader.focus();}
                else {this.getNextGroupFirstItem(parent).focus();}
            }
            else if (!this.groupIsCollapsed[parent.id] && header.next()) {(groupItems.first()).focus();}
        }
    }

    protected toolButtonNavigation(event: KeyboardEvent, item: PaletteItem): void {
        const parentId = this.smartConnectorItems.find(e => e.children?.includes(item))!.id;
        const parent = document.getElementById(parentId)!;
        const toolButton = document.getElementById(item.id)!;
        const collapsableHeader = getHeaderIfGroupContainsCollapsable(parent);
        if (matchesKeystroke(event, this.previousElementKeyCode)) {
            const previousGroupCollapsableHeader = getHeaderIfGroupContainsCollapsable(parent.previous());
            if (toolButton.previous()) {toolButton.previous().focus();}
            else if (collapsableHeader && !this.groupIsTop[parent.id]) {collapsableHeader.focus();}
            else if (previousGroupCollapsableHeader && this.groupIsTop[parent.previous().id]) {previousGroupCollapsableHeader.focus();}
            else if (parent.previous()) {this.getPreviousGroupLastItem(parent).focus();}
        }
        if (matchesKeystroke(event, this.nextElementKeyCode)) {
            const nextGroupCollapsableHeader = getHeaderIfGroupContainsCollapsable(parent.next());
            if (toolButton.next()) {toolButton.next().focus();}
            else if (collapsableHeader && this.groupIsTop[parent.id]) {collapsableHeader.focus();}
            else if (nextGroupCollapsableHeader && !this.groupIsTop[parent.next().id]) {nextGroupCollapsableHeader.focus();}
            else if (parent.next()) {this.getNextGroupFirstItem(parent).focus();}
        }
    }

    protected getNextGroupFirstItem(parent: HTMLElement): HTMLElement {
        return parent.nextElementSibling!.getElementsByClassName(GROUP_CLASS)[0].firstElementChild as HTMLElement;
    }

    protected getPreviousGroupLastItem(parent: HTMLElement): HTMLElement {
        return parent.previousElementSibling!.getElementsByClassName(GROUP_CLASS)[0].lastElementChild as HTMLElement;
    }

    // #endregion

    protected onClickCreateToolButton(_button: HTMLElement, item: PaletteItem)  {
        return (_ev: MouseEvent) => {
            this.createTool(item);
        };
    }

    protected createTool(item: PaletteItem): void {
        if (!this.editorContext.isReadonly) {
            item.actions.forEach(e => {
                let args: Args;
                if (TriggerEdgeCreationAction.is(e)) {
                    args = { source: this.selectedElementId };
                    (e as TriggerEdgeCreationAction).args = args;
                }
                if (TriggerNodeCreationAction.is(e)) {
                    args = { createEdge: true, source: this.selectedElementId, edgeType: (item as SmartConnectorNodeItem).edgeType };
                    (e as TriggerNodeCreationAction).args = args;
                }
            });
            this.actionDispatcher.dispatchAll(item.actions.concat([SetUIExtensionVisibilityAction.create(
                { extensionId: SmartConnector.ID, visible: false })
            ]));
            this.hideAll();
        }
    }

    // #endregion

    handle(action: Action): ICommand | Action | void {
        if (OpenSmartConnectorAction.is(action)) {
            this.selectedElementId = action.selectedElementID;
            this.actionDispatcher.dispatch(
                SetUIExtensionVisibilityAction.create({ extensionId: SmartConnector.ID, visible: true })
            );
        }
        else {
            this.actionDispatcher.dispatch(
                SetUIExtensionVisibilityAction.create({ extensionId: SmartConnector.ID, visible: false })
            );
            this.hideAll();
        }
    }

    async preRequestModel(): Promise<void> {
        const requestAction = RequestContextActions.create({
            contextId: SmartConnector.ID,
            editorContext: {
                selectedElementIds: []
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.smartConnectorItems = response.actions.map(e => e as SmartConnectorGroupItem);
    }
}

export function showSmartConnector(container: HTMLElement, expandButton: HTMLElement): void {
    container.style.visibility = 'visible';
    expandButton.style.visibility = 'hidden';
}

function getHeaderIfGroupContainsCollapsable(group: HTMLElement): HTMLElement | undefined {
    if (group && group.getElementsByClassName(COLLAPSABLE_CLASS).length !== 0) {
        return group.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
    }
    return undefined;
}

@injectable()
export class SmartConnectorKeyListener extends KeyListener {
    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        const container = document.getElementById(SMART_CONNECTOR_CONTAINER_ID)!;
        const expandButton = document.getElementById(EXPAND_BUTTON_ID);
        const smartConnector = expandButton?.parentElement;
        if (matchesKeystroke(event, 'Space') && smartConnector?.style.visibility === 'visible'
            && expandButton?.style.visibility === 'visible') {
            showSmartConnector(container, expandButton);
            const collapsableHeader = getHeaderIfGroupContainsCollapsable(container.firstElementChild as HTMLElement);
            if (collapsableHeader) {
                collapsableHeader.focus();
            }
            else {(container.firstElementChild!.getElementsByClassName(GROUP_CLASS)[0].firstElementChild as HTMLElement).focus();}
        }
        return [];
    }
}

