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
import { Action, CommandExecutionContext, GModelElement, GModelRoot, TYPES, hasArrayProp } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { addCssClasses, getElements, removeCssClasses } from '../../utils/gmodel-util';
import { FeedbackCommand } from './feedback-command';

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

    export function create(options: { elements?: (string | GModelElement)[]; add?: string[]; remove?: string[] }): ModifyCSSFeedbackAction {
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

    execute(context: CommandExecutionContext): GModelRoot {
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

export const CSS_GHOST_ELEMENT = 'ghost-element';
export const CSS_HIDDEN = 'hidden';

export enum CursorCSS {
    DEFAULT = 'default-mode',
    OVERLAP_FORBIDDEN = 'overlap-forbidden-mode',
    NODE_CREATION = 'node-creation-mode',
    EDGE_CREATION_SOURCE = 'edge-creation-select-source-mode',
    EDGE_CREATION_TARGET = 'edge-creation-select-target-mode',
    EDGE_RECONNECT = 'edge-reconnect-select-target-mode',
    EDGE_CHECK_PENDING = 'edge-check-pending-mode',
    OPERATION_NOT_ALLOWED = 'edge-modification-not-allowed-mode',
    ELEMENT_DELETION = 'element-deletion-mode',
    RESIZE_NESW = 'resize-nesw-mode',
    RESIZE_NWSE = 'resize-nwse-mode',
    RESIZE_NW = 'resize-nw-mode',
    RESIZE_N = 'resize-n-mode',
    RESIZE_NE = 'resize-ne-mode',
    RESIZE_E = 'resize-e-mode',
    RESIZE_SE = 'resize-se-mode',
    RESIZE_S = 'resize-s-mode',
    RESIZE_SW = 'resize-sw-mode',
    RESIZE_W = 'resize-w-mode',
    MOVE = 'move-mode',
    MARQUEE = 'marquee-mode'
}

export function cursorFeedbackAction(cursorCss?: string): ModifyCSSFeedbackAction {
    const add = [];
    if (cursorCss) {
        add.push(cursorCss);
    }
    return ModifyCSSFeedbackAction.create({ add, remove: Object.values(CursorCSS) });
}

export function applyCssClasses(element: GModelElement, ...add: string[]): ModifyCSSFeedbackAction {
    return ModifyCSSFeedbackAction.create({ elements: [element], add });
}

export function deleteCssClasses(element: GModelElement, ...remove: string[]): ModifyCSSFeedbackAction {
    return ModifyCSSFeedbackAction.create({ elements: [element], remove });
}

export function toggleCssClasses(element: GModelElement, add: boolean, ...cssClasses: string[]): ModifyCSSFeedbackAction {
    return add ? applyCssClasses(element, ...cssClasses) : deleteCssClasses(element, ...cssClasses);
}
