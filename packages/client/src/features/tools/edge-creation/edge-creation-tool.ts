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
    RequestCheckEdgeAction,
    GModelElement,
    TYPES,
    TriggerEdgeCreationAction,
    findParentByFeature,
    isConnectable,
    isCtrlOrCmd
} from '@eclipse-glsp/sprotty';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { ITypeHintProvider } from '../../hints/type-hint-provider';
import { BaseCreationTool } from '../base-tools';
import { DrawFeedbackEdgeAction, RemoveFeedbackEdgeAction } from './dangling-edge-feedback';
import { FeedbackEdgeEndMovingMouseListener } from './edge-creation-tool-feedback';
import { GEdge } from '../../../model';

/**
 * Tool to create connections in a Diagram, by selecting a source and target node.
 */
@injectable()
export class EdgeCreationTool extends BaseCreationTool<TriggerEdgeCreationAction> {
    static ID = 'tool_create_edge';

    @inject(AnchorComputerRegistry) protected anchorRegistry: AnchorComputerRegistry;

    @inject(TYPES.ITypeHintProvider) protected typeHintProvider: ITypeHintProvider;

    protected isTriggerAction = TriggerEdgeCreationAction.is;

    get id(): string {
        return EdgeCreationTool.ID;
    }

    doEnable(): void {
        const mouseMovingFeedback = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry, this.feedbackDispatcher);
        this.toDisposeOnDisable.push(
            mouseMovingFeedback,
            this.mouseTool.registerListener(
                new EdgeCreationToolMouseListener(this.triggerAction, this.actionDispatcher, this.typeHintProvider, this)
            ),
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
    protected currentTarget?: GModelElement;
    protected allowedTarget = false;
    protected proxyEdge: GEdge;
    protected pendingDynamicCheck = false;

    constructor(
        protected triggerAction: TriggerEdgeCreationAction,
        protected actionDispatcher: GLSPActionDispatcher,
        protected typeHintProvider: ITypeHintProvider,
        protected tool: EdgeCreationTool
    ) {
        super();
        this.proxyEdge = new GEdge();
        this.proxyEdge.type = triggerAction.elementTypeId;
        if (triggerAction.args?.source) {
            this.source = triggerAction.args?.source as string;
            this.tool.registerFeedback([
                DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source })
            ]);
        }
    }

    protected reinitialize(): void {
        this.source = undefined;
        this.target = undefined;
        this.currentTarget = undefined;
        this.allowedTarget = false;
        this.tool.registerFeedback([RemoveFeedbackEdgeAction.create()]);
    }

    override nonDraggingMouseUp(_element: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            if (!this.isSourceSelected()) {
                if (this.currentTarget && this.allowedTarget) {
                    this.source = this.currentTarget.id;
                    this.tool.registerFeedback([
                        DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source })
                    ]);
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
                    this.reinitialize();
                }
            }
        } else if (event.button === 2) {
            this.reinitialize();
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
}
