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

import {
    Action,
    CenterAction,
    codiconCSSString,
    GModelElement,
    GModelRoot,
    GNode,
    isNameable,
    name,
    SelectAction,
    toArray
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import {
    AutocompleteSuggestionProviderContext,
    IAutocompleteSuggestionProvider,
    type AutocompleteSuggestion
} from '../../../base/auto-complete/autocomplete-suggestion-provider';

@injectable()
export class RevealNamedElementSuggestionProvider implements IAutocompleteSuggestionProvider {
    get id(): string {
        return 'glsp.reveal-named-element-suggestion';
    }

    canHandle(context: string): boolean {
        return context === AutocompleteSuggestionProviderContext.CANVAS;
    }

    async getSuggestions(root: Readonly<GModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const nameables = toArray(root.index.all().filter(element => isNameable(element)));
        return nameables.map(nameable => ({
            element: nameable,
            action: {
                label: `[${nameable.type}] ${name(nameable) ?? '<no-name>'}`,
                actions: this.createActions(nameable),
                icon: codiconCSSString('eye')
            }
        }));
    }

    protected createActions(nameable: GModelElement): Action[] {
        return [SelectAction.create({ selectedElementsIDs: [nameable.id] }), CenterAction.create([nameable.id], { retainZoom: true })];
    }
}

@injectable()
export class NodesWithoutNameSuggestionProvider implements IAutocompleteSuggestionProvider {
    get id(): string {
        return 'glsp.reveal-nodes-without-name-suggestion';
    }

    canHandle(searchContext: string): boolean {
        return searchContext === AutocompleteSuggestionProviderContext.CANVAS;
    }

    async getSuggestions(root: Readonly<GModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const nodes = toArray(root.index.all().filter(element => !isNameable(element) && element instanceof GNode));
        return nodes.map(node => ({
            element: node,
            action: {
                label: `[${node.type}]`,
                actions: this.createActions(node),
                icon: codiconCSSString('symbol-namespace')
            }
        }));
    }

    protected createActions(nameable: GModelElement): Action[] {
        return [SelectAction.create({ selectedElementsIDs: [nameable.id] }), CenterAction.create([nameable.id], { retainZoom: true })];
    }
}
