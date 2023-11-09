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

import { Action, CommandExecutionContext, CommandReturn, ElementTemplate, GChildElement, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { FeedbackCommand } from '../../base/feedback/feedback-command';
import { getTemplateElementId } from './add-template-element';

export interface RemoveTemplateElementsAction extends Action {
    kind: typeof RemoveTemplateElementsAction.KIND;
    templates: ElementTemplate[];
}

export namespace RemoveTemplateElementsAction {
    export const KIND = 'removeTemplateElements';

    export function create(options: Omit<RemoveTemplateElementsAction, 'kind'>): RemoveTemplateElementsAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

@injectable()
export class RemoveTemplateElementsFeedbackCommand extends FeedbackCommand {
    static readonly KIND = RemoveTemplateElementsAction.KIND;

    constructor(@inject(TYPES.Action) readonly action: RemoveTemplateElementsAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        for (const template of this.action.templates) {
            const element = index.getById(getTemplateElementId(template));
            if (element && element instanceof GChildElement) {
                element.parent.remove(element);
            }
        }
        return context.root;
    }
}
