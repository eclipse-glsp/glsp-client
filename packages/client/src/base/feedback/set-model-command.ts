/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { CommandExecutionContext, GModelRoot, ILogger, SetModelAction, SetModelCommand, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { IFeedbackActionDispatcher } from './feedback-action-dispatcher';

@injectable()
export class FeedbackAwareSetModelCommand extends SetModelCommand {
    @inject(TYPES.ILogger)
    protected logger: ILogger;

    @inject(TYPES.IFeedbackActionDispatcher)
    @optional()
    protected feedbackActionDispatcher?: IFeedbackActionDispatcher;

    constructor(@inject(TYPES.Action) action: SetModelAction) {
        super(action);
    }

    override execute(context: CommandExecutionContext): GModelRoot {
        const root = super.execute(context);
        this.applyFeedback(root, context);
        return root;
    }

    protected applyFeedback(newRoot: GModelRoot, context: CommandExecutionContext): void {
        // Create a temporary context which defines the `newRoot` as `root`
        // This way we do not corrupt the redo/undo behavior of the super class
        const tempContext: CommandExecutionContext = { ...context, root: newRoot };
        this.feedbackActionDispatcher?.applyFeedbackCommands(tempContext);
    }
}
