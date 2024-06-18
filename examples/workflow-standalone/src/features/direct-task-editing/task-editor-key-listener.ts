/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { TaskEditor } from '@eclipse-glsp-examples/workflow-glsp';
import {
    Action,
    EditorContextService,
    GModelRoot,
    KeyListener,
    SetUIExtensionVisibilityAction,
    matchesKeystroke
} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';

@injectable()
export class TaskEditorKeyListener extends KeyListener {
    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    override keyDown(_element: GModelRoot, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'F2', 'ctrlCmd')) {
            return [
                SetUIExtensionVisibilityAction.create({
                    extensionId: TaskEditor.ID,
                    visible: true,
                    contextElementsId: [this.editorContext.selectedElements[0].id]
                })
            ];
        }
        return [];
    }
}
