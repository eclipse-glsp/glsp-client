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
} from '~glsp-sprotty'
import { GetViewportAction } from 'sprotty-protocol/lib/actions'
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { createIcon } from '../tool-palette/tool-palette';


@injectable()
export class SmartConnector extends AbstractUIExtension implements IActionHandler, IDiagramStartup {
    
    static readonly ID = 'smart-connector';
    static readonly CONTAINER_PADDING = 16;

    private selectedElementId: string; 
    private paletteItems: PaletteItem[];
    private edgeContainer: HTMLElement;
    private nodeContainer: HTMLElement;
    
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
        var response: ViewportResult = await this.actionDispatcher.request(GetViewportAction.create())
        var zoom = response.viewport.zoom;
        // TODO: get element from server instead of DOM
        var elementFromDom = document.getElementById(`${this.options.baseDiv}_${this.selectedElementId}`) as any as SVGGElement;
        
        if (elementFromDom) {
            var elementSvgWidth = elementFromDom.getBBox().width;
            var elementBoundsFromDom = elementFromDom.getBoundingClientRect();
            containerElement.style.width = `${elementSvgWidth + this.edgeContainer.offsetWidth + this.nodeContainer.offsetWidth + SmartConnector.CONTAINER_PADDING/zoom}px`
            containerElement.style.left = `${elementBoundsFromDom.x - containerElement.offsetWidth/2 + elementBoundsFromDom.width/2 - response.canvasBounds.x}px`;
            containerElement.style.top = `${elementBoundsFromDom.y - containerElement.offsetHeight/2 + elementBoundsFromDom.height/2 - response.canvasBounds.y}px`;
        } 
        containerElement.style.transform = `scale(${zoom})`;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.setAttribute('aria-label', 'Smart-Connector');
        var container;
        for (const item of this.paletteItems) {
            if (item.children) {
                container = this.createContainer(item);
                containerElement.appendChild(container);
                if (item.id == 'node-group') this.nodeContainer = container;
                if (item.id == 'edge-group') this.edgeContainer = container;
            }
            
        }
    }

    private createContainer(item: PaletteItem): HTMLElement {
        const container = document.createElement('div');
        container.className = 'smart-connector-button-container';
        for (const child of item.children!) {
            container.appendChild(this.createToolButton(child));
        }   
        return container;
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
        else
            this.actionDispatcher.dispatch(
                SetUIExtensionVisibilityAction.create({ extensionId: SmartConnector.ID, visible: false })
            );
    }

    async preRequestModel(): Promise<void> {
        const requestAction = RequestContextActions.create({
            contextId: SmartConnector.ID,
            editorContext: {
                selectedElementIds: []
            }
        });
        const response = await this.actionDispatcher.request<SetContextActions>(requestAction);
        this.paletteItems = response.actions.map(e => e as PaletteItem);
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


