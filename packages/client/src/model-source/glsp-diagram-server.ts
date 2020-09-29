/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
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
import { GLSPClient } from "@eclipse-glsp/protocol";
import { injectable } from "inversify";
import {
    Action,
    ActionHandlerRegistry,
    ActionMessage,
    ComputedBoundsAction,
    DiagramServer,
    ICommand,
    RequestModelAction,
    SwitchEditModeCommand
} from "sprotty";

import { RequestContextActions } from "../base/actions/context-actions";
import { isSetEditModeAction, SetEditModeAction } from "../base/actions/edit-mode-action";
import { InitializeClientSessionAction } from "../base/actions/protocol-actions";
import { SourceUriAware } from "../base/source-uri-aware";
import { RequestTypeHintsAction } from "../features/hints/request-type-hints-action";
import { isServerMessageAction, ServerMessageAction } from "./glsp-server-status";

const receivedFromServerProperty = '__receivedFromServer';
@injectable()
export class GLSPDiagramServer extends DiagramServer implements SourceUriAware {
    protected _sourceUri: string;
    protected _glspClient?: GLSPClient;
    protected ready = false;

    async connect(client: GLSPClient): Promise<GLSPClient> {
        await client.start();
        client.onActionMessage(message => this.messageReceived(message));
        this._glspClient = client;
        return this._glspClient;
    }

    public get glspClient(): GLSPClient | undefined {
        return this._glspClient;
    }

    protected sendMessage(message: ActionMessage): void {
        if (this.glspClient) {
            this.glspClient.sendActionMessage(message);
        } else {
            throw new Error('GLSPClient is not connected');
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        registerDefaultGLSPServerActions(registry, this);
        if (!this.clientId)
            this.clientId = this.viewerOptions.baseDiv;
    }

    handle(action: Action): void | ICommand | Action {
        if (action instanceof RequestModelAction && action.options !== undefined)
            this._sourceUri = <string>action.options.sourceUri;
        return super.handle(action);
    }


    handleLocally(action: Action): boolean {
        if (isServerMessageAction(action)) {
            return this.handleServerMessageAction(action);
        }
        if (isSetEditModeAction(action)) {
            return this.handleSetEditModeAction(action);
        }
        return super.handleLocally(action);
    }
    protected handleServerMessageAction(action: ServerMessageAction): boolean {
        this.logger.log('GLSPDiagramServer', `[${action.severity}] -${action.message}`);
        return false;
    }

    protected handleComputedBounds(action: ComputedBoundsAction): boolean {
        return true;
    }

    protected handleSetEditModeAction(action: SetEditModeAction): boolean {
        return !isReceivedFromServer(action);
    }

    public getSourceURI(): string {
        return this._sourceUri;
    }
}

export function isReceivedFromServer(action: Action) {
    return (action as any)[receivedFromServerProperty] === true;
}

export function registerDefaultGLSPServerActions(registry: ActionHandlerRegistry, diagramServer: DiagramServer) {
    // Register the InitializeClientSessionAction as a server action. Then, the server will
    // notify us about all actions it handles (Via ConfigureServerHandlersAction/Handler)
    registry.register(InitializeClientSessionAction.KIND, diagramServer);

    // Register some additional early actions, that will happen before the server can tell us
    // which actions it handles
    registry.register(RequestTypeHintsAction.KIND, diagramServer);
    registry.register(RequestModelAction.KIND, diagramServer);
    registry.register(RequestContextActions.KIND, diagramServer);

    // Register an empty handler for SwitchEditMode, to avoid runtime exceptions.
    // We don't want to support SwitchEditMode, but sprotty still sends some corresponding
    // actions.
    registry.register(SwitchEditModeCommand.KIND, { handle: action => undefined });
}
