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
    GModelElement,
    IActionDispatcher,
    ICommandPaletteActionProvider,
    LabeledAction,
    Point,
    RequestContextActions,
    SetContextActions,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';

export namespace ServerCommandPalette {
    export const CONTEXT_ID = 'command-palette';
    export const TEXT = 'text';
    export const INDEX = 'index';
}

@injectable()
export class ServerCommandPaletteActionProvider implements ICommandPaletteActionProvider {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(EditorContextService) protected editorContext: EditorContextService;

    async getActions(_root: Readonly<GModelElement>, text: string, _lastMousePosition?: Point, index?: number): Promise<LabeledAction[]> {
        const requestAction = RequestContextActions.create({
            contextId: ServerCommandPalette.CONTEXT_ID,
            editorContext: this.editorContext.get({
                [ServerCommandPalette.TEXT]: text,
                [ServerCommandPalette.INDEX]: index ? index : 0
            })
        });
        const response = await this.actionDispatcher.requestUntil(requestAction);
        return response ? this.getPaletteActionsFromResponse(response) : [];
    }

    getPaletteActionsFromResponse(action: Action): LabeledAction[] {
        if (SetContextActions.is(action)) {
            return action.actions;
        }
        return [];
    }
}
