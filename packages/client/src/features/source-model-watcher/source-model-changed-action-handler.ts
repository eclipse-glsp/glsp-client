/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { inject, injectable, optional } from 'inversify';
import {
    Action,
    IActionDispatcher,
    IActionHandler,
    MessageAction,
    SourceModelChangedAction,
    StatusAction,
    TYPES,
    ViewerOptions
} from '@eclipse-glsp/sprotty';

/**
 * An external handler of the source model change event.
 *
 * This allows external applications to react specifically to this event, e.g. by bringing up the diagram,
 * check their dirty state, show a dialog, etc.
 */
@injectable()
export abstract class ExternalSourceModelChangedHandler {
    /**
     * Notifies about a change of the source model.
     * @returns actions to be dispatched after the notification.
     */
    abstract notifySourceModelChange(sourceModelName: string, options: ViewerOptions): Promise<Action[]>;
}

@injectable()
export class SourceModelChangedActionHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher)
    protected dispatcher: IActionDispatcher;

    @inject(TYPES.ViewerOptions)
    protected options: ViewerOptions;

    @inject(ExternalSourceModelChangedHandler)
    @optional()
    protected externalModelSourceChangedHandler?: ExternalSourceModelChangedHandler;

    handle(action: Action): void {
        if (SourceModelChangedAction.is(action)) {
            if (this.externalModelSourceChangedHandler) {
                this.externalModelSourceChangedHandler
                    .notifySourceModelChange(action.sourceModelName, this.options)
                    .then(actions => this.dispatcher.dispatchAll(actions));
                return;
            }
            this.showSimpleNotification(action);
        }
    }

    protected showSimpleNotification(action: SourceModelChangedAction): void {
        const message = `The source model ${action.sourceModelName} has changed. You might want to consider reloading.`;
        const timeout = 0;
        const severity = 'WARNING';
        this.dispatcher.dispatchAll([StatusAction.create(message, { severity, timeout }), MessageAction.create(message, { severity })]);
    }
}
