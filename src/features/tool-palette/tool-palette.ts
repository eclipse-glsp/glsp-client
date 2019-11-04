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
    IActionDispatcher,
    IActionHandler,
    ICommand,
    SetUIExtensionVisibilityAction,
    SModelRoot,
    TYPES
} from "sprotty/lib";

import { isSetOperationsAction, Operation, parentGroup } from "../operation/set-operations";
import { deriveToolId } from "../tools/creation-tool";
import { MouseDeleteTool } from "../tools/delete-tool";
import { RequestMarkersAction } from "../validation/validate";

const CLICKED_CSS_CLASS = "clicked";
@injectable()
export class ToolPalette extends AbstractUIExtension {
    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher;
    static readonly ID = "glsp_tool_palette";

    readonly id = ToolPalette.ID;
    readonly containerClass = "tool-palette";
    protected operations: Operation[];
    protected lastActivebutton?: HTMLElement;
    protected defaultToolsButton: HTMLElement;
    modelRootId: string;


    initialize() {
        if (!this.operations) {
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
        // Greate operation groups
        const groups: Map<string, HTMLElement> = new Map();
        this.operations.map(parentGroup).forEach(group => {
            if (!groups.has(group.id)) {
                groups.set(group.id, createToolGroup(group.label, group.id));
            }
        });

        // Fill groups
        this.operations.forEach(op => {
            const button = this.createToolButton(op);
            const group = parentGroup(op);
            const htmlGroup = groups.get(group.id);
            if (htmlGroup) {
                htmlGroup.appendChild(button);
            }
        });

        // Add groups to container
        Array.from(groups.values()).forEach(group => bodyDiv.appendChild(group));
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

    protected createToolButton(operation: Operation): HTMLElement {
        const button = document.createElement("div");
        button.classList.add("tool-button");
        button.innerHTML = operation.label;
        button.onclick = this.onClickToolButton(button, deriveToolId(operation.operationKind, operation.elementTypeId));
        return button;
    }

    protected onClickToolButton(button: HTMLElement, toolId?: string) {
        return (ev: MouseEvent) => {
            const action = toolId ? new EnableToolsAction([toolId]) : new EnableDefaultToolsAction();
            this.actionDispatcher.dispatch(action);
            this.changeActiveButton(button);
            this.restoreFocus();
        };
    }

    setOperations(operations: Operation[]) {
        this.operations = operations;
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
}

function createIcon(cssClasses: string[]) {
    const icon = document.createElement("i");
    icon.classList.add(...cssClasses);
    return icon;
}

function createToolGroup(label: string, groupId: string): HTMLElement {
    const group = document.createElement("div");
    group.classList.add("tool-group");
    group.id = groupId;
    const header = document.createElement("div");
    header.classList.add("group-header");
    header.appendChild(createIcon(["fas", "fa-hammer"]));
    header.insertAdjacentText('beforeend', label);
    header.ondblclick = (ev) => {
        const css = "collapsed";
        changeCSSClass(group, css);
        Array.from(group.children).forEach(item => changeCSSClass(item, css));
        window!.getSelection()!.removeAllRanges();
    };

    group.appendChild(header);
    return group;
}

function changeCSSClass(element: Element, css: string) {
    element.classList.contains(css) ? element.classList.remove(css) :
        element.classList.add(css);
}
@injectable()
export class ToolPaletteActionHandler implements IActionHandler {
    @inject(ToolPalette) protected readonly toolPalette: ToolPalette;

    handle(action: Action): ICommand | Action | void {
        if (isSetOperationsAction(action)) {
            this.toolPalette.setOperations(action.operations);
            return new SetUIExtensionVisibilityAction(ToolPalette.ID, true);
        } else if (action instanceof EnableDefaultToolsAction) {
            this.toolPalette.changeActiveButton();
        }
    }
}
