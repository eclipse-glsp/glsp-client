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

import { bindAsService, FeatureModule, TYPES } from '@eclipse-glsp/sprotty';
import '../../../css/search.css';
import { SearchAutocompletePalette } from './search-palette';
import { SearchPaletteKeyListener } from './search-palette-key-listener';
import { RevealEdgeElementSuggestionProvider } from './suggestions/edge-element-suggestions';
import { NodesWithoutNameSuggestionProvider, RevealNamedElementSuggestionProvider } from './suggestions/named-element-suggestions';

export const searchPaletteModule = new FeatureModule(
    (bind, _unbind, isBound, rebind) => {
        const context = { bind, isBound, rebind };
        bindAsService(context, TYPES.IUIExtension, SearchAutocompletePalette);
    },
    { featureId: Symbol('searchPalette') }
);

export const searchPaletteDefaultSuggestionsModule = new FeatureModule(
    (bind, _unbind, isBound, rebind) => {
        const context = { bind, isBound, rebind };
        bindAsService(context, TYPES.IAutocompleteSuggestionProvider, RevealNamedElementSuggestionProvider);
        bindAsService(context, TYPES.IAutocompleteSuggestionProvider, NodesWithoutNameSuggestionProvider);
        bindAsService(context, TYPES.IAutocompleteSuggestionProvider, RevealEdgeElementSuggestionProvider);
    },
    { featureId: Symbol('searchPaletteDefaultSuggestions'), requires: searchPaletteModule }
);

export const standaloneSearchPaletteModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        const context = { bind, isBound };
        bindAsService(context, TYPES.KeyListener, SearchPaletteKeyListener);
    },
    { featureId: Symbol('standaloneSearchPalette'), requires: searchPaletteModule }
);
