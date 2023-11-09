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

import {
    Action,
    CommandExecutionContext,
    CommandResult,
    ElementTemplate,
    GChildElement,
    GLabel,
    GLabelSchema,
    GModelElement,
    GModelElementSchema,
    GParentElement,
    ModelIndexImpl,
    TYPES,
    distinctAdd,
    isBoundsAware,
    remove
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { GLSPActionDispatcher } from '../../base/action-dispatcher';
import { FeedbackCommand } from '../../base/feedback/feedback-command';
import { isNotUndefined } from '../../utils/gmodel-util';
import { LocalRequestBoundsAction } from '../bounds/local-bounds';

export interface AddTemplateElementsAction extends Action {
    kind: typeof AddTemplateElementsAction.KIND;
    templates: ElementTemplate[];
    addClasses?: string[];
    removeClasses?: string[];
}

export namespace AddTemplateElementsAction {
    export const KIND = 'addTemplateElements';

    export function create(options: Omit<AddTemplateElementsAction, 'kind'>): AddTemplateElementsAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

export function getTemplateElementId(template: ElementTemplate): string {
    return typeof template === 'string' ? `${template}_feedback` : template.id;
}

@injectable()
export class AddTemplateElementsFeedbackCommand extends FeedbackCommand {
    static readonly KIND = AddTemplateElementsAction.KIND;

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher;

    constructor(@inject(TYPES.Action) readonly action: AddTemplateElementsAction) {
        super();
    }

    override execute(context: CommandExecutionContext): CommandResult {
        this.action.templates
            .map(template => templateToSchema(context.root.index, template))
            .filter(isNotUndefined)
            .map(schema => context.modelFactory.createElement(schema))
            .map(element => this.applyRootCssClasses(element, this.action.addClasses, this.action.removeClasses))
            .forEach(templateElement => context.root.add(templateElement));
        return LocalRequestBoundsAction.fromCommand(context.root, this.actionDispatcher, this.action);
    }

    protected applyRootCssClasses(element: GChildElement, addClasses?: string[], removeClasses?: string[]): GChildElement {
        element.cssClasses = applyCssClasses(element.cssClasses, addClasses, removeClasses);
        return element;
    }
}

export function templateToSchema(index: ModelIndexImpl, template: ElementTemplate): GModelElementSchema | undefined {
    if (typeof template === 'string') {
        const element = index.getById(template);
        return element ? toElementSchema(element) : undefined;
    }
    return template;
}

export function toElementSchema(element: GModelElement): GModelElementSchema | GLabelSchema {
    return {
        type: element.type,
        id: getTemplateElementId(element.id),
        cssClasses: [...(element.cssClasses || [])],
        position: isBoundsAware(element) ? { x: element.bounds.x, y: element.bounds.y } : undefined,
        size: isBoundsAware(element) ? { width: element.bounds.width, height: element.bounds.height } : undefined,
        text: element instanceof GLabel ? element.text : undefined,
        children: element instanceof GParentElement ? element.children.map(child => toElementSchema(child)) : undefined
    };
}

export function applyCssClasses(source?: string[], toAdd?: string[], toRemove?: string[]): string[] {
    const classes = source ?? [];
    if (toAdd) {
        distinctAdd(classes, ...toAdd);
    }
    if (toRemove) {
        remove(classes, ...toRemove);
    }
    return classes;
}
