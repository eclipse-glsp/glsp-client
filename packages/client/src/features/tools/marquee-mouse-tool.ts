/********************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
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
import { Action, BoundsAware, EnableDefaultToolsAction, KeyListener, KeyTool, Point, SelectAction, SModelElement, SNode } from "sprotty";
import { DragAwareMouseListener } from "../../base/drag-aware-mouse-listener";
import { GLSP_TYPES } from "../../base/types";
import { IMouseTool } from "../mouse-tool/mouse-tool";
import { SelectionService } from "../select/selection-service";
import { CursorCSS, cursorFeedbackAction } from "../tool-feedback/css-feedback";
import { IFeedbackActionDispatcher } from "../tool-feedback/feedback-action-dispatcher";
import { DrawMarqueeAction, RemoveMarqueeAction } from "../tool-feedback/selection-tool-feedback";
import { BaseGLSPTool } from "./base-glsp-tool";
import { getAbsolutePosition, toAbsoluteBounds } from "../../utils/viewpoint-util";

@injectable()
export class MarqueeMouseTool extends BaseGLSPTool {
    static ID = "glsp.marquee-mouse-tool";

    @inject(GLSP_TYPES.MouseTool) protected mouseTool: IMouseTool;
    @inject(KeyTool) protected readonly keytool: KeyTool;
    @inject(GLSP_TYPES.IFeedbackActionDispatcher) protected readonly feedbackDispatcher: IFeedbackActionDispatcher;

    protected marqueeMouseListener: MarqueeMouseListener = new MarqueeMouseListener();
    protected shiftKeyListener: ShiftKeyListener = new ShiftKeyListener();

    get id(): string {
        return MarqueeMouseTool.ID;
    }

    enable(): void {
        this.mouseTool.register(this.marqueeMouseListener);
        this.keyTool.register(this.shiftKeyListener);
        this.feedbackDispatcher.registerFeedback(this, [cursorFeedbackAction(CursorCSS.MARQUEE)]);
    }

    disable(): void {
        this.mouseTool.deregister(this.marqueeMouseListener);
        this.keyTool.deregister(this.shiftKeyListener);
        this.feedbackDispatcher.registerFeedback(this, [cursorFeedbackAction()]);
    }
}

@injectable()
export class MarqueeMouseListener extends DragAwareMouseListener {

    @inject(GLSP_TYPES.SelectionService) protected selectionService: SelectionService;

    protected startPoint: Point;

    protected isActive: boolean = false;

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        if (event.shiftKey) {
            this.isActive = true;
            this.startPoint = { x: getAbsolutePosition(target, event).x, y: getAbsolutePosition(target, event).y };
            return [];
        }
        return [new RemoveMarqueeAction(), new EnableDefaultToolsAction()];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (this.isActive) {
            const ids_in = Array.from(target.root.index.all()
                .map(e => e as SModelElement & BoundsAware)
                .filter(e => e instanceof SNode)
                .filter(e => this.isMarked(e, this.startPoint, {
                    x: getAbsolutePosition(target, event).x,
                    y: getAbsolutePosition(target, event).y
                })).map(e => e.id));
            const ids_out = Array.from(target.root.index.all()
                .map(e => e as SModelElement & BoundsAware)
                .filter(e => e instanceof SNode)
                .filter(e => !this.isMarked(e, this.startPoint, {
                    x: getAbsolutePosition(target, event).x,
                    y: getAbsolutePosition(target, event).y
                }))
                .map(e => e.id));
            return [new SelectAction(ids_in, ids_out), new DrawMarqueeAction(this.startPoint,
                { x: getAbsolutePosition(target, event).x, y: getAbsolutePosition(target, event).y })];
        }
        if (event.shiftKey) {
            return [];
        }
        return [new RemoveMarqueeAction(), new EnableDefaultToolsAction()];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        this.isActive = false;
        if (event.shiftKey) {
            return [new RemoveMarqueeAction()];
        }
        return [new RemoveMarqueeAction(), new EnableDefaultToolsAction()];
    }

    isMarked(element: SModelElement & BoundsAware, start: Point, current: Point): boolean {
        const horizontallyIn = start.x < current.x ?
            this.isElementBetweenXAxis(element, start.x, current.x) :
            this.isElementBetweenXAxis(element, current.x, start.x);
        const verticallyIn = start.y < current.y ?
            this.isElementBetweenYAxis(element, start.y, current.y) :
            this.isElementBetweenYAxis(element, current.y, start.y);
        if (horizontallyIn && verticallyIn) return true;
        return false;
    }

    isElementBetweenXAxis(element: SModelElement & BoundsAware, marqueeLeft: number, marqueeRight: number): boolean {
        const leftEdge = this.isBetween(toAbsoluteBounds(element).x, marqueeLeft, marqueeRight);
        const rightEdge = this.isBetween(toAbsoluteBounds(element).x + toAbsoluteBounds(element).width, marqueeLeft, marqueeRight);
        return leftEdge || rightEdge;
    }

    isElementBetweenYAxis(element: SModelElement & BoundsAware, marqueeTop: number, marqueeBottom: number): boolean {
        const topEdge = this.isBetween(toAbsoluteBounds(element).y, marqueeTop, marqueeBottom);
        const bottomEdge = this.isBetween(toAbsoluteBounds(element).y + toAbsoluteBounds(element).height, marqueeTop, marqueeBottom);
        return topEdge || bottomEdge;
    }

    isBetween(x: number, lower: number, upper: number): boolean {
        if (lower <= x && x <= upper) return true;
        return false;
    }

}

@injectable()
export class ShiftKeyListener extends KeyListener {

    keyUp(element: SModelElement, event: KeyboardEvent): Action[] {
        if (event.shiftKey) {
            return [];
        }
        return [new RemoveMarqueeAction(), new EnableDefaultToolsAction()];
    }
}
