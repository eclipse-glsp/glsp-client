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
import { inject, injectable, optional } from 'inversify';
import {
    Action,
    CreateNodeOperation,
    EnableDefaultToolsAction,
    ISnapper,
    SModelElement,
    SNode,
    TYPES,
    TriggerNodeCreationAction,
    findParentByFeature,
    isCtrlOrCmd
} from '~glsp-sprotty';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { getAbsolutePosition } from '../../../utils/viewpoint-util';
import { Containable, isContainable } from '../../hints/model';
import { BaseGLSPCreationTool } from '../base-glsp-creation-tool';

@injectable()
export class NodeCreationTool extends BaseGLSPCreationTool<TriggerNodeCreationAction> {
    static ID = 'tool_create_node';

    protected isTriggerAction = TriggerNodeCreationAction.is;

    @inject(TYPES.ISnapper) @optional() readonly snapper?: ISnapper;

    get id(): string {
        return NodeCreationTool.ID;
    }

    doEnable(): void {
        this.toDisposeOnDisable.push(
            this.mouseTool.registerListener(new NodeCreationToolMouseListener(this.triggerAction, this)),
            this.registerFeedback([cursorFeedbackAction(CursorCSS.NODE_CREATION)], this, [cursorFeedbackAction()])
        );
    }
}

@injectable()
export class NodeCreationToolMouseListener extends DragAwareMouseListener {
    protected container?: SModelElement & Containable;

    constructor(protected triggerAction: TriggerNodeCreationAction, protected tool: NodeCreationTool) {
        super();
    }

    protected creationAllowed(elementTypeId: string): boolean | undefined {
        return this.container && this.container.isContainableElement(elementTypeId);
    }

    get elementTypeId(): string {
        return this.triggerAction.elementTypeId;
    }

    override nonDraggingMouseUp(target: SModelElement, event: MouseEvent): Action[] {
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
            result.push(CreateNodeOperation.create(this.elementTypeId, { location, containerId, args: this.triggerAction.args }));
            if (!isCtrlOrCmd(event)) {
                result.push(EnableDefaultToolsAction.create());
            }
        }
        return result;
    }

    override mouseOver(target: SModelElement, event: MouseEvent): Action[] {
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
