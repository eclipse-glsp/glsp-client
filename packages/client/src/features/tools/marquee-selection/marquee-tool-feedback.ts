/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
    AnchorComputerRegistry,
    CommandExecutionContext,
    CommandReturn,
    GChildElement,
    MouseListener,
    Point,
    GModelElement,
    GModelRoot,
    TYPES,
    hasObjectProp
} from '@eclipse-glsp/sprotty';
import { FeedbackCommand } from '../../../base/feedback/feedback-command';

export interface DrawMarqueeAction extends Action {
    kind: typeof DrawMarqueeAction.KIND;
    startPoint: Point;
    endPoint: Point;
}

export namespace DrawMarqueeAction {
    export const KIND = 'drawMarquee';

    export function is(object: any): object is DrawMarqueeAction {
        return Action.hasKind(object, KIND) && hasObjectProp(object, 'startPoint') && hasObjectProp(object, 'endPoint');
    }

    export function create(options: { startPoint: Point; endPoint: Point }): DrawMarqueeAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class DrawMarqueeCommand extends FeedbackCommand {
    static readonly KIND = DrawMarqueeAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawMarqueeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        drawMarquee(context, this.action.startPoint, this.action.endPoint);
        return context.root;
    }
}

export interface RemoveMarqueeAction extends Action {
    kind: typeof RemoveMarqueeAction.KIND;
}

export namespace RemoveMarqueeAction {
    export const KIND = 'removeMarquee';

    export function is(object: any): object is RemoveMarqueeAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): RemoveMarqueeAction {
        return { kind: KIND };
    }
}

@injectable()
export class RemoveMarqueeCommand extends FeedbackCommand {
    static readonly KIND = RemoveMarqueeAction.KIND;

    execute(context: CommandExecutionContext): CommandReturn {
        removeMarquee(context.root);
        return context.root;
    }
}

export class MarqueeEndMovingMouseListener extends MouseListener {
    constructor(protected anchorRegistry: AnchorComputerRegistry) {
        super();
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        return [];
    }
}

export function marqueeId(root: GModelRoot): string {
    return root.id + '_' + MARQUEE;
}

export const MARQUEE = 'marquee';

export function drawMarquee(context: CommandExecutionContext, startPoint: Point, endPoint: Point): void {
    const root = context.root;

    removeMarquee(root);

    const marqueeSchema = {
        type: MARQUEE,
        id: marqueeId(root),
        startPoint: startPoint,
        endPoint: endPoint
    };

    const marquee = context.modelFactory.createElement(marqueeSchema);
    root.add(marquee);
}

export function removeMarquee(root: GModelRoot): void {
    const marquee = root.index.getById(marqueeId(root));
    if (marquee instanceof GChildElement) {
        root.remove(marquee);
    }
}
