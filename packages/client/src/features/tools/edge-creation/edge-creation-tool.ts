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
import { inject, injectable } from 'inversify';
import {
    Action,
    AnchorComputerRegistry,
    CreateEdgeOperation,
    EnableDefaultToolsAction,
    SEdge,
    SModelElement,
    TriggerEdgeCreationAction,
    findParentByFeature,
    isConnectable,
    isCtrlOrCmd
} from '~glsp-sprotty';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';

import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { BaseGLSPCreationTool } from '../base-glsp-creation-tool';
import { DrawFeedbackEdgeAction, RemoveFeedbackEdgeAction } from './dangling-edge-feedback';
import { FeedbackEdgeEndMovingMouseListener } from './edge-creation-tool-feedback';

/**
 * Tool to create connections in a Diagram, by selecting a source and target node.
 */
@injectable()
export class EdgeCreationTool extends BaseGLSPCreationTool<TriggerEdgeCreationAction> {
    static ID = 'tool_create_edge';

    @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry;

    protected isTriggerAction = TriggerEdgeCreationAction.is;

    get id(): string {
        return EdgeCreationTool.ID;
    }

    doEnable(): void {
        const mouseMovingFeedback = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry, this.feedbackDispatcher);
        this.toDisposeOnDisable.push(
            mouseMovingFeedback,
            this.mouseTool.registerListener(new EdgeCreationToolMouseListener(this.triggerAction, this)),
            this.mouseTool.registerListener(mouseMovingFeedback),
            this.registerFeedback([cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)], this, [
                RemoveFeedbackEdgeAction.create(),
                cursorFeedbackAction()
            ])
        );
    }
}

@injectable()
export class EdgeCreationToolMouseListener extends DragAwareMouseListener {
    protected source?: string;
    protected target?: string;
    protected currentTarget?: SModelElement;
    protected allowedTarget = false;
    protected proxyEdge: SEdge;

    constructor(protected triggerAction: TriggerEdgeCreationAction, protected tool: EdgeCreationTool) {
        super();
        this.proxyEdge = new SEdge();
        this.proxyEdge.type = triggerAction.elementTypeId;
    }

    protected reinitialize(): void {
        this.source = undefined;
        this.target = undefined;
        this.currentTarget = undefined;
        this.allowedTarget = false;
        this.tool.registerFeedback([RemoveFeedbackEdgeAction.create()]);
    }

    override nonDraggingMouseUp(_element: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            if (!this.isSourceSelected()) {
                if (this.currentTarget && this.allowedTarget) {
                    this.source = this.currentTarget.id;
                    this.tool.registerFeedback([
                        DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source })
                    ]);
                }
            } else {
                if (this.currentTarget && this.allowedTarget) {
                    this.target = this.currentTarget.id;
                }
            }
            if (this.source && this.target) {
                if (!isCtrlOrCmd(event)) {
                    result.push(EnableDefaultToolsAction.create());
                } else {
                    this.reinitialize();
                }
                result.push(
                    CreateEdgeOperation.create({
                        elementTypeId: this.triggerAction.elementTypeId,
                        sourceElementId: this.source,
                        targetElementId: this.target,
                        args: this.triggerAction.args
                    })
                );
            }
        } else if (event.button === 2) {
            result.push(EnableDefaultToolsAction.create());
        }
        return result;
    }

    protected isSourceSelected(): boolean {
        return this.source !== undefined;
    }

    protected isTargetSelected(): boolean {
        return this.target !== undefined;
    }

    override mouseOver(target: SModelElement, event: MouseEvent): Action[] {
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
                    const action = !this.isSourceSelected()
                        ? cursorFeedbackAction(CursorCSS.EDGE_CREATION_SOURCE)
                        : cursorFeedbackAction(CursorCSS.EDGE_CREATION_TARGET);
                    return [action];
                }
            }
            return [cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)];
        }
        return [];
    }

    protected isAllowedSource(element: SModelElement | undefined): boolean {
        return element !== undefined && isConnectable(element) && element.canConnect(this.proxyEdge, 'source');
    }

    protected isAllowedTarget(element: SModelElement | undefined): boolean {
        return element !== undefined && isConnectable(element) && element.canConnect(this.proxyEdge, 'target');
    }
}
