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
    IContextMenuItemProvider,
    LabeledAction,
    Point,
    RequestContextActions,
    SetContextActions,
    TYPES,
    isSelected
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';

export namespace ServerContextMenu {
    export const CONTEXT_ID = 'context-menu';
}

@injectable()
export class ServerContextMenuItemProvider implements IContextMenuItemProvider {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(EditorContextService) protected editorContext: EditorContextService;

    async getItems(root: Readonly<GModelElement>, _lastMousePosition?: Point): Promise<LabeledAction[]> {
        const selectedElementIds = Array.from(
            root.index
                .all()
                .filter(isSelected)
                .map(e => e.id)
        );
        const editorContext = this.editorContext.getWithSelection(selectedElementIds);
        const requestAction = RequestContextActions.create({ contextId: ServerContextMenu.CONTEXT_ID, editorContext });
        const response = await this.actionDispatcher.requestUntil(requestAction);
        return response ? this.getContextActionsFromResponse(response) : [];
    }

    getContextActionsFromResponse(action: Action): LabeledAction[] {
        if (SetContextActions.is(action)) {
            return action.actions;
        }
        return [];
    }
}
