/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
    AnchorComputerRegistry,
    Bounds,
    Disposable,
    GConnectableElement,
    GModelElement,
    MouseListener,
    MoveAction,
    Point,
    PolylineEdgeRouter,
    findChildrenAtPosition,
    findParentByFeature,
    isBoundsAware,
    isConnectable
} from '@eclipse-glsp/sprotty';
import { IFeedbackActionDispatcher } from '../../../base/feedback/feedback-action-dispatcher';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { absoluteToParent, getAbsolutePosition, toAbsoluteBounds } from '../../../utils/viewpoint-util';
import { FeedbackEdgeEnd, feedbackEdgeEndId } from './dangling-edge-feedback';

export class FeedbackEdgeEndMovingMouseListener extends MouseListener implements Disposable {
    protected feedback: FeedbackEmitter;

    constructor(
        protected anchorRegistry: AnchorComputerRegistry,
        protected feedbackDispatcher: IFeedbackActionDispatcher
    ) {
        super();
        this.feedback = feedbackDispatcher.createEmitter();
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
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

        if (endAtMousePosition instanceof GConnectableElement && edge.source && isBoundsAware(edge.source)) {
            const anchor = this.computeAbsoluteAnchor(endAtMousePosition, Bounds.center(toAbsoluteBounds(edge.source)));
            if (Point.euclideanDistance(anchor, edgeEnd.position) > 1) {
                this.feedback.add(MoveAction.create([{ elementId: edgeEnd.id, toPosition: anchor }], { animate: false })).submit();
            }
        } else {
            this.feedback.add(MoveAction.create([{ elementId: edgeEnd.id, toPosition: position }], { animate: false })).submit();
        }

        return [];
    }

    protected computeAbsoluteAnchor(element: GConnectableElement, absoluteReferencePoint: Point, offset?: number): Point {
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

    dispose(): void {
        this.feedback.dispose();
    }
}
