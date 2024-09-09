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
import { Action, CommandExecutionContext, CommandReturn, TYPES, hasStringProp } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';

import { FeedbackCommand } from '../../../base/feedback/feedback-command';
import { OptionalAction } from '../../../base/model/glsp-model-source';
import { forEachElement } from '../../../utils/gmodel-util';
import { ResizeHandleLocation, addResizeHandles, isResizable, removeResizeHandles } from '../../change-bounds/model';
import { IChangeBoundsManager } from './change-bounds-manager';

export interface ShowChangeBoundsToolResizeFeedbackAction extends Action {
    kind: typeof ShowChangeBoundsToolResizeFeedbackAction.KIND;

    elementId: string;
    resizeLocations?: ResizeHandleLocation[];
}

export namespace ShowChangeBoundsToolResizeFeedbackAction {
    export const KIND = 'showChangeBoundsToolResizeFeedback';

    export function is(object: any): object is ShowChangeBoundsToolResizeFeedbackAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'elementId');
    }

    /** @deprecated Use the create method with the options object parameter instead and set the 'elementId' parameter. */
    export function create(elementId: string): ShowChangeBoundsToolResizeFeedbackAction;
    export function create(options: Omit<ShowChangeBoundsToolResizeFeedbackAction, 'kind'>): ShowChangeBoundsToolResizeFeedbackAction;
    export function create(
        options: Omit<ShowChangeBoundsToolResizeFeedbackAction, 'kind'> | string
    ): ShowChangeBoundsToolResizeFeedbackAction {
        const opts = typeof options === 'string' ? { elementId: options } : options;
        return {
            kind: KIND,
            ...opts
        };
    }
}

export interface HideChangeBoundsToolResizeFeedbackAction extends Action {
    kind: typeof HideChangeBoundsToolResizeFeedbackAction.KIND;
}

export namespace HideChangeBoundsToolResizeFeedbackAction {
    export const KIND = 'hideChangeBoundsToolResizeFeedback';

    export function is(object: any): object is HideChangeBoundsToolResizeFeedbackAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): HideChangeBoundsToolResizeFeedbackAction {
        return { kind: KIND };
    }
}

@injectable()
export class ShowChangeBoundsToolResizeFeedbackCommand extends FeedbackCommand {
    static readonly KIND = ShowChangeBoundsToolResizeFeedbackAction.KIND;

    @inject(TYPES.Action) protected action: ShowChangeBoundsToolResizeFeedbackAction;
    @inject(TYPES.IChangeBoundsManager) protected changeBoundsManager: IChangeBoundsManager;

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;

        forEachElement(index, isResizable, element => element.id !== this.action.elementId && removeResizeHandles(element));

        if (this.action.elementId) {
            const resizeElement = index.getById(this.action.elementId);
            if (resizeElement && isResizable(resizeElement)) {
                addResizeHandles(
                    resizeElement,
                    this.action.resizeLocations ?? resizeElement.resizeLocations ?? this.changeBoundsManager.defaultResizeLocations()
                );
            }
        }
        return context.root;
    }
}

@injectable()
export class HideChangeBoundsToolResizeFeedbackCommand extends FeedbackCommand {
    static readonly KIND = HideChangeBoundsToolResizeFeedbackAction.KIND;

    @inject(TYPES.Action) protected action: HideChangeBoundsToolResizeFeedbackAction;

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        forEachElement(index, isResizable, removeResizeHandles);
        return context.root;
    }
}

export interface MoveInitializedEventAction extends Action {
    kind: typeof MoveInitializedEventAction.KIND;
}

export namespace MoveInitializedEventAction {
    export const KIND = 'move-initialized-event';

    export function is(object: any): object is MoveInitializedEventAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): MoveInitializedEventAction {
        return OptionalAction.mark({ kind: KIND });
    }
}

export interface MoveFinishedEventAction extends Action {
    kind: typeof MoveFinishedEventAction.KIND;
}

export namespace MoveFinishedEventAction {
    export const KIND = 'move-finished-event';

    export function is(object: any): object is MoveFinishedEventAction {
        return Action.hasKind(object, KIND);
    }

    export function create(): MoveFinishedEventAction {
        return OptionalAction.mark({ kind: KIND });
    }
}
