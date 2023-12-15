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
    Point,
    TYPES,
    TriggerNodeCreationAction,
    findParentByFeature,
    isCtrlOrCmd
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import '../../../../css/ghost-element.css';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CSS_GHOST_ELEMENT, CSS_HIDDEN, CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { getAbsolutePosition } from '../../../utils/viewpoint-util';
import { IMovementRestrictor } from '../../change-bounds/movement-restrictor';
import { PositionSnapper } from '../../change-bounds/position-snapper';
import { AddTemplateElementsAction, getTemplateElementId } from '../../element-template/add-template-element';
import { MouseTrackingElementPositionListener, PositioningTool } from '../../element-template/mouse-tracking-element-position-listener';
import { Containable, isContainable } from '../../hints/model';
import { BaseCreationTool } from '../base-tools';

@injectable()
export class NodeCreationTool extends BaseCreationTool<TriggerNodeCreationAction> implements PositioningTool {
    static ID = 'tool_create_node';

    protected isTriggerAction = TriggerNodeCreationAction.is;

    @inject(TYPES.IMovementRestrictor) @optional() readonly movementRestrictor?: IMovementRestrictor;
    @inject(PositionSnapper) readonly positionSnapper: PositionSnapper;

    get id(): string {
        return NodeCreationTool.ID;
    }

    doEnable(): void {
        let trackingListener: MouseTrackingElementPositionListener | undefined;
        const ghostElement = this.triggerAction.ghostElement;
        if (ghostElement) {
            trackingListener = new MouseTrackingElementPositionListener(getTemplateElementId(ghostElement.template), this, 'middle');
            this.toDisposeOnDisable.push(
                this.registerFeedback(
                    [AddTemplateElementsAction.create({ templates: [ghostElement.template], addClasses: [CSS_HIDDEN, CSS_GHOST_ELEMENT] })],
                    ghostElement
                ),
                this.mouseTool.registerListener(trackingListener)
            );
        }

        this.toDisposeOnDisable.push(
            this.mouseTool.registerListener(new NodeCreationToolMouseListener(this.triggerAction, this, trackingListener)),
            this.registerFeedback([cursorFeedbackAction(CursorCSS.NODE_CREATION)], this, [cursorFeedbackAction()])
        );
    }
}

@injectable()
export class NodeCreationToolMouseListener extends DragAwareMouseListener {
    protected container?: GModelElement & Containable;

    constructor(
        protected triggerAction: TriggerNodeCreationAction,
        protected tool: NodeCreationTool,
        protected trackingListener?: MouseTrackingElementPositionListener
    ) {
        super();
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
            const containerId = this.container ? this.container.id : undefined;
            const location = this.getInsertPosition(target, event);
            result.push(CreateNodeOperation.create(this.elementTypeId, { location, containerId, args: this.triggerAction.args }));
            if (!isCtrlOrCmd(event)) {
                result.push(EnableDefaultToolsAction.create());
            } else {
                this.tool.deregisterFeedback(this);
            }
        }
        return result;
    }

    protected getInsertPosition(target: GModelElement, event: MouseEvent): Point {
        if (this.trackingListener) {
            const trackedPosition = this.trackingListener.currentPosition;
            if (trackedPosition) {
                return trackedPosition;
            }
        }
        const location = getAbsolutePosition(target, event);

        // Create a 0-bounds proxy element for snapping
        const elementProxy = new GNode();
        elementProxy.size = { width: 0, height: 0 };
        return this.tool.positionSnapper.snapPosition(location, elementProxy);
    }

    override mouseOver(target: GModelElement, event: MouseEvent): Action[] {
        const currentContainer = findParentByFeature(target, isContainable);
        if (!this.container || currentContainer !== this.container) {
            this.container = currentContainer;
            const feedback = this.creationAllowed(this.elementTypeId)
                ? cursorFeedbackAction(CursorCSS.NODE_CREATION)
                : cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED);
            this.tool.registerFeedback([feedback]);
        }
        return [];
    }
}
