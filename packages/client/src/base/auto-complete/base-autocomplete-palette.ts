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

import { Action, GModelRoot, IActionDispatcher, LabeledAction, TYPES } from '@eclipse-glsp/sprotty';
import { inject } from 'inversify';
import '../../../css/autocomplete-palette.css';
import { GLSPAbstractUIExtension } from '../ui-extension/ui-extension';
import { AutoCompleteWidget, CloseReason, toActionArray } from './auto-complete-widget';
import { messages } from '../messages';

/**
 * A reusable base implementation for `UIExtensions` that want to provide autocomplete functionality
 * using the {@link AutoCompleteWidget}.
 *
 */
export abstract class BaseAutocompletePalette extends GLSPAbstractUIExtension {
    protected readonly autoSuggestionSettings = {
        noSuggestionsMessage: messages.autocomplete.no_suggestions,
        suggestionsClass: 'command-palette-suggestions',
        debounceWaitMs: 50,
        showOnFocus: true
    };

    protected root?: Readonly<GModelRoot>;
    protected autocompleteWidget: AutoCompleteWidget;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    containerClass(): string {
        return 'autocomplete-palette';
    }

    override show(root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
        super.show(root, ...contextElementIds);
        this.root = root;
        this.autocompleteWidget.open(root);
    }

    override hide(): void {
        this.autocompleteWidget?.dispose();
        this.root = undefined;
        super.hide();
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.classList.add('command-palette');

        this.autocompleteWidget = new AutoCompleteWidget(
            this.autoSuggestionSettings,
            { provideSuggestions: input => this.retrieveSuggestions(this.root!, input) },
            { executeFromSuggestion: input => this.executeSuggestion(input) },
            reason => this.autocompleteHide(reason),
            this.logger,
            {
                visibleSuggestionsChanged: suggestions => this.visibleSuggestionsChanged(this.root!, suggestions),
                selectedSuggestionChanged: suggestion => this.selectedSuggestionChanged(this.root!, suggestion)
            }
        );
        this.autocompleteWidget.initialize(containerElement);
    }

    protected abstract retrieveSuggestions(root: Readonly<GModelRoot>, input: string): Promise<LabeledAction[]>;

    protected async visibleSuggestionsChanged(root: Readonly<GModelRoot>, labeledActions: LabeledAction[]): Promise<void> {
        return;
    }

    protected async selectedSuggestionChanged(root: Readonly<GModelRoot>, labeledAction?: LabeledAction): Promise<void> {
        return;
    }

    protected autocompleteHide(reason: CloseReason): void {
        this.hide();
    }

    protected executeSuggestion(input: LabeledAction | Action[] | Action): void {
        this.actionDispatcher.dispatchAll(toActionArray(input));
    }
}
