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
/* eslint-disable deprecation/deprecation */
import { Command, CommandExecutionContext, CommandReturn, ICommand } from '@eclipse-glsp/sprotty';
import { Ranked } from '../ranked';

export abstract class FeedbackCommand extends Command implements Ranked {
    /** @deprecated Use rank instead. Please note that a lower rank implies higher priority, so the order is reversed. */
    readonly priority?: number = 0;

    // backwards compatibility: convert any existing priority to an equivalent rank
    readonly rank: number = this.priority ? -this.priority : Ranked.DEFAULT_RANK;

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

/** Used for backwards compatibility, otherwise use Ranked.getRank or Ranked sort functions. */
export function getFeedbackRank(command: ICommand): number {
    const feedbackCommand = command as Partial<FeedbackCommand>;
    return feedbackCommand?.priority ? -feedbackCommand.priority : feedbackCommand.rank ?? Ranked.DEFAULT_RANK;
}
