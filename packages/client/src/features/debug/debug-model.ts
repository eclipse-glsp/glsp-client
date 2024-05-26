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

import { Action, CommandExecutionContext, CommandReturn, GModelRoot, TYPES, hasBooleanProp } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { FeedbackCommand } from '../../base/feedback/feedback-command';
import { addCssClasses, removeCssClasses } from '../../utils/gmodel-util';

export interface EnableDebugModeAction extends Action {
    kind: typeof EnableDebugModeAction.KIND;
    enable: boolean;
}

export namespace EnableDebugModeAction {
    export const KIND = 'enableDebugMode';
    export const CSS_ROOT_CLASS = 'debug-mode';

    export function is(object: any): object is EnableDebugModeAction {
        return Action.hasKind(object, KIND) && hasBooleanProp(object, 'enable');
    }

    export function create(options: { enable: boolean }): EnableDebugModeAction {
        return {
            kind: EnableDebugModeAction.KIND,
            ...options
        };
    }
}

@injectable()
export class EnableDebugModeCommand extends FeedbackCommand {
    static readonly KIND = EnableDebugModeAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: EnableDebugModeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        return this.setDebugMode(context.root, this.action.enable);
    }

    protected setDebugMode(root: GModelRoot, show: boolean): CommandReturn {
        if (show) {
            addCssClasses(root, [EnableDebugModeAction.CSS_ROOT_CLASS]);
        } else {
            removeCssClasses(root, [EnableDebugModeAction.CSS_ROOT_CLASS]);
        }
        return root;
    }
}
