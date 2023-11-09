/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
    CommandExecutionContext,
    CommandReturn,
    ElementAndBounds,
    SetBoundsAction,
    SetBoundsCommand,
    TYPES,
    isLayoutContainer
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { FeedbackCommand } from '../../base/feedback/feedback-command';
import { LocalRequestBoundsAction } from './local-bounds';

export namespace SetBoundsFeedbackAction {
    export const KIND = 'setBoundsFeedback';

    export function is(object: any): object is SetBoundsFeedbackAction {
        return Action.hasKind(object, KIND);
    }

    export function create(bounds: ElementAndBounds[]): SetBoundsFeedbackAction {
        return { kind: KIND, bounds };
    }
}

export interface SetBoundsFeedbackAction extends Omit<SetBoundsAction, 'kind'> {
    kind: typeof SetBoundsFeedbackAction.KIND;
}

@injectable()
export class SetBoundsFeebackCommand extends SetBoundsCommand implements FeedbackCommand {
    static override readonly KIND: string = SetBoundsFeedbackAction.KIND;

    readonly priority: number = 0;

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher;

    override execute(context: CommandExecutionContext): CommandReturn {
        super.execute(context);

        // apply set bounds as layout options so that when we calculate the bounds they are considered by the layouter
        this.action.bounds.forEach(bounds => {
            const element = context.root.index.getById(bounds.elementId);
            if (element && isLayoutContainer(element)) {
                const options = element.layoutOptions ?? {};
                options.prefHeight = bounds.newSize.height;
                options.prefWidth = bounds.newSize.width;
                element.layoutOptions = options;
            }
        });
        return LocalRequestBoundsAction.fromCommand(context.root, this.actionDispatcher, this.action);
    }
}
