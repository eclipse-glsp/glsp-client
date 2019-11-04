/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable } from "inversify";
import { Action, ActionHandlerRegistry, IActionDispatcher, IActionHandlerInitializer, ILogger, TYPES } from "sprotty/lib";
import { v4 as uuid } from "uuid";

import { IdentifiableRequestAction, IdentifiableResponseAction, isIdentifiableResponseAction } from "./action-definitions";


@injectable()
export class RequestResponseSupport implements IActionHandlerInitializer {
    private requestedResponses = new Map<string, Action | undefined>();

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(TYPES.ActionHandlerRegistryProvider) protected registry: ActionHandlerRegistry;
    @inject(TYPES.ILogger) protected logger: ILogger;

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(IdentifiableResponseAction.KIND, this);
    }

    handle(response: Action) {
        if (isIdentifiableResponseAction(response)) {
            const responseId = response.id;
            if (this.requestedResponses.has(responseId)) {
                this.requestedResponses.set(responseId, response.action);
            } else {
                this.logger.log(this, "[RequestResponse] " + responseId + ": Response without request, ignore.");
            }
        }
    }

    async dispatchRequest<T>(request: Action, responseHandler: (action: Action) => T, //
        intervalMs: number = 100, timeoutMs: number = 2000, rejectOnTimeout: boolean = false): Promise<T> {

        const requestId = uuid();
        const requestAction = new IdentifiableRequestAction(requestId, request);
        this.requestedResponses.set(requestAction.id, undefined);

        await this.actionDispatcher.dispatch(requestAction);
        this.logger.log(this, "[RequestResponse] " + requestId + ": Request for " + JSON.stringify(requestAction.action) + " dispatched.");

        let timeout: NodeJS.Timeout;
        let responseInterval: NodeJS.Timeout;

        const requestPromise = new Promise<T>((resolve, reject) => {
            responseInterval = setInterval(() => {
                const responseAction = this.requestedResponses.get(requestId);
                if (responseAction) {
                    this.logger.log(this, "[RequestResponse] " + requestId + ": Response for request received.");

                    // cleanup
                    clearTimeout(timeout);
                    clearInterval(responseInterval);
                    this.requestedResponses.delete(requestId);

                    // handle result
                    const result = responseHandler(responseAction);
                    return resolve(result);
                }
            }, intervalMs);
            return [];
        });

        const timeoutPromise = new Promise<T>((resolve, reject) => {
            timeout = setTimeout(() => {
                this.logger.warn(this, "[RequestResponse] " + requestId + ": No response received after " + timeoutMs + "ms.");

                // cleanup
                clearTimeout(timeout);
                clearInterval(responseInterval);
                this.requestedResponses.delete(requestId);

                // handle timeout: reject or resolve with undefined
                if (rejectOnTimeout) {
                    return reject("No response for " + requestId + " (" + requestAction.action + ") timed out after " + timeoutMs + "!");
                }
                return resolve();
            }, timeoutMs);
            return [];
        });
        return Promise.race([requestPromise, timeoutPromise]);
    }
}
