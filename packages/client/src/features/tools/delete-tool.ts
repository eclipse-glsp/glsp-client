/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    DeleteElementOperation,
    EnableDefaultToolsAction,
    KeyListener,
    KeyTool,
    MouseListener,
    MouseTool,
    SModelElement,
    TYPES,
    findParentByFeature,
    isCtrlOrCmd,
    isDeletable,
    isSelectable,
    matchesKeystroke
} from '~glsp-sprotty';
import { IFeedbackActionDispatcher } from '../../base/feedback/feedback-action-dispatcher';
import { GLSPTool } from '../../base/tool-manager/glsp-tool-manager';
import { CursorCSS, cursorFeedbackAction } from '../tool-feedback/css-feedback';

/**
 * Deletes selected elements when hitting the `Del` key.
 */
@injectable()
export class DelKeyDeleteTool implements GLSPTool {
    static ID = 'glsp.delete-keyboard';

    isEditTool = true;
    protected deleteKeyListener: DeleteKeyListener = new DeleteKeyListener();

    @inject(KeyTool) protected readonly keytool: KeyTool;

    get id(): string {
        return DelKeyDeleteTool.ID;
    }

    enable(): void {
        this.keytool.register(this.deleteKeyListener);
    }

    disable(): void {
        this.keytool.deregister(this.deleteKeyListener);
    }
}

@injectable()
export class DeleteKeyListener extends KeyListener {
    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Delete')) {
            const deleteElementIds = Array.from(
                element.root.index
                    .all()
                    .filter(e => isDeletable(e) && isSelectable(e) && e.selected)
                    .filter(e => e.id !== e.root.id)
                    .map(e => e.id)
            );
            if (deleteElementIds.length > 0) {
                return [DeleteElementOperation.create(deleteElementIds)];
            }
        }
        return [];
    }
}

/**
 * Deletes selected elements when clicking on them.
 */
@injectable()
export class MouseDeleteTool implements GLSPTool {
    static ID = 'glsp.delete-mouse';

    isEditTool = true;

    protected deleteToolMouseListener: DeleteToolMouseListener = new DeleteToolMouseListener();

    @inject(MouseTool) protected mouseTool: MouseTool;
    @inject(TYPES.IFeedbackActionDispatcher) protected readonly feedbackDispatcher: IFeedbackActionDispatcher;

    get id(): string {
        return MouseDeleteTool.ID;
    }

    enable(): void {
        this.mouseTool.register(this.deleteToolMouseListener);
        this.feedbackDispatcher.registerFeedback(this, [cursorFeedbackAction(CursorCSS.ELEMENT_DELETION)]);
    }

    disable(): void {
        this.mouseTool.deregister(this.deleteToolMouseListener);
        this.feedbackDispatcher.registerFeedback(this, [cursorFeedbackAction()]);
    }
}

@injectable()
export class DeleteToolMouseListener extends MouseListener {
    override mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const deletableParent = findParentByFeature(target, isDeletable);
        if (deletableParent === undefined) {
            return [];
        }
        const result: Action[] = [];
        result.push(DeleteElementOperation.create([deletableParent.id]));
        if (!isCtrlOrCmd(event)) {
            result.push(EnableDefaultToolsAction.create());
        }
        return result;
    }
}
