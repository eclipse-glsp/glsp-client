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
import { Command, CommandExecutionContext, GModelRoot, SelectAction, SprottySelectCommand, TYPES } from '@eclipse-glsp/sprotty';
import { SelectFeedbackAction } from '../../base/selection-service';

@injectable()
export class SelectFeedbackCommand extends Command {
    static readonly KIND = SelectFeedbackAction.KIND;
    private sprottySelectCommand: SprottySelectCommand;

    constructor(@inject(TYPES.Action) public action: SelectFeedbackAction) {
        super();
        this.sprottySelectCommand = new SprottySelectCommand({ ...action, kind: SelectAction.KIND });
    }

    execute(context: CommandExecutionContext): GModelRoot {
        return this.sprottySelectCommand.execute(context);
    }

    undo(context: CommandExecutionContext): GModelRoot {
        return this.sprottySelectCommand.undo(context);
    }

    redo(context: CommandExecutionContext): GModelRoot {
        return this.sprottySelectCommand.redo(context);
    }
}
