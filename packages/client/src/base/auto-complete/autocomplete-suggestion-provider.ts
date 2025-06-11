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

import { GModelRoot, InstanceRegistry, TYPES, type GModelElement, type LabeledAction } from '@eclipse-glsp/sprotty';
import { injectable, multiInject } from 'inversify';

/**
 * Interface for autocomplete suggestions.
 */
export interface AutocompleteSuggestion {
    element?: GModelElement;
    action: LabeledAction;
}

/**
 * A provider for autocomplete suggestions.
 */
export interface IAutocompleteSuggestionProvider {
    id: string;

    /**
     * Returns whether this provider can handle the given autocomplete context.
     * @param context The context to check.
     */
    canHandle(context: string): boolean;

    /**
     * Provides suggestions for the given input
     */
    getSuggestions(root: Readonly<GModelRoot>, text: string, context?: unknown): Promise<AutocompleteSuggestion[]>;
}

/**
 * Default contexts for autocomplete suggestions.
 */
export namespace AutocompleteSuggestionProviderContext {
    export const CANVAS = 'canvas' as const;
}

/**
 * Registry for autocomplete suggestion providers.
 */
export interface AutocompleteSuggestionRegistry extends InstanceRegistry<IAutocompleteSuggestionProvider> {
    providersForContext(context: string[]): IAutocompleteSuggestionProvider[];
}

@injectable()
export class DefaultAutocompleteSuggestionRegistry
    extends InstanceRegistry<IAutocompleteSuggestionProvider>
    implements AutocompleteSuggestionRegistry
{
    constructor(
        @multiInject(TYPES.IAutocompleteSuggestionProvider)
        suggestionProviders: IAutocompleteSuggestionProvider[]
    ) {
        super();
        suggestionProviders.forEach(provider => {
            this.register(provider.id, provider);
        });
    }

    providersForContext(searchContext: string[]): IAutocompleteSuggestionProvider[] {
        return Array.from(this.elements.values()).filter(provider => searchContext.some(c => provider.canHandle(c)));
    }
}
