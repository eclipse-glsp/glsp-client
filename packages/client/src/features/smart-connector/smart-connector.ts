import { inject, injectable } from 'inversify';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { EditorContextService } from '../../base/editor-context-service';
import { FocusTracker } from '../../base/focus/focus-tracker';
import {
    AbstractUIExtension,
    Action,
    DeleteElementOperation,
    IActionHandler,
    ICommand,
    KeyListener,
    SModelElement,
    SModelRoot,
    isDeletable,
    isSelectable,
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
    SmartConnectorPosition,
} from '~glsp-sprotty'
import { GetViewportAction } from 'sprotty-protocol/lib/actions'
import { createIcon } from '../tool-palette/tool-palette';
import { IDiagramStartup } from 'src';




@injectable()
export class SmartConnector extends AbstractUIExtension implements IActionHandler, IDiagramStartup {
    
    static readonly ID = 'smart-connector';
    static readonly CONTAINER_PADDING = 16;
    

    private selectedElementId: string; 
    private smartConnectorItems: SmartConnectorGroupItem[];
    protected smartConnectorItemsCopy: SmartConnectorGroupItem[] = [];
    private smartConnectorContainer: HTMLElement;
    private expandButton: HTMLElement;

    protected searchField: HTMLInputElement;
    
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
    
    protected override async onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): Promise<void> {
        this.hideSmartConnector(); 
        // TODO temporary for testing, to be replaced by settings 
        var position = SmartConnectorPosition.Top;
        var viewportResult: ViewportResult = await this.actionDispatcher.request(GetViewportAction.create())
        this.setMainPosition(viewportResult)
        this.setPosition(viewportResult, this.expandButton, position)
        await this.requestAvailableOptions(contextElementIds)
        var sameSide = this.smartConnectorItems.every((e) => e.position === this.smartConnectorItems[0].position)
        if (sameSide)
            this.setPosition(viewportResult, this.smartConnectorContainer, this.smartConnectorItems[0].position)
        else {
            for (var i = 0; i < this.smartConnectorContainer.childElementCount; i++) {
                this.setPosition(viewportResult, this.smartConnectorContainer.children[i] as HTMLElement, this.smartConnectorItems[i].position, true)
            }
        }
    }

    protected async requestAvailableOptions(contextElementIds: string[]) {
        const requestAction = RequestContextActions.create({
            contextId: SmartConnector.ID,
            editorContext: {
                selectedElementIds: contextElementIds
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.smartConnectorItems = response.actions.map(e => e as SmartConnectorGroupItem);
    }

    protected setMainPosition(viewport: ViewportResult) {
        // TODO: get element from server instead of DOM
        var nodeFromDom = document.getElementById(`${this.options.baseDiv}_${this.selectedElementId}`) as any as SVGGElement;
        if (nodeFromDom) {
            var nodeBoundsFromDom = nodeFromDom.getBoundingClientRect();
            var xCenter = nodeBoundsFromDom.x + nodeBoundsFromDom.width/2 - viewport.canvasBounds.x
            var yCenter = nodeBoundsFromDom.y + nodeBoundsFromDom.height/2 - viewport.canvasBounds.y
            this.containerElement.style.left = `${xCenter}px`;
            this.containerElement.style.top = `${yCenter}px`;
        } 
    }

    protected setPosition(viewport: ViewportResult, element: HTMLElement, position: SmartConnectorPosition, setAbsolute?: boolean) {
        var zoom = viewport.viewport.zoom;
        // TODO: get element from server instead of DOM
        var nodeFromDom = document.getElementById(`${this.options.baseDiv}_${this.selectedElementId}`) as any as SVGGElement;
        if (nodeFromDom) {
            var nodeHeight = nodeFromDom.getBoundingClientRect().height;
            var nodeWidth = nodeFromDom.getBoundingClientRect().width;
            var xDiff = -element.offsetWidth/2;
            var yDiff = -element.offsetHeight/2;
            if (position == SmartConnectorPosition.Right) {
                xDiff = nodeWidth/2;
                //element.style.flexDirection = 'column';
            }  
            if (position == SmartConnectorPosition.Left) {
                xDiff = -(nodeWidth/2 + element.offsetWidth);
                //element.style.flexDirection = 'column';
            }
            if (position == SmartConnectorPosition.Top) {
                yDiff = -(nodeHeight/2 + element.offsetHeight);
                //element.style.flexDirection = 'row';
            }
            if (position == SmartConnectorPosition.Bottom) {
                yDiff = nodeHeight/2;
                //element.style.flexDirection = 'row';
            }
            if (setAbsolute) element.style.position = 'absolute';
            element.style.left = `${xDiff}px`;
            element.style.top = `${yDiff}px`;
            console.log('width', nodeWidth, 'height', nodeHeight)
            element.style.transform = `scale(${zoom})`;
        } 
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.createBody();
        this.containerElement.appendChild(this.smartConnectorContainer)
        this.createExpandButton();
        this.containerElement.appendChild(this.expandButton);
        containerElement.setAttribute('aria-label', 'Smart-Connector');
    }

    protected createBody() {
        this.smartConnectorContainer = document.createElement('div');
        this.smartConnectorContainer.classList.add('smart-connector-container')
        for (const item of this.smartConnectorItems) {
            if (item.children) {
                var group = this.createGroup(item);
                this.smartConnectorContainer.appendChild(group);    
            }
        }
    }

    protected createExpandButton() {
        this.expandButton = document.createElement('div');
        this.expandButton.className = 'smart-connector-expand-button';
        this.expandButton.innerHTML = '+'
        this.expandButton.onclick = this.showSmartConnector();
    }

    protected showSmartConnector() {
        return (_ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                this.smartConnectorContainer.style.visibility = 'visible';
                this.expandButton.style.visibility = 'hidden';
            }
        };
    }

    // default state
    protected hideSmartConnector() {
        if (this.smartConnectorContainer && this.expandButton) {
            this.smartConnectorContainer.style.visibility = 'hidden';
            this.expandButton.style.visibility = 'visible';
        }
    }

    private createGroup(item: SmartConnectorGroupItem): HTMLElement {
        const group = document.createElement('div');
        group.classList.add('smart-connector-button-container');
        group.id = item.id;
        if (item.showTitle) {
            const header = document.createElement('div');
            header.classList.add('group-header');
            if (item.icon) {
                header.appendChild(createIcon(item.icon));
            }
            header.insertAdjacentText('beforeend', item.label);
            group.appendChild(header);   
        }
            
        for (const child of item.children!) {
            group.appendChild(this.createToolButton(child));
        }   
        return group;
    }

    protected createToolButton(item: PaletteItem): HTMLElement {
        const button = document.createElement('div');
        button.tabIndex = 0;
        button.classList.add('smart-connector-button');
        if (item.icon) {
            button.appendChild(createIcon(item.icon));
            return button;
        }
        button.insertAdjacentText('beforeend', item.label);
        button.onclick = this.onClickCreateToolButton(button, item);
        //TODO: keyboard support
        //button.onkeydown = ev => this.clearToolOnEscape(ev);
        return button;
    }

    protected createSearchField(): HTMLInputElement {
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

    protected requestFilterUpdate(filter: string): void {
        // Initialize the copy if it's empty
        if (this.smartConnectorItemsCopy.length === 0) {
            // Creating deep copy
            this.smartConnectorItemsCopy = JSON.parse(JSON.stringify(this.smartConnectorItems));
        }

        // Reset the paletteItems before searching
        this.smartConnectorItems = JSON.parse(JSON.stringify(this.smartConnectorItemsCopy));
        // Filter the entries
        const filteredPaletteItems: PaletteItem[] = [];
        
        for (var itemGroup of this.smartConnectorItems) {
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
            itemGroup.children?.push(...filteredPaletteItems);
        }
        
        this.createBody();
    }

    protected clearOnEscape(event: KeyboardEvent): void {
        if (matchesKeystroke(event, 'Escape')) {
            this.searchField.value = '';
            this.requestFilterUpdate('');
        }
    }

    protected onClickCreateToolButton(button: HTMLElement, item: PaletteItem) {
        return (_ev: MouseEvent) => {
            if (!this.editorContext.isReadonly) {
                item.actions.forEach(e => {
                    var args: Args;
                    if (TriggerEdgeCreationAction.is(e)) {
                        args = { source: this.selectedElementId };
                        (e as TriggerEdgeCreationAction).args = args;
                    }
                    if (TriggerNodeCreationAction.is(e)) {
                        args = { createEdge: true, source: this.selectedElementId };
                        (e as TriggerNodeCreationAction).args = args;
                    }
                });
                this.actionDispatcher.dispatchAll(item.actions.concat([SetUIExtensionVisibilityAction.create({ extensionId: SmartConnector.ID, visible: false })]));
                this.hideSmartConnector();
                button.focus();
            }
        };
    }

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
            this.hideSmartConnector();
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

@injectable()
export class SmartConnectorKeyListener extends KeyListener {
    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Delete', 'ctrl')) {
            const deleteElementIds = Array.from(
                element.root.index
                    .all()
                    .filter(e => isDeletable(e) && isSelectable(e) && e.selected)
                    .filter(e => e.id !== e.root.id)
                    .map(e => e.id)
            );
            if (deleteElementIds.length > 0) {
                return [DeleteElementOperation.create(deleteElementIds)];
            }
        }
        return [];
    }
}


