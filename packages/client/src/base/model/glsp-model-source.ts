/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
import {
    Action,
    ActionHandlerRegistry,
    ActionMessage,
    Disposable,
    DisposableCollection,
    GLSPClient,
    ILogger,
    InitializeResult,
    ModelSource,
    SModelRootSchema,
    TYPES
} from '~glsp-sprotty';
import { IDiagramOptions } from './diagram-loader';
/**
 * A helper interface that allows the client to mark actions that have been received from the server.
 */
export interface ServerAction extends Action {
    _receivedFromServer: true;
}

export namespace ServerAction {
    export function is(object: unknown): object is ServerAction {
        return Action.is(object) && '_receivedFromServer' in object && object._receivedFromServer === true;
    }

    /**
     * Mark the given action as {@link ServerAction} by attaching the "_receivedFromServer" property
     * @param action The action that should be marked as server action
     */
    export function mark(action: Action): void {
        (action as ServerAction)._receivedFromServer = true;
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

    protected toDispose = new DisposableCollection();
    clientId: string;
    readonly glspClient: GLSPClient;
    readonly sourceUri?: string;
    readonly diagramType: string;

    constructor(@inject(TYPES.IDiagramOptions) options: IDiagramOptions) {
        super();
        this.glspClient = options.glspClient;
        this.clientId = options.clientId ?? this.viewerOptions.baseDiv;
        this.diagramType = options.diagramType;
        this.sourceUri = options.sourceUri;
    }

    configure(registry: ActionHandlerRegistry, initializeResult: InitializeResult): Promise<void> {
        const serverActions = initializeResult.serverActions[this.diagramType];
        if (!serverActions || serverActions.length === 0) {
            throw new Error(`No server-handled actions could be derived from the initialize result for diagramType: ${this.diagramType}!`);
        }
        serverActions.forEach(action => registry.register(action, this));
        this.toDispose.push(this.glspClient.onActionMessage(message => this.messageReceived(message), this.clientId));
        return this.glspClient.initializeClientSession({ clientSessionId: this.clientId, diagramType: this.diagramType });
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

    override initialize(registry: ActionHandlerRegistry): void {
        // Registering actions here is discouraged and it's recommended
        // to implemented dedicated action handlers.
        if (!this.clientId) {
            this.clientId = this.viewerOptions.baseDiv;
        }
        if (this.glspClient.initializeResult) {
            this.configure(registry, this.glspClient.initializeResult);
        } else {
            this.glspClient.onServerInitialized(result => this.configure(registry, result));
        }
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

    commitModel(newRoot: SModelRootSchema): SModelRootSchema {
        /* In GLSP the model update flow is server-driven. i.e. changes to the graphical model are applied
         * on server-side an only the server can issue a model update.
         * The internal/local model should never be committed back to the model source i.e. GLSP server.
         * => no-op implementation that simply returns the `newRoot`
         */
        return newRoot;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
