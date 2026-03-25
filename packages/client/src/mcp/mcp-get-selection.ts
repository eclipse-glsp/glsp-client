/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
    Command,
    CommandExecutionContext,
    CommandReturn,
    GetSelectionMcpAction,
    GetSelectionMcpResultAction,
    IActionDispatcher,
    isSelectable,
    toArray,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';

@injectable()
export class GetSelectionMcpCommand extends Command {
    static readonly KIND = GetSelectionMcpAction.KIND;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    constructor(@inject(TYPES.Action) protected readonly action: GetSelectionMcpAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const selection = context.root.index
            .all()
            .filter(e => isSelectable(e) && e.selected)
            .map(e => e.id);
        const result = GetSelectionMcpResultAction.create(toArray(selection), this.action.mcpRequestId);
        this.actionDispatcher.dispatch(result);
        return { model: context.root, modelChanged: false };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root, modelChanged: false };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root, modelChanged: false };
    }
}
