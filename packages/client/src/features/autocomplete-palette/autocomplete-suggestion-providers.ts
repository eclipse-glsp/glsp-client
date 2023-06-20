/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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

import { LabeledAction, SModelElement, SModelRoot } from '~glsp-sprotty';

/**
 * Interface for a provider that provides suggestions that can be used to fill the autocomplete
 */
export interface IAutocompleteSuggestionProvider {
    /**
     * Returns the suggestions based on the provided parameters.
     * @param root: The root model
     * @param text: The text input provided by the user.
     */
    retrieveSuggestions(root: Readonly<SModelRoot>, text: string): Promise<AutocompleteSuggestion[]>;
}

/**
 * Interface for autocomplete suggestions.
 */
export interface AutocompleteSuggestion {
    element: SModelElement;
    action: LabeledAction;
}
