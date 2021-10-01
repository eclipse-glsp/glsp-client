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
import { inject, injectable } from 'inversify';
import {
    Action,
    BoundsAware,
    EnableDefaultToolsAction,
    isSelectable,
    isSelected,
    KeyListener,
    Point,
    SEdge,
    SelectAction,
    SModelElement,
    SNode,
    TYPES
} from 'sprotty';
import { DOMHelper } from 'sprotty/lib/base/views/dom-helper';

import { DragAwareMouseListener } from '../../base/drag-aware-mouse-listener';
import { getAbsolutePosition, toAbsoluteBounds } from '../../utils/viewpoint-util';
import { CursorCSS, cursorFeedbackAction } from '../tool-feedback/css-feedback';
import { DrawMarqueeAction, RemoveMarqueeAction } from '../tool-feedback/marquee-tool-feedback';
import { BaseGLSPTool } from '../tools/base-glsp-tool';

@injectable()
export class MarqueeMouseTool extends BaseGLSPTool {
    static ID = 'glsp.marquee-mouse-tool';

    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;

    protected marqueeMouseListener: MarqueeMouseListener;
    protected shiftKeyListener: ShiftKeyListener = new ShiftKeyListener();

    get id(): string {
        return MarqueeMouseTool.ID;
    }

    enable(): void {
        this.marqueeMouseListener = new MarqueeMouseListener(this.domHelper);
        this.mouseTool.register(this.marqueeMouseListener);
        this.keyTool.register(this.shiftKeyListener);
        this.dispatchFeedback([cursorFeedbackAction(CursorCSS.MARQUEE)]);
    }

    disable(): void {
        this.mouseTool.deregister(this.marqueeMouseListener);
        this.keyTool.deregister(this.shiftKeyListener);
        this.deregisterFeedback([cursorFeedbackAction()]);
    }
}

@injectable()
export class MarqueeMouseListener extends DragAwareMouseListener {
    protected startPoint: Point;

    protected currentPoint: Point;

    protected domHelper: DOMHelper;

    protected previouslySelected: string[];

    protected isActive = false;

    constructor(domHelper: DOMHelper) {
        super();
        this.domHelper = domHelper;
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        this.isActive = true;
        this.startPoint = { x: getAbsolutePosition(target, event).x, y: getAbsolutePosition(target, event).y };
        if (event.ctrlKey) {
            this.previouslySelected = Array.from(
                target.root.index
                    .all()
                    .map(e => e as SModelElement & BoundsAware)
                    .filter(e => isSelected(e))
                    .map(e => e.id)
            );
        }
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        this.currentPoint = { x: getAbsolutePosition(target, event).x, y: getAbsolutePosition(target, event).y };
        if (this.isActive) {
            const nodeIdsSelected = Array.from(
                target.root.index
                    .all()
                    .map(e => e as SModelElement & BoundsAware)
                    .filter(e => isSelectable(e))
                    .filter(e => e instanceof SNode)
                    .filter(e => this.isNodeMarked(e))
                    .map(e => e.id)
            );
            const edgeIdsSelected = this.getMarkedEdges(target.root);
            const selected = nodeIdsSelected.concat(edgeIdsSelected);
            return [
                new SelectAction([], Array.from(target.root.index.all().map(e => e.id))),
                new SelectAction(selected.concat(this.previouslySelected), []),
                new DrawMarqueeAction(this.startPoint, { x: getAbsolutePosition(target, event).x, y: getAbsolutePosition(target, event).y })
            ];
        }
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        this.isActive = false;
        if (event.shiftKey) {
            return [new RemoveMarqueeAction()];
        }
        return [new RemoveMarqueeAction(), new EnableDefaultToolsAction()];
    }

    getMarkedEdges(root: SModelElement): string[] {
        const elements = Array.from(document.querySelectorAll('g'));
        const edges = Array.from(
            root.index
                .all()
                .filter(e => e instanceof SEdge)
                .filter(e => isSelectable(e))
                .map(e => e.id)
        );
        return elements
            .filter(e => edges.includes(this.domHelper.findSModelIdByDOMElement(e)))
            .filter(e => this.isEdgeMarked(e))
            .map(e => this.domHelper.findSModelIdByDOMElement(e));
    }

    isEdgeMarked(element: SVGElement): boolean {
        if (!element.getAttribute('transform')) {
            if (element.children[0]) {
                const path = element.children[0].getAttribute('d');
                if (path) {
                    const points = path.split(/M|L/);
                    for (let i = 0; i < points.length - 1; i++) {
                        const coord1 = points[i].split(',');
                        const coord2 = points[i + 1].split(',');
                        const point1 = { x: parseInt(coord1[0], 10), y: parseInt(coord1[1], 10) };
                        const point2 = { x: parseInt(coord2[0], 10), y: parseInt(coord2[1], 10) };
                        if (this.isLineMarked(point1, point2)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    isLineMarked(point1: Point, point2: Point): boolean {
        if (this.pointInRect(point1) || this.pointInRect(point2)) {
            return true;
        }
        if (this.linesIntersect(point1, point2, this.startPoint, { x: this.startPoint.x, y: this.currentPoint.y })) {
            return true;
        }
        if (this.linesIntersect(point1, point2, this.startPoint, { x: this.currentPoint.x, y: this.startPoint.y })) {
            return true;
        }
        if (this.linesIntersect(point1, point2, { x: this.currentPoint.x, y: this.startPoint.y }, this.currentPoint)) {
            return true;
        }
        if (this.linesIntersect(point1, point2, { x: this.startPoint.x, y: this.currentPoint.y }, this.currentPoint)) {
            return true;
        }
        return false;
    }

    linesIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
        const tCount = (p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x);
        const tDenom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        const t = tCount / tDenom;
        const uCount = (p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x);
        const uDenom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        const u = uCount / uDenom;
        if (t >= 0.0 && t <= 1.0 && u >= 0.0 && u <= 1.0) {
            return true;
        }
        return false;
    }

    pointInRect(point: Point): boolean {
        const boolX =
            this.startPoint.x <= this.currentPoint.x
                ? this.isBetween(point.x, this.startPoint.x, this.currentPoint.x)
                : this.isBetween(point.x, this.currentPoint.x, this.startPoint.x);
        const boolY =
            this.startPoint.y <= this.currentPoint.y
                ? this.isBetween(point.y, this.startPoint.y, this.currentPoint.y)
                : this.isBetween(point.y, this.currentPoint.y, this.startPoint.y);
        return boolX && boolY;
    }

    isNodeMarked(element: SModelElement & BoundsAware): boolean {
        const horizontallyIn =
            this.startPoint.x < this.currentPoint.x
                ? this.isElementBetweenXAxis(element, this.startPoint.x, this.currentPoint.x)
                : this.isElementBetweenXAxis(element, this.currentPoint.x, this.startPoint.x);
        const verticallyIn =
            this.startPoint.y < this.currentPoint.y
                ? this.isElementBetweenYAxis(element, this.startPoint.y, this.currentPoint.y)
                : this.isElementBetweenYAxis(element, this.currentPoint.y, this.startPoint.y);
        if (horizontallyIn && verticallyIn) {
            return true;
        }
        return false;
    }

    isElementBetweenXAxis(element: SModelElement & BoundsAware, marqueeLeft: number, marqueeRight: number): boolean {
        if (
            this.isBetween(marqueeLeft, toAbsoluteBounds(element).x, toAbsoluteBounds(element).x + toAbsoluteBounds(element).width) ||
            this.isBetween(marqueeRight, toAbsoluteBounds(element).x, toAbsoluteBounds(element).x + toAbsoluteBounds(element).width)
        ) {
            return true;
        }
        const leftEdge = this.isBetween(toAbsoluteBounds(element).x, marqueeLeft, marqueeRight);
        const rightEdge = this.isBetween(toAbsoluteBounds(element).x + toAbsoluteBounds(element).width, marqueeLeft, marqueeRight);
        return leftEdge || rightEdge;
    }

    isElementBetweenYAxis(element: SModelElement & BoundsAware, marqueeTop: number, marqueeBottom: number): boolean {
        if (
            this.isBetween(marqueeTop, toAbsoluteBounds(element).y, toAbsoluteBounds(element).y + toAbsoluteBounds(element).height) ||
            this.isBetween(marqueeBottom, toAbsoluteBounds(element).y, toAbsoluteBounds(element).y + toAbsoluteBounds(element).height)
        ) {
            return true;
        }
        const topEdge = this.isBetween(toAbsoluteBounds(element).y, marqueeTop, marqueeBottom);
        const bottomEdge = this.isBetween(toAbsoluteBounds(element).y + toAbsoluteBounds(element).height, marqueeTop, marqueeBottom);
        return topEdge || bottomEdge;
    }

    isBetween(x: number, lower: number, upper: number): boolean {
        if (lower <= x && x <= upper) {
            return true;
        }
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
