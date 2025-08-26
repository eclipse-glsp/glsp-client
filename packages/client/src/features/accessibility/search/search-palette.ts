/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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
    GModelElement,
    GModelRoot,
    GNode,
    LabeledAction,
    SelectAction,
    SelectAllAction,
    codiconCSSString,
    isNameable,
    name,
    toArray
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { isEqual } from 'lodash';
import { BaseAutocompletePalette } from '../../../base/auto-complete/base-autocomplete-palette';

import { AutocompleteSuggestion, IAutocompleteSuggestionProvider } from '../../../base/auto-complete/autocomplete-suggestion-providers';
import { applyCssClasses, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { messages } from '../../../base/messages';
import { RepositionAction } from '../../../features/viewport/reposition';
import { GEdge } from '../../../model';

const CSS_SEARCH_HIDDEN = 'search-hidden';
const CSS_SEARCH_HIGHLIGHTED = 'search-highlighted';

export class RevealNamedElementAutocompleteSuggestionProvider implements IAutocompleteSuggestionProvider {
    async retrieveSuggestions(root: Readonly<GModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const nameables = toArray(root.index.all().filter(element => isNameable(element)));
        return nameables.map(nameable => ({
            element: nameable,
            action: {
                label: `[${nameable.type}] ${name(nameable) ?? '<no-name>'}`,
                actions: this.getActions(nameable),
                icon: codiconCSSString('eye')
            }
        }));
    }

    protected getActions(nameable: GModelElement): Action[] {
        return [SelectAction.create({ selectedElementsIDs: [nameable.id] }), CenterAction.create([nameable.id], { retainZoom: true })];
    }
}
export class RevealNodesWithoutNameAutocompleteSuggestionProvider implements IAutocompleteSuggestionProvider {
    async retrieveSuggestions(root: Readonly<GModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const nodes = toArray(root.index.all().filter(element => !isNameable(element) && element instanceof GNode));
        return nodes.map(node => ({
            element: node,
            action: {
                label: `[${node.type}]`,
                actions: this.getActions(node),
                icon: codiconCSSString('symbol-namespace')
            }
        }));
    }

    protected getActions(nameable: GModelElement): Action[] {
        return [SelectAction.create({ selectedElementsIDs: [nameable.id] }), CenterAction.create([nameable.id], { retainZoom: true })];
    }
}

export class RevealEdgeElementAutocompleteSuggestionProvider implements IAutocompleteSuggestionProvider {
    async retrieveSuggestions(root: Readonly<GModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const edges = toArray(root.index.all().filter(element => element instanceof GEdge)) as GEdge[];
        return edges.map(edge => ({
            element: edge,
            action: {
                label: `[${edge.type}]  ${this.getEdgeLabel(root, edge)}`,
                actions: this.getActions(edge),
                icon: codiconCSSString('arrow-both')
            }
        }));
    }

    protected getActions(edge: GEdge): Action[] {
        return [SelectAction.create({ selectedElementsIDs: [edge.id] }), CenterAction.create([edge.sourceId, edge.targetId])];
    }
    protected getEdgeLabel(root: Readonly<GModelRoot>, edge: GEdge): string {
        let sourceName = '';
        let targetName = '';

        const sourceNode = root.index.getById(edge.sourceId);
        const targetNode = root.index.getById(edge.targetId);

        if (sourceNode !== undefined) {
            sourceName = name(sourceNode) ?? sourceNode.type;
        }
        if (targetNode !== undefined) {
            targetName = name(targetNode) ?? targetNode.type;
        }

        return sourceName + ' -> ' + targetName;
    }
}
@injectable()
export class SearchAutocompletePalette extends BaseAutocompletePalette {
    static readonly ID = 'search-autocomplete-palette';

    protected cachedSuggestions: AutocompleteSuggestion[] = [];

    id(): string {
        return SearchAutocompletePalette.ID;
    }

    protected override initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);

        this.autocompleteWidget.inputField.placeholder = messages.search.placeholder;
        containerElement.setAttribute('aria-label', messages.search.label);
    }
    protected getSuggestionProviders(root: Readonly<GModelRoot>, input: string): IAutocompleteSuggestionProvider[] {
        return [
            new RevealNamedElementAutocompleteSuggestionProvider(),
            new RevealEdgeElementAutocompleteSuggestionProvider(),
            new RevealNodesWithoutNameAutocompleteSuggestionProvider()
        ];
    }
    protected async retrieveSuggestions(root: Readonly<GModelRoot>, input: string): Promise<LabeledAction[]> {
        const providers = this.getSuggestionProviders(root, input);
        const suggestions = (await Promise.all(providers.map(provider => provider.retrieveSuggestions(root, input)))).flat(1);

        this.cachedSuggestions = suggestions;

        return suggestions.map(s => s.action);
    }

    protected override async visibleSuggestionsChanged(root: Readonly<GModelRoot>, labeledActions: LabeledAction[]): Promise<void> {
        await this.applyCSS(this.getHiddenElements(root, this.getSuggestionsFromLabeledActions(labeledActions)), CSS_SEARCH_HIDDEN);
        await this.deleteCSS(
            this.getSuggestionsFromLabeledActions(labeledActions).map(s => s.element),
            CSS_SEARCH_HIDDEN
        );
    }

    protected override async selectedSuggestionChanged(
        root: Readonly<GModelRoot>,
        labeledAction?: LabeledAction | undefined
    ): Promise<void> {
        await this.deleteAllCSS(root, CSS_SEARCH_HIGHLIGHTED);
        if (labeledAction !== undefined) {
            const suggestions = this.getSuggestionsFromLabeledActions([labeledAction]);

            const actions: RepositionAction[] = [];
            suggestions.map(currElem => actions.push(RepositionAction.create([currElem.element.id])));

            this.actionDispatcher.dispatchAll(actions);
            await this.applyCSS(
                suggestions.map(s => s.element),
                CSS_SEARCH_HIGHLIGHTED
            );
        }
    }

    public override show(root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
        this.actionDispatcher.dispatch(SelectAllAction.create(false));

        super.show(root, ...contextElementIds);
    }

    public override hide(): void {
        if (this.root !== undefined) {
            this.deleteAllCSS(this.root, CSS_SEARCH_HIDDEN);
            this.deleteAllCSS(this.root, CSS_SEARCH_HIGHLIGHTED);
            this.autocompleteWidget.inputField.value = '';
        }

        super.hide();
    }

    protected applyCSS(elements: GModelElement[], cssClass: string): Promise<void> {
        const actions = elements.map(element => applyCssClasses(element, cssClass));
        return this.actionDispatcher.dispatchAll(actions);
    }

    protected deleteCSS(elements: GModelElement[], cssClass: string): Promise<void> {
        const actions = elements.map(element => deleteCssClasses(element, cssClass));
        return this.actionDispatcher.dispatchAll(actions);
    }

    protected deleteAllCSS(root: Readonly<GModelRoot>, cssClass: string): Promise<void> {
        const actions = toArray(root.index.all().map(element => deleteCssClasses(element, cssClass)));
        return this.actionDispatcher.dispatchAll(actions);
    }

    protected getSuggestionsFromLabeledActions(labeledActions: LabeledAction[]): AutocompleteSuggestion[] {
        return this.cachedSuggestions.filter(c => labeledActions.find(s => isEqual(s, c.action)));
    }

    protected getHiddenSuggestionsFromLabeledActions(labeledActions: LabeledAction[]): AutocompleteSuggestion[] {
        return this.cachedSuggestions.filter(c => !labeledActions.find(s => isEqual(s, c.action)));
    }

    protected getHiddenElements(root: Readonly<GModelRoot>, suggestions: AutocompleteSuggestion[]): GModelElement[] {
        return toArray(
            root.index
                .all()
                .filter(element => element instanceof GNode || element instanceof GEdge)
                .filter(element => suggestions.find(suggestion => suggestion.element.id === element.id) === undefined)
        );
    }
}
