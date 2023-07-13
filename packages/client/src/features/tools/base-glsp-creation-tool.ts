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
import { injectable } from 'inversify';
import { Action, EnableToolsAction, IActionHandler } from '~glsp-sprotty';
import { BaseGLSPTool } from './base-glsp-tool';

@injectable()
export abstract class BaseGLSPCreationTool<T extends Action> extends BaseGLSPTool implements IActionHandler {
    protected abstract isTriggerAction: (obj: any) => obj is T;
    protected triggerAction: T;

    handle(action: Action): Action | void {
        if (this.isTriggerAction(action)) {
            this.triggerAction = action;
            return EnableToolsAction.create([this.id]);
        }
    }

    override enable(): void {
        if (this.triggerAction === undefined) {
            throw new TypeError(`Could not enable tool ${this.id}. The triggerAction cannot be undefined.`);
        }
        this.doEnable();
    }

    protected abstract doEnable(): void;
}
