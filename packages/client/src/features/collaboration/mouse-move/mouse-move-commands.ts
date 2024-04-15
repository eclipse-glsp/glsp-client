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
import {inject, injectable} from 'inversify';
import { FeedbackCommand } from '../../../base/feedback/feedback-command';
import {Command, CommandExecutionContext, CommandReturn} from 'sprotty';
import {DefaultTypes} from '@eclipse-glsp/protocol';
import {DrawMousePointerAction, RemoveMousePointerAction} from './mouse-move-actions';
import {removeElementFromParent} from '../model';
import {GModelRoot, TYPES} from '@eclipse-glsp/sprotty';

@injectable()
export class DrawMousePointerCommand extends FeedbackCommand {
    static readonly KIND = DrawMousePointerAction.KIND;

    constructor(@inject(TYPES.Action) protected action: DrawMousePointerAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = mousePointerId(context.root, this.action.initialSubclientInfo.subclientId);
        removeElementFromParent(context.root, id);
        const mousePointerSchema = {
            id,
            type: DefaultTypes.MOUSE_POINTER,
            position: {
                x: this.action.position.x,
                y: this.action.position.y
            },
            color: this.action.initialSubclientInfo.color,
            name: this.action.initialSubclientInfo.name,
            zoom: this.action.zoom,
            visible: this.action.visible
        };
        context.root.add(context.modelFactory.createElement(mousePointerSchema));
        return context.root;
    }
}

@injectable()
export class RemoveMousePointerCommand extends Command {
    static readonly KIND = RemoveMousePointerAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RemoveMousePointerAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const id = mousePointerId(context.root, this.action.initialSubclientId);
        removeElementFromParent(context.root, id);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export function mousePointerId(root: GModelRoot, subclientId: string): string {
    return root.id + '_' + DefaultTypes.MOUSE_POINTER + '_' + subclientId;
}
