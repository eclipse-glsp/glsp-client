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
import { Action, Bounds, Point, SEdgeSchema } from '@eclipse-glsp/protocol';
import { inject, injectable } from 'inversify';
import {
    AnchorComputerRegistry,
    CommandExecutionContext,
    CommandReturn,
    findChildrenAtPosition,
    findParentByFeature,
    isBoundsAware,
    isConnectable,
    MouseListener,
    PolylineEdgeRouter,
    SChildElement,
    SConnectableElement,
    SDanglingAnchor,
    SModelElement,
    SModelRoot,
    SRoutableElement,
    TYPES
} from 'sprotty';
import { MoveAction } from 'sprotty-protocol/lib/actions';
import { BoundsAwareModelElement, isRoutable } from '../../utils/smodel-util';
import { getAbsolutePosition, toAbsoluteBounds, toAbsolutePosition } from '../../utils/viewpoint-util';
import { FeedbackCommand } from './model';
export interface DrawFeedbackEdgeAction extends Action {
    kind: typeof DrawFeedbackEdgeAction.KIND;
    elementTypeId: string;
    sourceId: string;
    edgeSchema?: Partial<SEdgeSchema>;
}

export namespace DrawFeedbackEdgeAction {
    export const KIND = 'drawFeedbackEdge';

    export function is(object: any): object is DrawFeedbackEdgeAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: {
        elementTypeId: string;
        sourceId: string;
        edgeSchema?: Partial<SEdgeSchema>;
    }): DrawFeedbackEdgeAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawFeedbackEdgeCommand extends FeedbackCommand {
    static readonly KIND = DrawFeedbackEdgeAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawFeedbackEdgeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        drawFeedbackEdge(context, this.action.sourceId, this.action.elementTypeId, this.action.edgeSchema);
        return context.root;
    }
}

export interface RemoveFeedbackEdgeAction extends Action {
    kind: typeof RemoveFeedbackEdgeAction.KIND;
}

export namespace RemoveFeedbackEdgeAction {
    export const KIND = 'removeFeedbackEdgeCommand';

    export function is(object: any): object is RemoveFeedbackEdgeAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): RemoveFeedbackEdgeAction {
        return { kind: KIND };
    }
}

@injectable()
export class RemoveFeedbackEdgeCommand extends FeedbackCommand {
    static readonly KIND = RemoveFeedbackEdgeAction.KIND;

    execute(context: CommandExecutionContext): CommandReturn {
        removeFeedbackEdge(context.root);
        return context.root;
    }
}

export class FeedbackEdgeEnd extends SDanglingAnchor {
    static readonly TYPE = 'feedback-edge-end';
    constructor(
        readonly sourceId: string,
        readonly elementTypeId: string,
        public feedbackEdge: SRoutableElement | undefined = undefined,
        override readonly type: string = FeedbackEdgeEnd.TYPE
    ) {
        super();
    }
}

export class FeedbackEdgeEndMovingMouseListener extends MouseListener {
    constructor(protected anchorRegistry: AnchorComputerRegistry) {
        super();
    }

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const root = target.root;
        const edgeEnd = root.index.getById(feedbackEdgeEndId(root));
        if (!(edgeEnd instanceof FeedbackEdgeEnd) || !edgeEnd.feedbackEdge) {
            return [];
        }

        const edge = edgeEnd.feedbackEdge;
        const position = getAbsolutePosition(edgeEnd, event);
        const endAtMousePosition = findChildrenAtPosition(target.root, position)
            .reverse()
            .find(element => isConnectable(element) && element.canConnect(edge, 'target'));

        if (endAtMousePosition instanceof SConnectableElement && edge.source && isBoundsAware(edge.source)) {
            const anchor = this.computeAbsoluteAnchor(endAtMousePosition, Bounds.center(toAbsoluteBounds(edge.source)));
            if (Point.euclideanDistance(anchor, edgeEnd.position) > 1) {
                return [MoveAction.create([{ elementId: edgeEnd.id, toPosition: anchor }], { animate: false })];
            }
        } else {
            return [MoveAction.create([{ elementId: edgeEnd.id, toPosition: position }], { animate: false })];
        }

        return [];
    }

    protected computeAbsoluteAnchor(element: SConnectableElement, absoluteReferencePoint: Point, offset?: number): Point {
        const referencePointInParent = absoluteToParent(element, absoluteReferencePoint);
        const anchorComputer = this.anchorRegistry.get(PolylineEdgeRouter.KIND, element.anchorKind);
        let anchor = anchorComputer.getAnchor(element, referencePointInParent, offset);
        // The anchor is computed in the local coordinate system of the element.
        // If the element is a nested child element we have to add the absolute position of its parent to the anchor.
        if (element.parent !== element.root) {
            const parent = findParentByFeature(element.parent, isBoundsAware);
            if (parent) {
                const absoluteParentPosition = toAbsoluteBounds(parent);
                anchor = Point.add(absoluteParentPosition, anchor);
            }
        }
        return anchor;
    }
}

/**
 * Convert a point, specified in absolute coordinates, to a point relative
 * to the parent of the specified child element.
 * @param element the child element
 * @param absolutePoint a point in absolute coordinates
 * @returns the equivalent point, relative to the element's parent coordinates
 */
function absoluteToParent(element: BoundsAwareModelElement & SChildElement, absolutePoint: Point): Point {
    if (isBoundsAware(element.parent)) {
        return absoluteToLocal(element.parent, absolutePoint);
    }
    // If the parent is not bounds-aware, assume it's at 0; 0 and proceed
    return absoluteToLocal(element, absolutePoint);
}

/**
 * Convert a point, specified in absolute coordinates, to a point relative
 * to the specified element.
 * @param element the element
 * @param absolutePoint a point in absolute coordinates
 * @returns the equivalent point, relative to the element's coordinates
 */
function absoluteToLocal(element: BoundsAwareModelElement, absolutePoint: Point): Point {
    const absoluteElementBounds = toAbsoluteBounds(element);
    return { x: absolutePoint.x - absoluteElementBounds.x, y: absolutePoint.y - absoluteElementBounds.y };
}

export function feedbackEdgeId(root: SModelRoot): string {
    return root.id + '_feedback_edge';
}

export function feedbackEdgeEndId(root: SModelRoot): string {
    return root.id + '_feedback_anchor';
}

export const defaultFeedbackEdgeSchema: Partial<SEdgeSchema> = {
    cssClasses: ['feedback-edge'],
    opacity: 0.3
};

export function drawFeedbackEdge(
    context: CommandExecutionContext,
    sourceId: string,
    elementTypeId: string,
    edgeTemplate?: Partial<SEdgeSchema>
): void {
    const root = context.root;
    const sourceChild = root.index.getById(sourceId);
    if (!sourceChild) {
        return;
    }

    const source = findParentByFeature(sourceChild, isConnectable);
    if (!source || !isBoundsAware(source)) {
        return;
    }

    const edgeEnd = new FeedbackEdgeEnd(source.id, elementTypeId);
    edgeEnd.id = feedbackEdgeEndId(root);
    edgeEnd.position = toAbsolutePosition(source);

    const edgeSchema: SEdgeSchema = {
        id: feedbackEdgeId(root),
        type: elementTypeId,
        sourceId: source.id,
        targetId: edgeEnd.id,
        ...defaultFeedbackEdgeSchema,
        ...edgeTemplate
    };

    const feedbackEdge = context.modelFactory.createElement(edgeSchema);
    if (isRoutable(feedbackEdge)) {
        edgeEnd.feedbackEdge = feedbackEdge;
        root.add(edgeEnd);
        root.add(feedbackEdge);
    }
}

export function removeFeedbackEdge(root: SModelRoot): void {
    const feedbackEdge = root.index.getById(feedbackEdgeId(root));
    const feedbackEdgeEnd = root.index.getById(feedbackEdgeEndId(root));
    if (feedbackEdge instanceof SChildElement) {
        root.remove(feedbackEdge);
    }
    if (feedbackEdgeEnd instanceof SChildElement) {
        root.remove(feedbackEdgeEnd);
    }
}
