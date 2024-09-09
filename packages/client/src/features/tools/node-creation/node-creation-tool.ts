/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
    Args,
    Bounds,
    CreateNodeOperation,
    Dimension,
    Disposable,
    DisposableCollection,
    GModelElement,
    GhostElement,
    IModelFactory,
    Point,
    TYPES,
    TriggerNodeCreationAction,
    isBoundsAware,
    isCtrlOrCmd,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import '../../../../css/ghost-element.css';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { EditorContextService } from '../../../base/editor-context-service';
import { CSS_GHOST_ELEMENT, CSS_HIDDEN, CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { MoveableElement } from '../../../utils/gmodel-util';
import { AddTemplateElementsAction, getTemplateElementId } from '../../element-template/add-template-element';
import { MouseTrackingElementPositionListener, PositioningTool } from '../../element-template/mouse-tracking-element-position-listener';
import { RemoveTemplateElementsAction } from '../../element-template/remove-template-element';
import { BaseCreationTool } from '../base-tools';
import { IChangeBoundsManager } from '../change-bounds/change-bounds-manager';
import { TrackedMove } from '../change-bounds/change-bounds-tracker';
import { IContainerManager, TrackedInsert } from './container-manager';
import { InsertIndicator } from './insert-indicator';

@injectable()
export class NodeCreationTool extends BaseCreationTool<TriggerNodeCreationAction> implements PositioningTool {
    static ID = 'tool_create_node';

    protected isTriggerAction = TriggerNodeCreationAction.is;

    @inject(TYPES.IChangeBoundsManager) readonly changeBoundsManager: IChangeBoundsManager;
    @inject(TYPES.IContainerManager) readonly containerManager: IContainerManager;
    @inject(TYPES.IModelFactory) modelFactory: IModelFactory;

    get id(): string {
        return NodeCreationTool.ID;
    }

    doEnable(): void {
        const ghostElement = this.triggerAction.ghostElement ?? { template: this.modelFactory.createSchema(this.createInsertIndicator()) };
        this.toDisposeOnDisable.push(this.createGhostElementTracker(ghostElement, 'middle'));
        this.toDisposeOnDisable.push(this.createNodeCreationListener(ghostElement));
        this.toDisposeOnDisable.push(this.createNodeCreationCursorFeedback().submit());
    }

    protected createInsertIndicator(): GModelElement {
        return new InsertIndicator();
    }

    protected createGhostElementTracker(ghostElement: GhostElement, position: 'top-left' | 'middle'): Disposable {
        const trackingListener = new NodeInsertTrackingListener(
            getTemplateElementId(ghostElement.template),
            this.triggerAction.elementTypeId,
            this,
            position,
            this.editorContext
        );
        return new DisposableCollection(trackingListener, this.mouseTool.registerListener(trackingListener));
    }

    protected createNodeCreationListener(ghostElement: GhostElement): Disposable {
        const toolListener = new NodeCreationToolMouseListener(this.triggerAction, this, ghostElement);
        return new DisposableCollection(toolListener, this.mouseTool.registerListener(toolListener));
    }

    protected createNodeCreationCursorFeedback(): FeedbackEmitter {
        return this.createFeedbackEmitter().add(cursorFeedbackAction(CursorCSS.NODE_CREATION), cursorFeedbackAction());
    }
}

export interface ContainerPositioningTool extends PositioningTool {
    readonly containerManager: IContainerManager;
}

export class NodeInsertTrackingListener extends MouseTrackingElementPositionListener {
    constructor(
        elementId: string,
        protected elementTypeId: string,
        protected override tool: ContainerPositioningTool,
        cursorPosition: 'top-left' | 'middle' = 'top-left',
        editorContext?: EditorContextService
    ) {
        super(elementId, tool, cursorPosition, editorContext);
    }

    protected override addMoveFeedback(move: TrackedMove, ctx: GModelElement, event: MouseEvent): void {
        super.addMoveFeedback(move, ctx, event);
        const element = move.elementMoves[0].element;
        const location = move.elementMoves[0].toPosition;
        const insert = this.tool.containerManager.insert(element, location, this.elementTypeId, { evt: event });
        this.tool.containerManager.addInsertFeedback(this.moveGhostFeedback, insert, ctx, event);
    }
}

export class NodeCreationToolMouseListener extends DragAwareMouseListener {
    protected cursorFeedback: FeedbackEmitter;
    protected ghostElementFeedback: FeedbackEmitter;
    protected ghostElementId: string;

    constructor(
        protected triggerAction: TriggerNodeCreationAction,
        protected tool: NodeCreationTool,
        protected ghostElement: GhostElement
    ) {
        super();
        this.cursorFeedback = tool.createFeedbackEmitter();
        this.ghostElementFeedback = tool.createFeedbackEmitter();
        this.ghostElementId = getTemplateElementId(ghostElement.template);
        this.createGhostElement(ghostElement);
    }

    get elementTypeId(): string {
        return this.triggerAction.elementTypeId;
    }

    override nonDraggingMouseUp(ctx: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];

        const insert = this.getTrackedInsert(ctx, event);
        if (insert.valid) {
            result.push(this.getCreateOperation(ctx, event, insert));
        }
        if (this.isContinuousMode(ctx, event)) {
            // we continue in stamp mode so we keep the ghost but dispose everything else
            this.disposeAllButGhostElement();
            return result;
        }

        if (insert.valid) {
            // we keep the ghost element until the next update to avoid flickering during insert
            this.ghostElementFeedback.discard();
        } else {
            this.dispose();
        }
        result.push(EnableDefaultToolsAction.create());
        return result;
    }

    /**
     * Determines wether the tool should run in continuous mode (also called stamp mode) or not.
     * If continuous mode is enabled, the tool will stay after a successful creation.
     * The user can then create more elements of the same type without having to re-trigger the tool.
     * By default, continuous mode is enabled if the user holds the CTRL key.
     * @param ctx the current model context
     * @param event
     */
    protected isContinuousMode(ctx: GModelElement, event: MouseEvent): boolean {
        return isCtrlOrCmd(event);
    }

    protected getCreateOperation(ctx: GModelElement, event: MouseEvent, insert: TrackedInsert): Action {
        return CreateNodeOperation.create(this.elementTypeId, {
            location: insert.location,
            containerId: insert.container?.id,
            args: this.getCreateNodeOperationArgs(insert, ctx, event)
        });
    }

    protected getCreateNodeOperationArgs(insert: TrackedInsert, ctx: GModelElement, event: MouseEvent): Args | undefined {
        let args = { ...this.triggerAction.args };
        const ghostElement = this.getGhostElement(ctx, event);
        if (ghostElement) {
            const ghostDimensions = isBoundsAware(ghostElement) ? Bounds.dimension(ghostElement.bounds) : Dimension.ZERO;
            args = {
                ...args,
                'ghost-x': ghostElement.position.x,
                'ghost-y': ghostElement.position.y,
                'ghost-width': ghostDimensions.width,
                'ghost-height': ghostDimensions.height
            };
        }
        return args;
    }

    protected createGhostElement(ghostElement: GhostElement): string {
        const templates = [ghostElement.template];
        this.ghostElementFeedback.add(
            AddTemplateElementsAction.create({ templates, addClasses: [CSS_HIDDEN, CSS_GHOST_ELEMENT] }),
            RemoveTemplateElementsAction.create({ templates })
        );
        this.ghostElementFeedback.submit();
        return getTemplateElementId(ghostElement.template);
    }

    protected getGhostElement(ctx: GModelElement, event: MouseEvent): MoveableElement | undefined {
        const ghostElement = ctx.index.getById(this.ghostElementId);
        return ghostElement && isMoveable(ghostElement) ? ghostElement : undefined;
    }

    protected getTrackedInsert(ctx: GModelElement, event: MouseEvent): TrackedInsert {
        const ghostElement = this.getGhostElement(ctx, event);
        if (!ghostElement) {
            return { elementTypeId: this.elementTypeId, location: Point.ORIGIN, valid: false, options: { evt: event } };
        }
        return this.tool.containerManager.insert(ghostElement, ghostElement.position, this.elementTypeId, { evt: event });
    }

    protected disposeAllButGhostElement(): void {
        super.dispose();
    }

    override dispose(): void {
        this.ghostElementFeedback.dispose();
        this.disposeAllButGhostElement();
    }
}
