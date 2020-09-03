/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import { Action, ServerStatusAction } from "sprotty";

export class GLSPServerStatusAction extends ServerStatusAction {
    timeout: number = -1;
}

export function isGLSPServerStatusAction(serverStatusAction: ServerStatusAction): serverStatusAction is GLSPServerStatusAction {
    return (<GLSPServerStatusAction>serverStatusAction).timeout !== undefined;
}

export class ServerMessageAction implements Action {
    static KIND = 'serverMessage';

    kind = ServerMessageAction.KIND;
    severity: 'NONE' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
    message: string;
    details: string = '';
    timeout: number = -1;
}

export function isServerMessageAction(action: Action): action is ServerMessageAction {
    return ServerMessageAction.KIND === action.kind && 'severity' in action && 'message' in action;
}
