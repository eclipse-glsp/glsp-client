/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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
    codiconCSSString,
    CreateEdgeOperation,
    GModelElement,
    GModelRoot,
    IActionHandler,
    isConnectable,
    LabeledAction,
    name,
    SetUIExtensionVisibilityAction,
    toArray,
    TriggerEdgeCreationAction
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { CloseReason, toActionArray } from '../../../base/auto-complete/auto-complete-widget';
import { IAutocompleteSuggestionProvider, type AutocompleteSuggestion } from '../../../base/auto-complete/autocomplete-suggestion-provider';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { GEdge } from '../../../model';
import { SearchAutocompletePalette, SearchAutocompleteSuggestion } from '../../search-palette/search-palette';
import { SetEdgeTargetSelectionAction } from './action';

export namespace EdgeAutocompletePaletteMetadata {
    export const ID = 'edge-autocomplete-palette';
}

export interface EdgeAutocompleteContext {
    role: 'source' | 'target';
    triggerAction: TriggerEdgeCreationAction;
    sourceId?: string;
    targetId?: string;
}

@injectable()
export class EdgeAutocompletePalette extends SearchAutocompletePalette implements IActionHandler {
    protected edgeAutocompleteContext?: EdgeAutocompleteContext;

    override id(): string {
        return EdgeAutocompletePaletteMetadata.ID;
    }

    override get searchContext(): string[] {
        return [EdgeAutocompletePaletteMetadata.ID];
    }

    handle(action: Action): Action | void {
        if (TriggerEdgeCreationAction.is(action)) {
            this.edgeAutocompleteContext = {
                triggerAction: action,
                role: 'source'
            };
        }
    }

    protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
        super.onBeforeShow(containerElement, root, ...contextElementIds);

        this.autocompleteWidget.inputField.placeholder = `Search for ${this.edgeAutocompleteContext?.role} elements`;
    }

    protected reload(): void {
        const context = this.edgeAutocompleteContext;
        this.hide();
        this.edgeAutocompleteContext = context;
        this.actionDispatcher.dispatch(
            SetUIExtensionVisibilityAction.create({
                extensionId: EdgeAutocompletePaletteMetadata.ID,
                visible: true
            })
        );
    }

    protected override async provideSearchSuggestions(root: Readonly<GModelRoot>, input: string): Promise<SearchAutocompleteSuggestion[]> {
        return (
            await Promise.all(
                this.suggestionRegistry
                    .providersForContext(this.searchContext)
                    .flatMap(provider => provider.getSuggestions(root, input, this.edgeAutocompleteContext))
            )
        )
            .flat(1)
            .filter(SearchAutocompleteSuggestion.is);
    }

    protected override executeSuggestion(input: LabeledAction | Action[] | Action): void {
        const action = toActionArray(input)[0] as SetEdgeTargetSelectionAction;

        if (this.edgeAutocompleteContext?.role === 'source') {
            this.edgeAutocompleteContext.sourceId = action.elementId;
            this.edgeAutocompleteContext.role = 'target';
            this.reload();
        } else if (this.edgeAutocompleteContext?.role === 'target') {
            this.edgeAutocompleteContext.targetId = action.elementId;
        }
        if (this.edgeAutocompleteContext?.sourceId !== undefined && this.edgeAutocompleteContext?.targetId !== undefined) {
            this.actionDispatcher.dispatchAll([
                CreateEdgeOperation.create({
                    elementTypeId: this.edgeAutocompleteContext.triggerAction.elementTypeId,
                    sourceElementId: this.edgeAutocompleteContext.sourceId,
                    targetElementId: this.edgeAutocompleteContext.targetId,
                    args: this.edgeAutocompleteContext.triggerAction.args
                }),
                EnableDefaultToolsAction.create()
            ]);
            this.hide();
        }
    }

    protected override autocompleteHide(reason: CloseReason): void {
        if (reason !== 'submission') {
            this.hide();
        }
    }
}

@injectable()
export class SetEdgeTargetGridSuggestionProvider implements IAutocompleteSuggestionProvider {
    id = 'glsp.set-edge-target-autocomplete-suggestions';

    canHandle(searchContext: string): boolean {
        return searchContext === EdgeAutocompletePaletteMetadata.ID;
    }

    async getSuggestions(root: Readonly<GModelRoot>, text: string, context: EdgeAutocompleteContext): Promise<AutocompleteSuggestion[]> {
        if (context === undefined) {
            return [];
        }

        const proxyEdge = new GEdge();
        proxyEdge.type = context.triggerAction.elementTypeId;

        const nodes = toArray(root.index.all().filter(element => this.isAllowedSource(proxyEdge, element, context.role))) as GEdge[];
        return nodes.map(node => ({
            element: node,
            action: {
                label: `[${node.type}] ${name(node) ?? '<no-name>'}`,
                actions: [SetEdgeTargetSelectionAction.create(node.id, context.role)],
                icon: codiconCSSString('arrow-both')
            }
        }));
    }

    protected isAllowedSource(proxyEdge: GEdge, element: GModelElement | undefined, role: 'source' | 'target'): boolean {
        return element !== undefined && proxyEdge !== undefined && isConnectable(element) && element.canConnect(proxyEdge, role);
    }
}
