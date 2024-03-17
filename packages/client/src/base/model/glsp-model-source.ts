/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
    ActionMessage,
    Disposable,
    DisposableCollection,
    DisposeClientSessionParameters,
    GLSPClient,
    GModelRootSchema,
    ILogger,
    InitializeClientSessionParameters,
    InitializeResult,
    ModelSource,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable, preDestroy } from 'inversify';
import { GLSPActionHandlerRegistry } from '../action-handler-registry';
import { IDiagramOptions } from './diagram-loader';

/**
 * A helper interface that allows the client to mark actions that have been received from the server.
 */
export interface ServerAction extends Action {
    __receivedFromServer: true;
}

export namespace ServerAction {
    export function is(object: unknown): object is ServerAction {
        return Action.is(object) && '__receivedFromServer' in object && object.__receivedFromServer === true;
    }

    /**
     * Mark the given action as {@link ServerAction} by attaching the "__receivedFromServer" property
     * @param action The action that should be marked as server action
     */
    export function mark(action: Action): void {
        (action as ServerAction).__receivedFromServer = true;
    }
}

/**
 * A helper interface that allows the client to mark actions that can be considered optional and should not throw an error if
 * no handler is available.
 */
export interface OptionalAction extends Action {
    __skipErrorIfNoHandler: true;
}

export namespace OptionalAction {
    export function is(object: unknown): object is ServerAction {
        return Action.is(object) && '__skipErrorIfNoHandler' in object && object.__skipErrorIfNoHandler === true;
    }

    /**
     * Mark the given action as {@link OptionalAction} by attaching the "__skipErrorIfNoHandler" property
     * @param action The action that should be marked as optional action
     */
    export function mark<T extends Action>(action: T): T & OptionalAction {
        (action as unknown as OptionalAction).__skipErrorIfNoHandler = true;
        return action as T & OptionalAction;
    }
}

/**
 * Central component for enabling the client-server action flow with the help of an underlying {@link GLSPClient}.
 * Handles & forwards actions that are intended for the GLSP server. In addition, it handles {@link ActionMessage}s received
 * from the server and dispatches the corresponding actions locally.
 *
 * Note that in sprotty a {@link ModelSource} is serving the model to the event cycle and
 * is used to commit the local (i.e. client-side) model back to the source.
 * However, in GLSP the update flow is reversed meaning that changes to the source model are applied
 * on the server side and then an update is sent to the client.
 */
@injectable()
export class GLSPModelSource extends ModelSource implements Disposable {
    @inject(TYPES.ILogger)
    protected logger: ILogger;

    @inject(TYPES.IDiagramOptions)
    protected options: IDiagramOptions;

    protected toDispose = new DisposableCollection();
    clientId: string;

    protected _currentRoot: GModelRootSchema;
    protected registry: GLSPActionHandlerRegistry;
    protected glspClient?: GLSPClient;

    get diagramType(): string {
        return this.options.diagramType;
    }

    get sourceUri(): string | undefined {
        return this.options.sourceUri;
    }

    /**
     * Configure forwarding of server-handled actions to the given {@link GLSPClient} and
     * handling of action received from the `GLSPClient` (i.e. server). It is expected that the
     * given GLSP client has already been initialized.
     * @param glspClient The GLSP  to use.
     * @throws An error if the given `GLSPClient` has not been initialized yet or if the set of server handled
     *         action kinds could not be derived from the initialize result
     */
    configure(glspClient: GLSPClient): Promise<void> {
        this.glspClient = glspClient;
        if (!glspClient.initializeResult) {
            throw new Error('Could not configure model source. The GLSP client is not initialized yet!');
        }

        const initializeParams = this.createInitializeClientSessionParameters(glspClient.initializeResult);
        this.configureServeActions(glspClient.initializeResult);

        this.toDispose.push(
            glspClient.onActionMessage(message => this.messageReceived(message), this.clientId),
            Disposable.create(() => glspClient.disposeClientSession(this.createDisposeClientSessionParameters()))
        );

        return glspClient!.initializeClientSession(initializeParams);
    }

    protected createInitializeClientSessionParameters(_initializeResult: InitializeResult): InitializeClientSessionParameters {
        const clientActionKinds = this.registry.getHandledActionKinds();
        return {
            clientSessionId: this.clientId,
            clientActionKinds,
            diagramType: this.diagramType
        };
    }

    protected createDisposeClientSessionParameters(): DisposeClientSessionParameters {
        return {
            clientSessionId: this.clientId
        };
    }

    protected configureServeActions(initializeResult: InitializeResult): void {
        const serverActions = initializeResult.serverActions[this.diagramType];
        if (serverActions?.length === 0) {
            throw new Error(`No server-handled actions could be derived from the initialize result for diagramType: ${this.diagramType}!`);
        }
        serverActions.forEach(action => this.registry.register(action, this));
    }

    protected messageReceived(message: ActionMessage): void {
        if (this.clientId !== message.clientId) {
            return;
        }
        const action = message.action;
        ServerAction.mark(action);
        this.logger.log(this, 'receiving', action);
        this.actionDispatcher.dispatch(action);
    }

    override initialize(registry: GLSPActionHandlerRegistry): void {
        // Registering actions here is discouraged and it's recommended
        // to implemented dedicated action handlers.
        if (!this.clientId) {
            this.clientId = this.options.clientId ?? this.viewerOptions.baseDiv;
        }

        this.registry = registry;
    }

    handle(action: Action): void {
        // Handling additional actions here is discouraged and it's recommended
        // to implemented dedicated action handlers.
        if (this.shouldForwardToServer(action)) {
            this.forwardToServer(action);
        }
    }

    protected forwardToServer(action: Action): void {
        const message: ActionMessage = {
            clientId: this.clientId,
            action: action
        };
        this.logger.log(this, 'sending', message);
        if (this.glspClient) {
            this.glspClient.sendActionMessage(message);
        } else {
            throw new Error('GLSPClient is not connected');
        }
    }

    protected shouldForwardToServer(action: Action): boolean {
        return !ServerAction.is(action);
    }

    commitModel(newRoot: GModelRootSchema): GModelRootSchema {
        /* In GLSP the model update flow is server-driven. i.e. changes to the graphical model are applied
         * on server-side an only the server can issue a model update.
         * The internal/local model should never be committed back to the model source i.e. GLSP server.
         * => no-op implementation that simply returns the `newRoot`
         */
        this._currentRoot = newRoot;
        return newRoot;
    }

    override get model(): GModelRootSchema {
        return this._currentRoot;
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }
}
