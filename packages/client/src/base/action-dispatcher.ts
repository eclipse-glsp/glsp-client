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
import {
    Action,
    ActionDispatcher,
    ActionHandlerRegistry,
    Deferred,
    EMPTY_ROOT,
    GModelRoot,
    IActionDispatcher,
    RequestAction,
    ResponseAction,
    SetModelAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { GLSPActionHandlerRegistry } from './action-handler-registry';
import { IGModelRootListener } from './editor-context-service';
import { OptionalAction } from './model/glsp-model-source';
import { ModelInitializationConstraint } from './model/model-initialization-constraint';

@injectable()
export class GLSPActionDispatcher extends ActionDispatcher implements IGModelRootListener, IActionDispatcher {
    protected readonly timeouts: Map<string, NodeJS.Timeout> = new Map();
    protected initializedConstraint = false;

    @inject(ModelInitializationConstraint)
    protected initializationConstraint: ModelInitializationConstraint;

    @inject(ActionHandlerRegistry)
    protected override actionHandlerRegistry: ActionHandlerRegistry;

    /** @deprecated No longer in used. The {@link ActionHandlerRegistry} is now directly injected */
    // eslint-disable-next-line deprecation/deprecation
    @inject(TYPES.ActionHandlerRegistryProvider) protected override actionHandlerRegistryProvider: () => Promise<ActionHandlerRegistry>;
    protected postUpdateQueue: Action[] = [];

    protected initializeDeferred = new Deferred<void>();

    override initialize(): Promise<void> {
        if (!this.initialized) {
            this.initialized = this.initializeDeferred.promise;
            this.doInitialize();
        }
        return this.initialized;
    }

    protected async doInitialize(): Promise<void> {
        try {
            if (this.actionHandlerRegistry instanceof GLSPActionHandlerRegistry) {
                this.actionHandlerRegistry.initialize();
            }
            this.handleAction(SetModelAction.create(EMPTY_ROOT)).catch(() => {
                /* Logged in handleAction method */
            });
            this.startModelInitialization();
            this.initializeDeferred.resolve();
        } catch (error) {
            this.initializeDeferred.reject(error);
        }
    }

    protected startModelInitialization(): void {
        if (!this.initializedConstraint) {
            this.logger.log(this, 'Starting model initialization mode');
            this.initializationConstraint.onInitialized(() => this.logger.log(this, 'Model initialization completed'));
            this.initializedConstraint = true;
        }
    }

    onceModelInitialized(): Promise<void> {
        return this.initializationConstraint.onInitialized();
    }

    hasHandler(action: Action): boolean {
        return this.actionHandlerRegistry.get(action.kind).length > 0;
    }

    /**
     * Processes all given actions, by dispatching them to the corresponding handlers, after the model initialization is completed.
     *
     * @param actions The actions that should be dispatched after the model initialization
     */
    dispatchOnceModelInitialized(...actions: Action[]): void {
        this.initializationConstraint.onInitialized(() => this.dispatchAll(actions));
    }

    /**
     * Processes all given actions, by dispatching them to the corresponding handlers, after the next model update.
     * The given actions are queued until the next model update cycle has been completed i.e.
     * the `EditorContextService.onModelRootChanged` event is triggered.
     *
     * @param actions The actions that should be dispatched after the next model update
     */
    dispatchAfterNextUpdate(...actions: Action[]): void {
        this.postUpdateQueue.push(...actions);
    }

    modelRootChanged(_root: Readonly<GModelRoot>): void {
        if (this.postUpdateQueue.length === 0) {
            return;
        }

        const toDispatch = [...this.postUpdateQueue];
        this.postUpdateQueue = [];
        this.dispatchAll(toDispatch);
    }

    override async dispatch(action: Action): Promise<void> {
        const result = await super.dispatch(action);
        this.initializationConstraint.notifyDispatched(action);
        return result;
    }

    protected override handleAction(action: Action): Promise<void> {
        if (ResponseAction.hasValidResponseId(action)) {
            // clear timeout
            const timeout = this.timeouts.get(action.responseId);
            if (timeout !== undefined) {
                clearTimeout(timeout);
                this.timeouts.delete(action.responseId);
            }

            // Check if we have a pending request for the response.
            // If not the  we clear the responseId => action will be dispatched normally
            const deferred = this.requests.get(action.responseId);
            if (deferred === undefined) {
                action.responseId = '';
            }
        }
        if (!this.hasHandler(action) && OptionalAction.is(action)) {
            return Promise.resolve();
        }
        return super.handleAction(action);
    }

    override request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        if (!action.requestId && action.requestId === '') {
            // No request id has been specified. So we use a generated one.
            action.requestId = RequestAction.generateRequestId();
        }
        return super.request(action);
    }

    /**
     * Dispatch a request and waits for a response until the timeout given in `timeoutMs` has
     * been reached. The returned promise is resolved when a response with matching identifier
     * is dispatched or when the timeout has been reached. That response is _not_ passed to the
     * registered action handlers. Instead, it is the responsibility of the caller of this method
     * to handle the response properly. For example, it can be sent to the registered handlers by
     * passing it again to the `dispatch` method.
     * If `rejectOnTimeout` is set to false (default) the returned promise will be resolved with
     * no value, otherwise it will be rejected.
     */
    requestUntil<Res extends ResponseAction>(
        action: RequestAction<Res>,
        timeoutMs = 2000,
        rejectOnTimeout = false
    ): Promise<Res | undefined> {
        if (!action.requestId && action.requestId === '') {
            // No request id has been specified. So we use a generated one.
            action.requestId = RequestAction.generateRequestId();
        }

        const requestId = action.requestId;
        const timeout = setTimeout(() => {
            const deferred = this.requests.get(requestId);
            if (deferred !== undefined) {
                // cleanup
                clearTimeout(timeout);
                this.requests.delete(requestId);

                const notification = 'Request ' + requestId + ' (' + action + ') time out after ' + timeoutMs + 'ms.';
                if (rejectOnTimeout) {
                    deferred.reject(notification);
                } else {
                    this.logger.info(this, notification);
                    deferred.resolve();
                }
            }
        }, timeoutMs);
        this.timeouts.set(requestId, timeout);

        return super.request<Res>(action);
    }
}
