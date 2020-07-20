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
import { inject, injectable, optional } from "inversify";
import {
    Action,
    AnchorComputerRegistry,
    EnableDefaultToolsAction,
    EnableToolsAction,
    findParentByFeature,
    IActionHandler,
    isConnectable,
    isCtrlOrCmd,
    ISnapper,
    SEdge,
    SModelElement,
    SNode,
    TYPES
} from "sprotty";

import {
    CreateEdgeOperation,
    CreateNodeOperation,
    isTriggerElementTypeCreationAction,
    isTriggerNodeCreationAction,
    TriggerEdgeCreationAction,
    TriggerNodeCreationAction
} from "../../base/operations/operation";
import { getAbsolutePosition } from "../../utils/viewpoint-util";
import { Containable, isContainable } from "../hints/model";
import {
    DrawFeedbackEdgeAction,
    FeedbackEdgeEndMovingMouseListener,
    RemoveFeedbackEdgeAction
} from "../tool-feedback/creation-tool-feedback";
import { CursorCSS, cursorFeedbackAction } from "../tool-feedback/css-feedback";
import { BaseGLSPTool } from "./base-glsp-tool";
import { DragAwareMouseListener } from "./drag-aware-mouse-listener";

@injectable()
export class NodeCreationTool extends BaseGLSPTool implements IActionHandler {
    static ID = "tool_create_node";
    readonly id = NodeCreationTool.ID = "unknown";

    @inject(TYPES.ISnapper) @optional() readonly snapper?: ISnapper;

    protected creationToolMouseListener: NodeCreationToolMouseListener;
    protected triggerAction: TriggerNodeCreationAction;

    enable() {
        if (this.triggerAction === undefined) {
            throw new TypeError(`Could not enable tool ${this.id}.The triggerAction cannot be undefined.`);
        }
        this.creationToolMouseListener = new NodeCreationToolMouseListener(this.triggerAction, this);
        this.mouseTool.register(this.creationToolMouseListener);
        this.feedbackDispatcher.registerFeedback(this, [cursorFeedbackAction(CursorCSS.NODE_CREATION)]);
    }

    disable() {
        this.mouseTool.deregister(this.creationToolMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [cursorFeedbackAction()]);
    }

    handle(action: Action): Action | void {
        if (isTriggerNodeCreationAction(action)) {
            this.triggerAction = action;
            return new EnableToolsAction([this.id]);
        }
    }
}

@injectable()
export class NodeCreationToolMouseListener extends DragAwareMouseListener {
    protected container?: SModelElement & Containable;
    constructor(protected triggerAction: TriggerNodeCreationAction, protected tool: NodeCreationTool) {
        super();
    }
    protected creationAllowed(elementTypeId: string) {
        return this.container && this.container.isContainableElement(this.elementTypeId);
    }

    get elementTypeId() {
        return this.triggerAction.elementTypeId;
    }
    nonDraggingMouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (this.creationAllowed(this.elementTypeId)) {
            const containerId = this.container ? this.container.id : undefined;
            let location = getAbsolutePosition(target, event);
            if (this.tool.snapper) {
                // Create a 0-bounds proxy element for snapping
                const elementProxy = new SNode();
                elementProxy.size = { width: 0, height: 0 };
                location = this.tool.snapper.snap(location, elementProxy);
            }
            result.push(new CreateNodeOperation(this.elementTypeId, location, containerId, this.triggerAction.args));
            if (!isCtrlOrCmd(event)) {
                result.push(new EnableDefaultToolsAction());
            }
        }
        return result;
    }

    mouseOver(target: SModelElement, event: MouseEvent): Action[] {
        const currentContainer = findParentByFeature(target, isContainable);
        if (!this.container || currentContainer !== this.container) {
            this.container = currentContainer;
            const feedback = this.creationAllowed(this.elementTypeId)
                ? cursorFeedbackAction(CursorCSS.NODE_CREATION) :
                cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED);
            this.tool.dispatchFeedback(this, [feedback]);
        }
        return [];
    }
}

/**
 * Tool to create connections in a Diagram, by selecting a source and target node.
 */
@injectable()
export class EdgeCreationTool extends BaseGLSPTool implements IActionHandler {
    static ID = "tool_create_edge";
    readonly id = EdgeCreationTool.ID;

    @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry;

    protected triggerAction: TriggerEdgeCreationAction;
    protected creationToolMouseListener: EdgeCreationToolMouseListener;
    protected feedbackEndMovingMouseListener: FeedbackEdgeEndMovingMouseListener;

    enable() {
        if (this.triggerAction === undefined) {
            throw new TypeError(`Could not enable tool ${this.id}.The triggerAction cannot be undefined.`);
        }
        this.creationToolMouseListener = new EdgeCreationToolMouseListener(this.triggerAction, this);
        this.mouseTool.register(this.creationToolMouseListener);
        this.feedbackEndMovingMouseListener = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry);
        this.mouseTool.register(this.feedbackEndMovingMouseListener);
        this.dispatchFeedback(this, [cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)]);
    }

    disable() {
        this.mouseTool.deregister(this.creationToolMouseListener);
        this.mouseTool.deregister(this.feedbackEndMovingMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [new RemoveFeedbackEdgeAction(), cursorFeedbackAction()]);
    }

    handle(action: Action): Action | void {
        if (isTriggerElementTypeCreationAction(action)) {
            this.triggerAction = action;
            return new EnableToolsAction([this.id]);
        }
    }
}

@injectable()
export class EdgeCreationToolMouseListener extends DragAwareMouseListener {
    protected source?: string;
    protected target?: string;
    protected currentTarget?: SModelElement;
    protected allowedTarget: boolean = false;
    protected proxyEdge: SEdge;

    constructor(protected triggerAction: TriggerEdgeCreationAction, protected tool: EdgeCreationTool) {
        super();
        this.proxyEdge = new SEdge();
        this.proxyEdge.type = triggerAction.elementTypeId;
    }

    protected reinitialize() {
        this.source = undefined;
        this.target = undefined;
        this.currentTarget = undefined;
        this.allowedTarget = false;
        this.tool.dispatchFeedback(this, [new RemoveFeedbackEdgeAction()]);
    }

    nonDraggingMouseUp(element: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            if (!this.isSourceSelected()) {
                if (this.currentTarget && this.allowedTarget) {
                    this.source = this.currentTarget.id;
                    this.tool.dispatchFeedback(this, [new DrawFeedbackEdgeAction(this.triggerAction.elementTypeId, this.source)]);
                }
            } else {
                if (this.currentTarget && this.allowedTarget) {
                    this.target = this.currentTarget.id;
                }
            }
            if (this.isSourceSelected() && this.isTargetSelected()) {
                result.push(new CreateEdgeOperation(this.triggerAction.elementTypeId, this.source, this.target, this.triggerAction.args));
                if (!isCtrlOrCmd(event)) {
                    result.push(new EnableDefaultToolsAction());
                } else {
                    this.reinitialize();
                }
            }
        } else if (event.button === 2) {
            result.push(new EnableDefaultToolsAction());
        }
        return result;
    }

    protected isSourceSelected() {
        return this.source !== undefined;
    }

    protected isTargetSelected() {
        return this.target !== undefined;
    }

    mouseOver(target: SModelElement, event: MouseEvent): Action[] {
        const newCurrentTarget = findParentByFeature(target, isConnectable);
        if (newCurrentTarget !== this.currentTarget) {
            this.currentTarget = newCurrentTarget;
            if (this.currentTarget) {
                if (!this.isSourceSelected()) {
                    this.allowedTarget = this.isAllowedSource(newCurrentTarget);
                } else if (!this.isTargetSelected()) {
                    this.allowedTarget = this.isAllowedTarget(newCurrentTarget);
                }
                if (this.allowedTarget) {
                    const action = !this.isSourceSelected() ? cursorFeedbackAction(CursorCSS.EDGE_CREATION_SOURCE) :
                        cursorFeedbackAction(CursorCSS.EDGE_CREATION_TARGET);
                    return [action];
                }
            }
            return [cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)];
        }
        return [];
    }

    protected isAllowedSource(element: SModelElement | undefined): boolean {
        return element !== undefined && isConnectable(element) && element.canConnect(this.proxyEdge, "source");
    }

    protected isAllowedTarget(element: SModelElement | undefined): boolean {
        return element !== undefined && isConnectable(element) && element.canConnect(this.proxyEdge, "target");
    }
}
