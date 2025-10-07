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
import '../../../../css/keyboard.css';

import { Action, GModelElement, SetUIExtensionVisibilityAction } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { GEdge } from '../../../model';
import { SearchAutocompletePalette } from '../../search-palette/search-palette';
import { RevealEdgeElementSuggestionProvider } from '../../search-palette/suggestions/edge-element-suggestions';
import { RevealNamedElementSuggestionProvider } from '../../search-palette/suggestions/named-element-suggestions';
import { KeyboardGridMetadata } from './constants';

@injectable()
export class GridSearchPalette extends SearchAutocompletePalette {
    static override readonly ID: string = 'glsp.grid-search-palette';

    override id(): string {
        return GridSearchPalette.ID;
    }

    override get searchContext(): string[] {
        return [GridSearchPalette.ID];
    }
}

@injectable()
export class RevealGridEdgeSuggestionProvider extends RevealEdgeElementSuggestionProvider {
    override get id(): string {
        return 'glsp.reveal-grid-edge-suggestion';
    }

    override canHandle(searchContext: string): boolean {
        return searchContext === GridSearchPalette.ID;
    }

    protected override createActions(edge: GEdge): Action[] {
        return [
            ...super.createActions(edge),
            SetUIExtensionVisibilityAction.create({
                extensionId: KeyboardGridMetadata.ID,
                visible: true
            })
        ];
    }
}

@injectable()
export class RevealGridNamedElementSuggestionProvider extends RevealNamedElementSuggestionProvider {
    override get id(): string {
        return 'glsp.reveal-grid-named-element-suggestion';
    }

    override canHandle(searchContext: string): boolean {
        return searchContext === GridSearchPalette.ID;
    }

    protected override createActions(nameable: GModelElement): Action[] {
        return [
            ...super.createActions(nameable),
            SetUIExtensionVisibilityAction.create({
                extensionId: KeyboardGridMetadata.ID,
                visible: true
            })
        ];
    }
}
