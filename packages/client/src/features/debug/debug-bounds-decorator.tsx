/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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
/* eslint-disable max-len */
/** @jsx svg */
import { Bounds, GModelElement, IVNodePostprocessor, Point, TYPES, isDecoration, isSizeable, setClass, svg } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { GGraph } from '../../model';
import { BoundsAwareModelElement } from '../../utils/gmodel-util';
import { IDebugManager } from './debug-manager';

export const CSS_DEBUG_BOUNDS = 'debug-bounds';

@injectable()
export class DebugBoundsDecorator implements IVNodePostprocessor {
    @inject(TYPES.IDebugManager) @optional() protected debugManager?: IDebugManager;

    decorate(vnode: VNode, element: GModelElement): VNode {
        if (!this.debugManager?.isDebugEnabled) {
            return vnode;
        }
        if (isSizeable(element) && this.shouldDecorateSizeable(element)) {
            this.decorateSizeable(vnode, element);
        }
        if (element instanceof GGraph && this.shouldDecorateGraph(element)) {
            this.decorateGraph(vnode, element);
        }
        return vnode;
    }

    postUpdate(): void {}

    protected get decorationSize(): number {
        return 5;
    }

    protected shouldDecorateGraph(graph: GGraph): boolean {
        return true;
    }

    protected decorateGraph(vnode: VNode, graph: GGraph): void {
        setClass(vnode, CSS_DEBUG_BOUNDS, true);
        const svgChild = vnode.children?.find(child => typeof child !== 'string' && child.sel === 'svg') as VNode | undefined;
        const group = svgChild?.children?.find(child => typeof child !== 'string' && child.sel === 'g') as VNode | undefined;
        group?.children?.push(this.renderOrigin(graph));
    }

    protected renderOrigin(graph: GGraph): VNode {
        return (
            <polyline
                class-debug-bounds-decoration={true}
                class-debug-bounds-origin={true}
                points={`0,${this.decorationSize} 0,0  ${this.decorationSize},0`}
            >
                <title>Origin = x: 0, y: 0</title>
            </polyline>
        );
    }

    protected shouldDecorateSizeable(element: BoundsAwareModelElement): boolean {
        return !isDecoration(element);
    }

    protected decorateSizeable(vnode: VNode, element: BoundsAwareModelElement): void {
        setClass(vnode, CSS_DEBUG_BOUNDS, true);
        vnode.children?.push(this.renderTopLeftCorner(element));
        vnode.children?.push(this.renderTopRightCorner(element));
        vnode.children?.push(this.renderBottomLeftCorner(element));
        vnode.children?.push(this.renderBottomRightCorner(element));
        vnode.children?.push(this.renderCenter(element));
    }

    protected renderTopLeftCorner(element: BoundsAwareModelElement): VNode {
        const position = Bounds.position(element.bounds);
        const topLeft = Bounds.topLeft(element.bounds);
        const corner = Point.subtract(topLeft, position);
        return (
            <polyline
                class-debug-bounds-decoration={true}
                class-debug-bounds-top-left={true}
                points={`${corner.x},${corner.y + this.decorationSize} ${corner.x},${corner.y} ${corner.x + this.decorationSize},${corner.y}`}
            >
                <title>
                    Top Left = x: {topLeft.x}, y: {topLeft.y}
                </title>
            </polyline>
        );
    }

    protected renderTopRightCorner(element: BoundsAwareModelElement): VNode {
        const position = Bounds.position(element.bounds);
        const topRight = Bounds.topRight(element.bounds);
        const corner = Point.subtract(topRight, position);
        return (
            <polyline
                class-debug-bounds-decoration={true}
                class-debug-bounds-top-right={true}
                points={`${corner.x - this.decorationSize},${corner.y} ${corner.x},${corner.y} ${corner.x},${corner.y + this.decorationSize}`}
            >
                <title>
                    Top Right = x: {topRight.x}, y: {topRight.y}
                </title>
            </polyline>
        );
    }

    protected renderBottomLeftCorner(element: BoundsAwareModelElement): VNode {
        const position = Bounds.position(element.bounds);
        const bottomLeft = Bounds.bottomLeft(element.bounds);
        const corner = Point.subtract(bottomLeft, position);
        return (
            <polyline
                class-debug-bounds-decoration={true}
                class-debug-bounds-bottom-left={true}
                points={`${corner.x},${corner.y - this.decorationSize} ${corner.x},${corner.y} ${corner.x + this.decorationSize},${corner.y}`}
            >
                <title>
                    Bottom Left = x: {bottomLeft.x}, y: {bottomLeft.y}
                </title>
            </polyline>
        );
    }

    protected renderBottomRightCorner(element: BoundsAwareModelElement): VNode {
        const position = Bounds.position(element.bounds);
        const bottomRight = Bounds.bottomRight(element.bounds);
        const corner = Point.subtract(bottomRight, position);
        return (
            <polyline
                class-debug-bounds-decoration={true}
                class-debug-bounds-bottom-right={true}
                points={`${corner.x - this.decorationSize},${corner.y} ${corner.x},${corner.y} ${corner.x},${corner.y - this.decorationSize}`}
            >
                <title>
                    Bottom Right = x: {bottomRight.x}, y: {bottomRight.y}
                </title>
            </polyline>
        );
    }

    protected renderCenter(element: BoundsAwareModelElement): VNode {
        const bounds = element.bounds;
        const position = Bounds.position(bounds);
        const center = Bounds.center(bounds);
        const corner = Point.subtract(center, position);
        return (
            <g>
                <title>
                    Center = x: {center.x}, y: {center.y}
                    &#013;Bounds = x: {bounds.x}, y: {bounds.y}, width: {bounds.width}, height: {bounds.height}
                </title>
                <polyline
                    class-debug-bounds-decoration={true}
                    class-debug-bounds-center={true}
                    points={`${corner.x - this.decorationSize / 2},${corner.y - this.decorationSize / 2} ${corner.x + this.decorationSize / 2},${corner.y + this.decorationSize / 2}`}
                ></polyline>
                <polyline
                    class-debug-bounds-decoration={true}
                    class-debug-bounds-center={true}
                    points={`${corner.x + this.decorationSize / 2},${corner.y - this.decorationSize / 2} ${corner.x - this.decorationSize / 2},${corner.y + this.decorationSize / 2}`}
                ></polyline>
            </g>
        );
    }
}
