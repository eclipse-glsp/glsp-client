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
    Action,
    AnchorComputerRegistry,
    EnableDefaultToolsAction,
    findParentByFeature,
    isConnectable,
    isCtrlOrCmd,
    SEdge,
    SModelElement,
    Tool
} from "sprotty";

import { CreateConnectionOperation, CreateNodeOperation, InitCreateOperationAction } from "../../base/operations/operation";
import { GLSP_TYPES } from "../../base/types";
import { getAbsolutePosition } from "../../utils/viewpoint-util";
import { Containable, isContainable } from "../hints/model";
import { IMouseTool } from "../mouse-tool/mouse-tool";
import {
    DrawFeedbackEdgeAction,
    FeedbackEdgeEndMovingMouseListener,
    RemoveFeedbackEdgeAction
} from "../tool-feedback/creation-tool-feedback";
import { CursorCSS, cursorFeedbackAction } from "../tool-feedback/css-feedback";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";
import { DragAwareMouseListener } from "./drag-aware-mouse-listener";

@injectable()
export class NodeCreationTool implements Tool {
    static ID = "tool_create_node";
    readonly id = NodeCreationTool.ID;
    protected creationToolMouseListener: NodeCreationToolMouseListener;
    initAction: InitCreateOperationAction = new InitCreateOperationAction(CreateNodeOperation.KIND, "unknown");
    constructor(@inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher) { }

    enable() {
        this.creationToolMouseListener = new NodeCreationToolMouseListener(this.initAction.elementTypeId, this);
        this.mouseTool.register(this.creationToolMouseListener);
        this.feedbackDispatcher.registerFeedback(this, [cursorFeedbackAction(CursorCSS.NODE_CREATION)]);
    }

    disable() {
        this.mouseTool.deregister(this.creationToolMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [cursorFeedbackAction()]);
    }

    dispatchFeedback(actions: Action[]) {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }
}

@injectable()
export class NodeCreationToolMouseListener extends DragAwareMouseListener {
    protected container?: SModelElement & Containable;
    constructor(protected elementTypeId: string, protected tool: NodeCreationTool) {
        super();
    }

    protected creationAllowed(elementTypeId: string) {
        return this.container && this.container.isContainableElement(elementTypeId);
    }

    nonDraggingMouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (this.creationAllowed(this.elementTypeId)) {
            const containerId = this.container ? this.container.id : undefined;
            const location = getAbsolutePosition(target, event);
            result.push(new CreateNodeOperation(this.elementTypeId, location, containerId));
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
            this.tool.dispatchFeedback([feedback]);
        }
        return [];
    }
}

/**
 * Tool to create connections in a Diagram, by selecting a source and target node.
 */
@injectable()
export class EdgeCreationTool implements Tool {
    static ID = "tool_create_edge";
    readonly id = EdgeCreationTool.ID;
    initAction: InitCreateOperationAction = new InitCreateOperationAction(CreateConnectionOperation.KIND, "unknown");

    protected creationToolMouseListener: EdgeCreationToolMouseListener;
    protected feedbackEndMovingMouseListener: FeedbackEdgeEndMovingMouseListener;

    constructor(@inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool,
        @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected feedbackDispatcher: IFeedbackActionDispatcher,
        @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry) { }

    enable() {
        this.creationToolMouseListener = new EdgeCreationToolMouseListener(this.initAction.elementTypeId, this);
        this.mouseTool.register(this.creationToolMouseListener);
        this.feedbackEndMovingMouseListener = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry);
        this.mouseTool.register(this.feedbackEndMovingMouseListener);
        this.dispatchFeedback([cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)]);
    }

    disable() {
        this.mouseTool.deregister(this.creationToolMouseListener);
        this.mouseTool.deregister(this.feedbackEndMovingMouseListener);
        this.feedbackDispatcher.deregisterFeedback(this, [new RemoveFeedbackEdgeAction(), cursorFeedbackAction()]);
    }

    dispatchFeedback(actions: Action[]) {
        this.feedbackDispatcher.registerFeedback(this, actions);
    }
}

@injectable()
export class EdgeCreationToolMouseListener extends DragAwareMouseListener {
    protected source?: string;
    protected target?: string;
    protected currentTarget?: SModelElement;
    protected allowedTarget: boolean = false;
    protected proxyEdge: SEdge;
    constructor(protected elementTypeId: string, protected tool: EdgeCreationTool) {
        super();
        this.proxyEdge = new SEdge();
        this.proxyEdge.type = elementTypeId;
    }

    protected reinitialize() {
        this.source = undefined;
        this.target = undefined;
        this.currentTarget = undefined;
        this.allowedTarget = false;
        this.tool.dispatchFeedback([new RemoveFeedbackEdgeAction()]);
    }

    nonDraggingMouseUp(element: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            if (!this.isSourceSelected()) {
                if (this.currentTarget && this.allowedTarget) {
                    this.source = this.currentTarget.id;
                    this.tool.dispatchFeedback([new DrawFeedbackEdgeAction(this.elementTypeId, this.source)]);
                }
            } else {
                if (this.currentTarget && this.allowedTarget) {
                    this.target = this.currentTarget.id;
                }
            }
            if (this.isSourceSelected() && this.isTargetSelected()) {
                result.push(new CreateConnectionOperation(this.elementTypeId, this.source, this.target));
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
