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
import { injectable } from "inversify";
import {
    Action, ActionHandlerRegistry, ActionMessage,
    ApplyLabelEditAction, CollapseExpandAction, CollapseExpandAllAction,
    ComputedBoundsAction, DiagramServer, ExportSvgAction, ICommand, LayoutAction,
    OpenAction, RequestBoundsCommand, RequestModelAction, RequestPopupModelAction,
    ServerStatusAction, SwitchEditModeCommand
} from "sprotty";
import * as rpc from "vscode-ws-jsonrpc";
import { NotificationType } from "vscode-ws-jsonrpc";
import { RequestContextActions } from "../base/actions/context-actions";
import { ExecuteServerCommandAction } from "../features/execute/execute-command";
import { RequestTypeHintsAction } from "../features/hints/request-type-hints-action";
import {
    CreateEdgeOperation, ReconnectEdgeOperation,
    ChangeRoutingPointsOperation, CreateNodeOperation, ChangeBoundsOperation,
    DeleteElementOperation,
    CompoundOperation
} from "../base/operations/operation";
import { SaveModelAction } from "../features/save/save";
import { GlspRedoAction, GlspUndoAction } from "../features/undo-redo/model";
import { RequestMarkersAction } from "../features/validation/validate";
import { ValidateLabelEditAction } from "../features/edit-label/edit-label-validator";
import { RequestClipboardDataAction, PasteOperationAction, CutOperationAction } from "../features/copy-paste/copy-paste-actions";
import { RequestEditValidationAction } from "../base/actions/edit-validation-actions";
import { SourceUriAware } from "../base/source-uri-aware";
import { RequestNavigationTargetsAction } from "../features/navigation/navigation-action-handler";
import { ResolveNavigationTargetAction } from "../features/navigation/navigation-target-resolver";
import { SetEditModeAction, isSetEditModeAction } from "../base/actions/edit-mode-action";

const receivedFromServerProperty = '__receivedFromServer';
@injectable()
export class GLSPWebsocketDiagramServer extends DiagramServer implements SourceUriAware {
    protected _sourceUri: string;
    protected connection: rpc.MessageConnection;

    listen(webSocket: WebSocket): void {
        rpc.listen({
            webSocket,
            onConnection: (connection: rpc.MessageConnection) => {
                connection.listen();
                connection.onNotification(ActionMessageNotification.type, (message: ActionMessage) => this.messageReceived(message));
                this.connection = connection;
            }
        });
    }

    protected sendMessage(message: ActionMessage): void {
        if (this.connection) {
            this.connection.sendNotification(ActionMessageNotification.type, message);
        } else {
            throw new Error('WebSocket is not connected');
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        registerDefaultGLSPServerActions(registry, this);
        this.clientId = this.viewerOptions.baseDiv;
    }

    handle(action: Action): void | ICommand | Action {
        if (action instanceof RequestModelAction && action.options !== undefined)
            this._sourceUri = <string>action.options.sourceUri;
        return super.handle(action);
    }

    handleLocally(action: Action): boolean {
        if (isSetEditModeAction(action)) {
            return this.handleSetEditModeAction(action);
        }
        return super.handleLocally(action);
    }

    protected handleComputedBounds(action: ComputedBoundsAction): boolean {
        return true;
    }

    protected handleSetEditModeAction(action: SetEditModeAction): boolean {
        return (action as any)[receivedFromServerProperty] !== true;
    }

    public getSourceURI(): string {
        return this._sourceUri;
    }
}

export function registerDefaultGLSPServerActions(registry: ActionHandlerRegistry, diagramServer: DiagramServer) {
    registry.register(SaveModelAction.KIND, diagramServer);
    registry.register(GlspUndoAction.KIND, diagramServer);
    registry.register(GlspRedoAction.KIND, diagramServer);
    registry.register(CreateEdgeOperation.KIND, diagramServer);
    registry.register(ReconnectEdgeOperation.KIND, diagramServer);
    registry.register(ChangeRoutingPointsOperation.KIND, diagramServer);
    registry.register(CreateNodeOperation.KIND, diagramServer);
    registry.register(ChangeBoundsOperation.KIND, diagramServer);
    registry.register(DeleteElementOperation.KIND, diagramServer);
    registry.register(ExecuteServerCommandAction.KIND, diagramServer);
    registry.register(RequestTypeHintsAction.KIND, diagramServer);
    registry.register(ComputedBoundsAction.KIND, diagramServer);
    registry.register(RequestBoundsCommand.KIND, diagramServer);
    registry.register(RequestPopupModelAction.KIND, diagramServer);
    registry.register(CollapseExpandAction.KIND, diagramServer);
    registry.register(CollapseExpandAllAction.KIND, diagramServer);
    registry.register(OpenAction.KIND, diagramServer);
    registry.register(ServerStatusAction.KIND, diagramServer);
    registry.register(RequestModelAction.KIND, diagramServer);
    registry.register(ExportSvgAction.KIND, diagramServer);
    registry.register(RequestContextActions.KIND, diagramServer);
    registry.register(ValidateLabelEditAction.KIND, diagramServer);
    registry.register(RequestMarkersAction.KIND, diagramServer);
    registry.register(LayoutAction.KIND, diagramServer);
    registry.register(ApplyLabelEditAction.KIND, diagramServer);
    registry.register(RequestClipboardDataAction.KIND, diagramServer);
    registry.register(PasteOperationAction.KIND, diagramServer);
    registry.register(CutOperationAction.KIND, diagramServer);
    registry.register(RequestEditValidationAction.KIND, diagramServer);
    registry.register(RequestNavigationTargetsAction.KIND, diagramServer);
    registry.register(ResolveNavigationTargetAction.KIND, diagramServer);
    registry.register(CompoundOperation.KIND, diagramServer);
    registry.register(SetEditModeAction.KIND, diagramServer);

    // Register an empty handler for SwitchEditMode, to avoid runtime exceptions.
    // We don't want to support SwitchEditMode, but sprotty still sends some corresponding
    // actions.
    registry.register(SwitchEditModeCommand.KIND, { handle: action => undefined });
}

namespace ActionMessageNotification {
    export const type = new NotificationType<ActionMessage, void>('process');
}

