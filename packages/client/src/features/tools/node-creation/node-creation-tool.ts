/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
    CreateNodeOperation,
    GModelElement,
    GNode,
    GhostElement,
    Point,
    TYPES,
    TriggerNodeCreationAction,
    findParentByFeature,
    isCtrlOrCmd,
    isMoveable
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import '../../../../css/ghost-element.css';
import { FeedbackEmitter } from '../../../base';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CSS_GHOST_ELEMENT, CSS_HIDDEN, CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { MoveableElement, isValidMove } from '../../../utils';
import { getAbsolutePosition } from '../../../utils/viewpoint-util';
import { RemoveTemplateElementsAction } from '../../element-template';
import { AddTemplateElementsAction, getTemplateElementId } from '../../element-template/add-template-element';
import { MouseTrackingElementPositionListener, PositioningTool } from '../../element-template/mouse-tracking-element-position-listener';
import { Containable, isContainable } from '../../hints/model';
import { BaseCreationTool } from '../base-tools';
import { ChangeBoundsManager } from '../change-bounds';

@injectable()
export class NodeCreationTool extends BaseCreationTool<TriggerNodeCreationAction> implements PositioningTool {
    static ID = 'tool_create_node';

    protected isTriggerAction = TriggerNodeCreationAction.is;

    @inject(TYPES.IChangeBoundsManager) readonly changeBoundsManager: ChangeBoundsManager;

    get id(): string {
        return NodeCreationTool.ID;
    }

    doEnable(): void {
        let trackingListener: MouseTrackingElementPositionListener | undefined;
        const ghostElement = this.triggerAction.ghostElement;
        const ghostElementId = ghostElement ? getTemplateElementId(ghostElement.template) : undefined;
        if (ghostElement && ghostElementId) {
            trackingListener = new MouseTrackingElementPositionListener(ghostElementId, this, 'middle');
            this.toDisposeOnDisable.push(trackingListener, this.mouseTool.registerListener(trackingListener));
        }

        const toolListener = new NodeCreationToolMouseListener(this.triggerAction, this, ghostElement);
        this.toDisposeOnDisable.push(
            toolListener,
            this.mouseTool.registerListener(toolListener),
            this.createFeedbackEmitter().add(cursorFeedbackAction(CursorCSS.NODE_CREATION), cursorFeedbackAction()).submit()
        );
    }
}

export class NodeCreationToolMouseListener extends DragAwareMouseListener {
    protected container?: GModelElement & Containable;
    protected cursorFeedback: FeedbackEmitter;
    protected ghostElementFeedback: FeedbackEmitter;
    protected ghostElementId?: string;

    constructor(
        protected triggerAction: TriggerNodeCreationAction,
        protected tool: NodeCreationTool,
        protected ghostElement?: GhostElement
    ) {
        super();
        this.cursorFeedback = tool.createFeedbackEmitter();
        this.ghostElementFeedback = tool.createFeedbackEmitter();
        if (ghostElement) {
            this.ghostElementId = getTemplateElementId(ghostElement.template);
        }
        this.createGhostElement();
    }

    protected creationAllowed(elementTypeId: string): boolean | undefined {
        return this.container && this.container.isContainableElement(elementTypeId);
    }

    get elementTypeId(): string {
        return this.triggerAction.elementTypeId;
    }

    override nonDraggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (this.container === undefined) {
            this.mouseOver(target, event);
        }

        if (this.creationAllowed(this.elementTypeId)) {
            const location = this.getValidInsertPosition(target, event);
            if (location) {
                const containerId = this.container?.id;
                result.push(CreateNodeOperation.create(this.elementTypeId, { location, containerId, args: this.triggerAction.args }));
            }
            if (!isCtrlOrCmd(event)) {
                // we no longer want to show the ghost element AFTER the next update
                this.ghostElementFeedback.discard();
                result.push(EnableDefaultToolsAction.create());
            } else {
                // we continue in stamp mode so we keep the ghost but dispose everything else
                this.disposeAllButGhostElement();
            }
        }
        return result;
    }

    protected createGhostElement(): void {
        if (!this.ghostElement) {
            return;
        }
        const templates = [this.ghostElement.template];
        this.ghostElementFeedback
            .add(
                AddTemplateElementsAction.create({ templates, addClasses: [CSS_HIDDEN, CSS_GHOST_ELEMENT] }),
                RemoveTemplateElementsAction.create({ templates })
            )
            .submit();
    }

    protected getGhostElement(): MoveableElement | undefined {
        if (!this.ghostElementId) {
            return undefined;
        }
        const ghostElement = this.container?.index.getById(this.ghostElementId);
        return ghostElement && isMoveable(ghostElement) ? ghostElement : undefined;
    }

    protected getValidInsertPosition(target: GModelElement, event: MouseEvent): Point | undefined {
        const ghostElement = this.getGhostElement();
        if (ghostElement) {
            return isValidMove(ghostElement, ghostElement.position, this.tool.changeBoundsManager.movementRestrictor)
                ? ghostElement.position
                : undefined;
        }
        const location = getAbsolutePosition(target, event);

        // Create a 0-bounds proxy element for snapping
        const elementProxy = new GNode();
        elementProxy.size = { width: 0, height: 0 };
        return this.tool.changeBoundsManager.snapPosition(elementProxy, location);
    }

    override mouseOver(target: GModelElement, event: MouseEvent): Action[] {
        const currentContainer = findParentByFeature(target, isContainable);
        if (!this.container || currentContainer !== this.container) {
            this.container = currentContainer;
            const feedback = this.creationAllowed(this.elementTypeId)
                ? cursorFeedbackAction(CursorCSS.NODE_CREATION)
                : cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED);
            this.cursorFeedback.add(feedback).submit();
        }
        return [];
    }

    protected disposeAllButGhostElement(): void {
        this.cursorFeedback.dispose();
        super.dispose();
    }

    override dispose(): void {
        this.ghostElementFeedback.dispose();
        this.disposeAllButGhostElement();
    }
}
