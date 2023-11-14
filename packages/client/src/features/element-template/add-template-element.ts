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
    GModelElementSchema,
    TYPES,
    distinctAdd,
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
            .map(template => templateToSchema(template, context))
            .filter(isNotUndefined)
            .map(schema => context.modelFactory.createElement(schema))
            .map(element => this.applyRootCssClasses(element, this.action.addClasses, this.action.removeClasses))
            .forEach(templateElement => context.root.add(templateElement));
        return LocalRequestBoundsAction.fromCommand(context, this.actionDispatcher, this.action);
    }

    protected applyRootCssClasses(element: GChildElement, addClasses?: string[], removeClasses?: string[]): GChildElement {
        element.cssClasses = modifyCssClasses(element.cssClasses, addClasses, removeClasses);
        return element;
    }
}

export function templateToSchema(template: ElementTemplate, context: CommandExecutionContext): GModelElementSchema | undefined {
    if (typeof template === 'string') {
        const element = context.root.index.getById(template);
        const schema = element ? context.modelFactory.createSchema(element) : undefined;
        if (schema) {
            adaptSchemaIds(schema);
        }
        return schema;
    }
    return template;
}

function adaptSchemaIds(schema: GModelElementSchema): GModelElementSchema {
    schema.id = getTemplateElementId(schema.id);
    schema.children?.forEach(child => adaptSchemaIds(child));
    return schema;
}

function modifyCssClasses(source?: string[], toAdd?: string[], toRemove?: string[]): string[] {
    const classes = source ?? [];
    if (toAdd) {
        distinctAdd(classes, ...toAdd);
    }
    if (toRemove) {
        remove(classes, ...toRemove);
    }
    return classes;
}
