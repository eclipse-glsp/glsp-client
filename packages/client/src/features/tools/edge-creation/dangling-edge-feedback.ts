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
import { inject, injectable } from 'inversify';
import {
    Action,
    BindingContext,
    CommandExecutionContext,
    CommandReturn,
    SChildElement,
    SDanglingAnchor,
    SEdgeSchema,
    SModelRoot,
    SRoutableElement,
    TYPES,
    configureCommand,
    configureView,
    findParentByFeature,
    isBoundsAware,
    isConnectable
} from '~glsp-sprotty';
import { FeedbackCommand } from '../../../base/feedback/feedback-command';
import { isRoutable } from '../../../utils/smodel-util';
import { toAbsolutePosition } from '../../../utils/viewpoint-util';
import { FeedbackEdgeEndView } from './view';

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
        drawDanglingFeedbackEdge(context, this.action.sourceId, this.action.elementTypeId, this.action.edgeSchema);
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
        removeDanglingFeedbackEdge(context.root);
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

export function drawDanglingFeedbackEdge(
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

export function removeDanglingFeedbackEdge(root: SModelRoot): void {
    const feedbackEdge = root.index.getById(feedbackEdgeId(root));
    const feedbackEdgeEnd = root.index.getById(feedbackEdgeEndId(root));
    if (feedbackEdge instanceof SChildElement) {
        root.remove(feedbackEdge);
    }
    if (feedbackEdgeEnd instanceof SChildElement) {
        root.remove(feedbackEdgeEnd);
    }
}

export function configureDanglingFeedbackEdge(context: BindingContext): void {
    if (!context.isBound(DrawFeedbackEdgeCommand) && !context.isBound(RemoveFeedbackEdgeCommand) && !context.isBound(FeedbackEdgeEndView)) {
        configureCommand(context, DrawFeedbackEdgeCommand);
        configureCommand(context, RemoveFeedbackEdgeCommand);
        configureView(context, FeedbackEdgeEnd.TYPE, FeedbackEdgeEndView);
    }
}
