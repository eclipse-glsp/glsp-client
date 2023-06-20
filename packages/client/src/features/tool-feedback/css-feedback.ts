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
import { Action, CommandExecutionContext, SModelElement, SModelRoot, TYPES, hasArrayProp } from '~glsp-sprotty';
import { addCssClasses, getElements, removeCssClasses } from '../../utils/smodel-util';
import { FeedbackCommand } from './model';

export interface ModifyCSSFeedbackAction extends Action {
    kind: typeof ModifyCSSFeedbackAction.KIND;

    elementIds?: string[];
    add?: string[];
    remove?: string[];
}

export namespace ModifyCSSFeedbackAction {
    export const KIND = 'modifyCSSFeedback';

    export function is(object: any): object is ModifyCSSFeedbackAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'elementIds');
    }

    export function create(options: { elements?: (string | SModelElement)[]; add?: string[]; remove?: string[] }): ModifyCSSFeedbackAction {
        const { elements, ...rest } = options;
        const elementIds = elements ? elements.map(element => (typeof element === 'string' ? element : element.id)) : undefined;
        return {
            kind: KIND,
            elementIds,
            ...rest
        };
    }
}

@injectable()
export class ModifyCssFeedbackCommand extends FeedbackCommand {
    static readonly KIND = ModifyCSSFeedbackAction.KIND;

    constructor(@inject(TYPES.Action) readonly action: ModifyCSSFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const elements = this.action.elementIds ? getElements(context.root.index, this.action.elementIds) : [context.root];

        elements.forEach(e => {
            if (this.action.remove) {
                removeCssClasses(e, this.action.remove);
            }

            if (this.action.add) {
                addCssClasses(e, this.action.add);
            }
        });

        return context.root;
    }
}

export enum CursorCSS {
    DEFAULT = 'default-mode',
    OVERLAP_FORBIDDEN = 'overlap-forbidden-mode',
    NODE_CREATION = 'node-creation-mode',
    EDGE_CREATION_SOURCE = 'edge-creation-select-source-mode',
    EDGE_CREATION_TARGET = 'edge-creation-select-target-mode',
    EDGE_RECONNECT = 'edge-reconnect-select-target-mode',
    OPERATION_NOT_ALLOWED = 'edge-modification-not-allowed-mode',
    ELEMENT_DELETION = 'element-deletion-mode',
    RESIZE_NESW = 'resize-nesw-mode',
    RESIZE_NWSE = 'resize-nwse-mode',
    MOVE = 'move-mode',
    MARQUEE = 'marquee-mode'
}

export function cursorFeedbackAction(cursorCss?: CursorCSS): ModifyCSSFeedbackAction {
    const add = [];
    if (cursorCss) {
        add.push(cursorCss);
    }
    return ModifyCSSFeedbackAction.create({ add, remove: Object.values(CursorCSS) });
}

export function applyCssClasses(element: SModelElement, ...add: string[]): ModifyCSSFeedbackAction {
    return ModifyCSSFeedbackAction.create({ elements: [element], add });
}

export function deleteCssClasses(element: SModelElement, ...remove: string[]): ModifyCSSFeedbackAction {
    return ModifyCSSFeedbackAction.create({ elements: [element], remove });
}
