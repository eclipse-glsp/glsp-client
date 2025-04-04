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

import { Action, CenterAction, GModelRoot, SelectAction, codiconCSSString, name, toArray } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import {
    AutocompleteSuggestionProviderContext,
    IAutocompleteSuggestionProvider,
    type AutocompleteSuggestion
} from '../../../base/auto-complete/autocomplete-suggestion-provider';
import { GEdge } from '../../../model';

@injectable()
export class RevealEdgeElementSuggestionProvider implements IAutocompleteSuggestionProvider {
    get id(): string {
        return 'glsp.reveal-edge-element-suggestion';
    }

    canHandle(context: string): boolean {
        return context === AutocompleteSuggestionProviderContext.CANVAS;
    }

    async getSuggestions(root: Readonly<GModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const edges = toArray(root.index.all().filter(element => element instanceof GEdge)) as GEdge[];
        return edges.map(edge => ({
            element: edge,
            action: {
                label: `[${edge.type}]  ${this.getEdgeLabel(root, edge)}`,
                actions: this.createActions(edge),
                icon: codiconCSSString('arrow-both')
            }
        }));
    }

    protected createActions(edge: GEdge): Action[] {
        return [
            SelectAction.create({ selectedElementsIDs: [edge.id] }),
            CenterAction.create([edge.sourceId, edge.targetId], { retainZoom: true })
        ];
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
