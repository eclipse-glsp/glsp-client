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
import { inject, injectable } from "inversify";
import {
    Action,
    AnchorComputerRegistry,
    center,
    CommandExecutionContext,
    CommandReturn,
    euclideanDistance,
    findChildrenAtPosition,
    findParentByFeature,
    isBoundsAware,
    isConnectable,
    MouseListener,
    MoveAction,
    PolylineEdgeRouter,
    SChildElement,
    SConnectableElement,
    SDanglingAnchor,
    SEdgeSchema,
    SModelElement,
    SModelRoot,
    SRoutableElement,
    TYPES
} from "sprotty/lib";

import { isRoutable } from "../../utils/smodel-util";
import { getAbsolutePosition, toAbsolutePosition } from "../../utils/viewpoint-util";
import { FeedbackCommand } from "./model";

export class DrawFeedbackEdgeAction implements Action {
    kind = DrawFeedbackEdgeCommand.KIND;
    constructor(readonly elementTypeId: string, readonly sourceId: string, readonly routerKind?: string) { }
}

@injectable()
export class DrawFeedbackEdgeCommand extends FeedbackCommand {
    static readonly KIND = 'drawFeedbackEdge';

    constructor(@inject(TYPES.Action) protected action: DrawFeedbackEdgeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        drawFeedbackEdge(context, this.action.sourceId, this.action.elementTypeId, this.action.routerKind);
        return context.root;
    }
}

export class RemoveFeedbackEdgeAction implements Action {
    kind = RemoveFeedbackEdgeCommand.KIND;
    constructor() { }
}

@injectable()
export class RemoveFeedbackEdgeCommand extends FeedbackCommand {
    static readonly KIND = 'removeFeedbackEdgeCommand';

    execute(context: CommandExecutionContext): CommandReturn {
        removeFeedbackEdge(context.root);
        return context.root;
    }
}


export class FeedbackEdgeEnd extends SDanglingAnchor {
    static readonly TYPE = 'feedback-edge-end';
    type = FeedbackEdgeEnd.TYPE;
    constructor(readonly sourceId: string,
        readonly elementTypeId: string,
        public feedbackEdge: SRoutableElement | undefined = undefined) {
        super();
    }
}
export class FeedbackEdgeEndMovingMouseListener extends MouseListener {
    constructor(protected anchorRegistry: AnchorComputerRegistry) {
        super();
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const root = target.root;
        const edgeEnd = root.index.getById(feedbackEdgeEndId(root));
        if (!(edgeEnd instanceof FeedbackEdgeEnd) || !edgeEnd.feedbackEdge) {
            return [];
        }

        const edge = edgeEnd.feedbackEdge;
        const position = getAbsolutePosition(edgeEnd, event);
        const endAtMousePosition = findChildrenAtPosition(target.root, position)
            .find(e => isConnectable(e) && e.canConnect(edge, 'target'));

        if (endAtMousePosition instanceof SConnectableElement && edge.source && isBoundsAware(edge.source)) {
            const anchorComputer = this.anchorRegistry.get(PolylineEdgeRouter.KIND, endAtMousePosition.anchorKind);
            const anchor = anchorComputer.getAnchor(endAtMousePosition, center(edge.source.bounds));
            if (euclideanDistance(anchor, edgeEnd.position) > 1) {
                return [new MoveAction([{ elementId: edgeEnd.id, toPosition: anchor }], false)];
            }
        } else {
            return [new MoveAction([{ elementId: edgeEnd.id, toPosition: position }], false)];
        }

        return [];
    }
}

export function feedbackEdgeId(root: SModelRoot): string {
    return root.id + '_feedback_edge';
}

export function feedbackEdgeEndId(root: SModelRoot): string {
    return root.id + '_feedback_anchor';
}

function drawFeedbackEdge(context: CommandExecutionContext, sourceId: string, elementTypeId: string, routerKind?: string) {
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

    const feedbackEdgeSchema = <SEdgeSchema>{
        type: 'edge',
        id: feedbackEdgeId(root),
        sourceId: source.id,
        targetId: edgeEnd.id,
        cssClasses: ["feedback-edge"],
        routerKind,
        opacity: 0.3
    };

    const feedbackEdge = context.modelFactory.createElement(feedbackEdgeSchema);
    if (isRoutable(feedbackEdge)) {
        edgeEnd.feedbackEdge = feedbackEdge;
        root.add(edgeEnd);
        root.add(feedbackEdge);
    }
}

function removeFeedbackEdge(root: SModelRoot) {
    const feedbackEdge = root.index.getById(feedbackEdgeId(root));
    const feedbackEdgeEnd = root.index.getById(feedbackEdgeEndId(root));
    if (feedbackEdge instanceof SChildElement)
        root.remove(feedbackEdge);
    if (feedbackEdgeEnd instanceof SChildElement)
        root.remove(feedbackEdgeEnd);
}
