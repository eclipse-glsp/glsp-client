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

import { GModelElement, GModelRoot, GNode, LabeledAction, SelectAllAction, toArray, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { debounce, isEqual } from 'lodash';
import {
    AutocompleteSuggestionProviderContext,
    type AutocompleteSuggestion,
    type AutocompleteSuggestionRegistry
} from '../../base/auto-complete/autocomplete-suggestion-provider';
import { BaseAutocompletePalette } from '../../base/auto-complete/base-autocomplete-palette';
import { applyCssClasses, deleteCssClasses } from '../../base/feedback/css-feedback';
import { messages } from '../../base/messages';
import { GEdge } from '../../model';
import { RepositionAction } from '../viewport/reposition';

const CSS_SEARCH_HIDDEN = 'search-hidden';
const CSS_SEARCH_HIGHLIGHTED = 'search-highlighted';

export interface SearchAutocompleteSuggestion extends Required<AutocompleteSuggestion> {}

export namespace SearchAutocompleteSuggestion {
    export function is(suggestion: AutocompleteSuggestion): suggestion is SearchAutocompleteSuggestion {
        return suggestion.element !== undefined;
    }
}

@injectable()
export class SearchAutocompletePalette extends BaseAutocompletePalette {
    static readonly ID: string = 'glsp.search-autocomplete-palette';

    @inject(TYPES.IAutocompleteSuggestionProviderRegistry)
    protected readonly suggestionRegistry: AutocompleteSuggestionRegistry;

    /**
     * Cache the suggestions so that we don't have to retrieve them again for CSS manipulation.
     */
    protected cachedSuggestions: SearchAutocompleteSuggestion[] = [];

    id(): string {
        return SearchAutocompletePalette.ID;
    }

    /**
     * The search context for the search palette. This is used to filter the suggestions
     */
    get searchContext(): string[] {
        return [AutocompleteSuggestionProviderContext.CANVAS];
    }

    protected override initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);

        this.autocompleteWidget.inputField.placeholder = messages.search.placeholder;
        containerElement.setAttribute('aria-label', messages.search.label);
    }

    protected async retrieveSuggestions(root: Readonly<GModelRoot>, input: string): Promise<LabeledAction[]> {
        const suggestions = await this.provideSearchSuggestions(root, input);
        this.cachedSuggestions = suggestions;
        return suggestions.map(s => s.action);
    }

    protected async provideSearchSuggestions(root: Readonly<GModelRoot>, input: string): Promise<SearchAutocompleteSuggestion[]> {
        return (
            await Promise.all(
                this.suggestionRegistry.providersForContext(this.searchContext).flatMap(provider => provider.getSuggestions(root, input))
            )
        )
            .flat(1)
            .filter(SearchAutocompleteSuggestion.is);
    }

    protected override async visibleSuggestionsChanged(root: Readonly<GModelRoot>, labeledActions: LabeledAction[]): Promise<void> {
        await this.applyCSS(this.getHiddenElements(root, this.getSuggestionsFromLabeledActions(labeledActions)), CSS_SEARCH_HIDDEN);
        await this.deleteCSS(
            this.getSuggestionsFromLabeledActions(labeledActions)
                .filter(s => s.element)
                .map(s => s.element!),
            CSS_SEARCH_HIDDEN
        );
    }

    protected override async selectedSuggestionChanged(
        root: Readonly<GModelRoot>,
        labeledAction?: LabeledAction | undefined
    ): Promise<void> {
        await this.handleSuggestionChanged(root, labeledAction);
    }

    protected readonly handleSuggestionChanged = debounce(this.doHandleSuggestionChanged, 300, { trailing: true });
    protected async doHandleSuggestionChanged(root: Readonly<GModelRoot>, labeledAction?: LabeledAction | undefined): Promise<void> {
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

    override show(root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
        this.actionDispatcher.dispatch(SelectAllAction.create(false));

        super.show(root, ...contextElementIds);
    }

    override hide(): void {
        if (this.root !== undefined) {
            this.deleteAllCSS(this.root, CSS_SEARCH_HIDDEN, CSS_SEARCH_HIGHLIGHTED);
            this.autocompleteWidget.inputField.value = '';
        }

        super.hide();
    }

    protected applyCSS(elements: GModelElement[], ...add: string[]): Promise<void> {
        const actions = elements.map(element => applyCssClasses(element, ...add));
        return this.actionDispatcher.dispatchAll(actions);
    }

    protected deleteCSS(elements: GModelElement[], ...remove: string[]): Promise<void> {
        const actions = elements.map(element => deleteCssClasses(element, ...remove));
        return this.actionDispatcher.dispatchAll(actions);
    }

    protected deleteAllCSS(root: Readonly<GModelRoot>, ...remove: string[]): Promise<void> {
        const actions = toArray(root.index.all().map(element => deleteCssClasses(element, ...remove)));
        return this.actionDispatcher.dispatchAll(actions);
    }

    protected getSuggestionsFromLabeledActions(labeledActions: LabeledAction[]): SearchAutocompleteSuggestion[] {
        return this.cachedSuggestions.filter(c => labeledActions.find(s => isEqual(s, c.action)));
    }

    protected getHiddenElements(root: Readonly<GModelRoot>, suggestions: SearchAutocompleteSuggestion[]): GModelElement[] {
        return toArray(
            root.index
                .all()
                .filter(element => element instanceof GNode || element instanceof GEdge)
                .filter(element => suggestions.find(suggestion => suggestion.element.id === element.id) === undefined)
        );
    }
}
