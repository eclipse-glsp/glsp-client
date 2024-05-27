/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
    Action,
    AnchorComputerRegistry,
    CreateEdgeOperation,
    GModelElement,
    RequestCheckEdgeAction,
    TYPES,
    TriggerEdgeCreationAction,
    findParentByFeature,
    isConnectable,
    isCtrlOrCmd
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { GEdge } from '../../../model';
import { Grid } from '../../grid/grid';
import { ITypeHintProvider } from '../../hints/type-hint-provider';
import { BaseCreationTool } from '../base-tools';
import { DrawFeedbackEdgeAction, RemoveFeedbackEdgeAction } from './dangling-edge-feedback';
import { FeedbackEdgeEndMovingMouseListener } from './edge-creation-tool-feedback';

/**
 * Tool to create connections in a Diagram, by selecting a source and target node.
 */
@injectable()
export class EdgeCreationTool extends BaseCreationTool<TriggerEdgeCreationAction> {
    static ID = 'tool_create_edge';

    @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry;
    @inject(TYPES.ITypeHintProvider) protected typeHintProvider: ITypeHintProvider;
    @optional() @inject(TYPES.Grid) protected grid: Grid;

    protected isTriggerAction = TriggerEdgeCreationAction.is;

    get id(): string {
        return EdgeCreationTool.ID;
    }

    doEnable(): void {
        const mouseMovingFeedback = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry, this.feedbackDispatcher);
        const toolFeedback = this.createFeedbackEmitter()
            .add(cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED), cursorFeedbackAction())
            .submit();
        const creationListener = new EdgeCreationToolMouseListener(
            this.triggerAction,
            this.actionDispatcher,
            this.typeHintProvider,
            this,
            this.grid?.x / 2
        );
        this.toDisposeOnDisable.push(
            mouseMovingFeedback,
            this.mouseTool.registerListener(mouseMovingFeedback),
            creationListener,
            this.mouseTool.registerListener(creationListener),
            toolFeedback
        );
    }
}

export class EdgeCreationToolMouseListener extends DragAwareMouseListener {
    protected source?: string;
    protected target?: string;
    protected currentTarget?: GModelElement;
    protected allowedTarget = false;
    protected proxyEdge: GEdge;
    protected pendingDynamicCheck = false;
    protected cursorFeedback: FeedbackEmitter;
    protected feedbackEdgeFeedback: FeedbackEmitter;

    constructor(
        protected triggerAction: TriggerEdgeCreationAction,
        protected actionDispatcher: GLSPActionDispatcher,
        protected typeHintProvider: ITypeHintProvider,
        protected tool: EdgeCreationTool,
        protected dragSensitivity?: number
    ) {
        super(dragSensitivity);
        this.proxyEdge = new GEdge();
        this.proxyEdge.type = triggerAction.elementTypeId;
        this.cursorFeedback = tool.createFeedbackEmitter();
        this.feedbackEdgeFeedback = tool.createFeedbackEmitter();
    }

    override nonDraggingMouseUp(_element: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            if (!this.isSourceSelected()) {
                if (this.currentTarget && this.allowedTarget) {
                    this.source = this.currentTarget.id;
                    this.feedbackEdgeFeedback
                        .add(
                            DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source }),
                            RemoveFeedbackEdgeAction.create()
                        )
                        .submit();
                }
            } else if (this.currentTarget && this.allowedTarget) {
                this.target = this.currentTarget.id;
            }
            if (this.source && this.target) {
                result.push(
                    CreateEdgeOperation.create({
                        elementTypeId: this.triggerAction.elementTypeId,
                        sourceElementId: this.source,
                        targetElementId: this.target,
                        args: this.triggerAction.args
                    })
                );
                if (!isCtrlOrCmd(event)) {
                    result.push(EnableDefaultToolsAction.create());
                } else {
                    this.dispose();
                }
            }
        } else if (event.button === 2) {
            this.dispose();
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

    override mouseOver(target: GModelElement, event: MouseEvent): Action[] {
        const newCurrentTarget = findParentByFeature(target, isConnectable);
        if (newCurrentTarget !== this.currentTarget) {
            this.pendingDynamicCheck = false;
            this.currentTarget = newCurrentTarget;
            if (this.currentTarget) {
                if (!this.isSourceSelected()) {
                    this.allowedTarget = this.canConnect(newCurrentTarget, 'source');
                } else if (!this.isTargetSelected()) {
                    this.allowedTarget = this.canConnect(newCurrentTarget, 'target');
                }
                if (this.pendingDynamicCheck) {
                    return [cursorFeedbackAction(CursorCSS.EDGE_CHECK_PENDING)];
                }
            } else {
                this.allowedTarget = false;
            }
            return [this.updateEdgeFeedback()];
        }
        return [];
    }

    protected updateEdgeFeedback(): Action {
        if (this.allowedTarget) {
            const action = !this.isSourceSelected()
                ? cursorFeedbackAction(CursorCSS.EDGE_CREATION_SOURCE)
                : cursorFeedbackAction(CursorCSS.EDGE_CREATION_TARGET);
            return action;
        }
        return cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED);
    }

    protected canConnect(element: GModelElement | undefined, role: 'source' | 'target'): boolean {
        if (!element || !isConnectable(element) || !element.canConnect(this.proxyEdge, role)) {
            return false;
        }
        if (!this.isDynamic(this.proxyEdge.type)) {
            return true;
        }
        const sourceElement = this.source ?? element;
        const targetElement = this.source ? element : undefined;

        this.pendingDynamicCheck = true;
        // Request server edge check
        this.actionDispatcher
            .request(RequestCheckEdgeAction.create({ sourceElement, targetElement, edgeType: this.proxyEdge.type }))
            .then(result => {
                if (this.pendingDynamicCheck) {
                    this.allowedTarget = result.isValid;
                    this.actionDispatcher.dispatch(this.updateEdgeFeedback());
                    this.pendingDynamicCheck = false;
                }
            })
            .catch(err => console.error('Dynamic edge check failed with: ', err));
        // Temporarily mark the target as invalid while we wait for the server response,
        // so a fast-clicking user doesn't get a chance to create the edge in the meantime.
        return false;
    }

    protected isDynamic(edgeTypeId: string): boolean {
        const typeHint = this.typeHintProvider.getEdgeTypeHint(edgeTypeId);
        return typeHint?.dynamic ?? false;
    }

    override dispose(): void {
        this.source = undefined;
        this.target = undefined;
        this.currentTarget = undefined;
        this.allowedTarget = false;
        this.feedbackEdgeFeedback.dispose();
        this.cursorFeedback.dispose();
        super.dispose();
    }
}
