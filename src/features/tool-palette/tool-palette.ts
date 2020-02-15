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
import { inject, injectable } from "inversify";
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

import { isSetContextActionsAction, RequestContextActions } from "../../base/actions/context-actions";
import { CreateConnectionOperation, CreateNodeOperation, InitCreateOperationAction } from "../../base/operations/operation";
import { GLSPActionDispatcher } from "../request-response/glsp-action-dispatcher";
import { MouseDeleteTool } from "../tools/delete-tool";
import { RequestMarkersAction } from "../validation/validate";
import { ToolPaletteEdgeCreationTool, ToolPaletteNodeCreationTool } from "./creation-tool";
import { PaletteItem, PaletteItemSelectionProvider } from "./palette-item";

const CLICKED_CSS_CLASS = "clicked";

@injectable()
export class EnableToolPaletteAction implements Action {
    static readonly KIND = "enableToolPalette";
    readonly kind = EnableToolPaletteAction.KIND;
}
@injectable()
export class ToolPalette extends AbstractUIExtension implements IActionHandler {

    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: GLSPActionDispatcher;
    @inject(TYPES.IToolManager) protected readonly toolManager: IToolManager;
    @inject(PaletteItemSelectionProvider) protected readonly selectionProvider: PaletteItemSelectionProvider;
    static readonly ID = "tool-palette";

    readonly id = ToolPalette.ID;
    readonly containerClass = "tool-palette";
    protected paletteItems: PaletteItem[];
    protected lastActivebutton?: HTMLElement;
    protected defaultToolsButton: HTMLElement;
    modelRootId: string;

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
    }

    protected createBody(): void {
        const bodyDiv = document.createElement("div");
        bodyDiv.classList.add("palette-body");
        const compareFn = (a: PaletteItem, b: PaletteItem) => a.sortString.localeCompare(b.sortString);
        this.paletteItems.sort(compareFn)
            .forEach(item => {
                if (item.children) {
                    const group = createToolGroup(item);
                    item.children.sort(compareFn).forEach(child => group.appendChild(this.createToolButton(child)));
                    bodyDiv.appendChild(group);
                } else {
                    bodyDiv.appendChild(this.createToolButton(item));
                }
            });

        this.containerElement.appendChild(bodyDiv);
    }
    protected createHeader(): void {
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
        this.defaultToolsButton.onclick = this.onClickToolButton(this.defaultToolsButton);
        headerTools.appendChild(this.defaultToolsButton);
        this.lastActivebutton = this.defaultToolsButton;

        // Create button for MouseDeleteTool
        const deleteToolButton = createIcon(["fas", "fa-eraser", "fa-xs"]);
        deleteToolButton.onclick = this.onClickToolButton(deleteToolButton, MouseDeleteTool.ID);
        headerTools.appendChild(deleteToolButton);

        // Create button for ValidationTool
        const validateActionButton = createIcon(["fas", "fa-check-square", "fa-xs"]);
        validateActionButton.onclick = (ev: MouseEvent) => {
            const modelIds: string[] = [this.modelRootId];
            this.actionDispatcher.dispatch(new RequestMarkersAction(modelIds));
        };
        headerTools.appendChild(validateActionButton);

        headerCompartment.appendChild(headerTools);
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
            const toolId = deriveToolId(PaletteItem.getInitAction(item));
            this.selectionProvider.setSelection(item);
            this.onClickToolButton(button, toolId)(ev);
        };

    }
    protected onClickToolButton(button: HTMLElement, toolId?: string) {
        return (ev: MouseEvent) => {
            const action = toolId ? new EnableToolsAction([toolId]) : new EnableDefaultToolsAction();
            this.actionDispatcher.dispatch(action);
            this.changeActiveButton(button);
            this.restoreFocus();
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
                    this.actionDispatcher.dispatch(new SetUIExtensionVisibilityAction(ToolPalette.ID, true));
                }
            });
        } else if (action instanceof EnableToolsAction && action.toolIds.includes(ToolPalette.ID)) {
            this.changeActiveButton();
        }
    }
}

function createIcon(cssClasses: string[]) {
    const icon = document.createElement("i");
    icon.classList.add(...cssClasses);
    return icon;
}

function createToolGroup(item: PaletteItem): HTMLElement {
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

function changeCSSClass(element: Element, css: string) {
    element.classList.contains(css) ? element.classList.remove(css) :
        element.classList.add(css);
}

function deriveToolId(initAction?: InitCreateOperationAction): string {
    if (initAction) {
        if (initAction.operationKind === CreateConnectionOperation.KIND) {
            return ToolPaletteEdgeCreationTool.ID;
        } else if (initAction.operationKind === CreateNodeOperation.KIND) {
            return ToolPaletteNodeCreationTool.ID;
        }
    }

    return "unkown";
}

