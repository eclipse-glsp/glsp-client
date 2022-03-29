/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { Action, hasArrayProp, SelectAction } from '@eclipse-glsp/protocol';
import { inject, injectable } from 'inversify';
import { Command, CommandExecutionContext, SelectCommand as SprottySelectCommand, SModelRoot } from 'sprotty';
import { TYPES } from '../../base/types';

export interface SelectFeedbackAction extends Omit<SelectAction, 'kind'>, Action {
    kind: typeof SelectFeedbackAction.KIND;
}

export namespace SelectFeedbackAction {
    export const KIND = 'selectFeedback';

    export function is(object: any): object is SelectFeedbackAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'selectedElementsIDs') && hasArrayProp(object, 'deselectedElementsIDs');
    }

    export function create(options?: { selectedElementsIDs?: string[]; deselectedElementsIDs?: string[] }): SelectFeedbackAction {
        return { ...SelectAction.create(options), kind: KIND };
    }
}
@injectable()
export class SelectFeedbackCommand extends Command {
    static readonly KIND = SelectFeedbackAction.KIND;
    private sprottySelectCommand: SprottySelectCommand;

    constructor(@inject(TYPES.Action) public action: SelectFeedbackAction) {
        super();
        this.sprottySelectCommand = new SprottySelectCommand({ ...action, kind: SelectAction.KIND });
    }

    execute(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectCommand.execute(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectCommand.undo(context);
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.sprottySelectCommand.redo(context);
    }
}
