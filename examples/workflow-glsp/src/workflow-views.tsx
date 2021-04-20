/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
    angleOfPoint,
    GEdgeView,
    Hoverable,
    IView,
    Point,
    RectangularNodeView,
    RenderingContext,
    RoundedCornerNodeView,
    SEdge,
    Selectable,
    SShapeElement,
    toDegrees
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import * as snabbdom from 'snabbdom-jsx';
import { Classes } from 'snabbdom/modules/class';
import { VNode } from 'snabbdom/vnode';

import { ActivityNode, Icon, TaskNode, WeightedEdge } from './model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: snabbdom.svg };

@injectable()
export class TaskNodeView extends RoundedCornerNodeView {
    protected renderWithoutRadius(node: Readonly<SShapeElement & Hoverable & Selectable>, context: RenderingContext): VNode {
        const task = node as TaskNode;
        const rcr = this.getRoundedCornerRadius(task);
        const graph = <g>
            <rect class-sprotty-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}
                {...this.additionalClasses(task, context)}
                x={0} y={0} rx={rcr} ry={rcr}
                width={Math.max(0, node.bounds.width)} height={Math.max(0, node.bounds.height)} />
            {context.renderChildren(node)}
        </g>;
        return graph;
    }

    protected getRoundedCornerRadius(_node: TaskNode): number {
        return 5;
    }

    protected additionalClasses(element: Readonly<SShapeElement & Hoverable & Selectable>, _context: RenderingContext): Classes {
        const node = element as TaskNode;
        return {
            'class-task': true,
            'class-automated': node.taskType === 'automated',
            'class-manual': node.taskType === 'manual'
        };
    }
}

@injectable()
export class ForkOrJoinNodeView extends RectangularNodeView {
    render(node: ActivityNode, context: RenderingContext): VNode {
        const graph = <g>
            <rect class-sprotty-node={true} class-forkOrJoin={true}
                class-mouseover={node.hoverFeedback} class-selected={node.selected}
                width={10} height={Math.max(50, node.bounds.height)}></rect>
        </g>;
        return graph;
    }
}

@injectable()
export class WorkflowEdgeView extends GEdgeView {
    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        const arrow = <path class-sprotty-edge={true} class-arrow={true} d='M 1.5,0 L 10,-4 L 10,4 Z'
            transform={`rotate(${toDegrees(angleOfPoint({ x: p1.x - p2.x, y: p1.y - p2.y }))} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`} />;
        additionals.push(arrow);
        return additionals;
    }
}

@injectable()
export class WeightedEdgeView extends WorkflowEdgeView {
    protected addtionalClasses(edge: Readonly<SEdge>, _context: RenderingContext): Classes {
        const wedge = edge as WeightedEdge;
        return {
            'class-no-probability': !wedge.probability,
            'class-low': wedge.probability === 'low',
            'class-medium': wedge.probability === 'medium',
            'class-high': wedge.probability === 'high'
        };
    }
}

@injectable()
export class IconView implements IView {
    render(element: Icon, context: RenderingContext): VNode {
        const radius = this.getRadius();
        return <g>
            <circle class-sprotty-icon={true} r={radius} cx={radius} cy={radius}></circle>
            {context.renderChildren(element)}
        </g>;
    }

    getRadius(): number {
        return 16;
    }
}
