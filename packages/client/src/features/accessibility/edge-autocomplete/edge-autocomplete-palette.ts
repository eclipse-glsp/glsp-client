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
import { injectable } from 'inversify';
import {
    codiconCSSString,
    isConnectable,
    SEdge,
    SModelElement,
    SModelRoot,
    LabeledAction,
    name,
    SetUIExtensionVisibilityAction,
    IActionHandler,
    Action,
    CreateEdgeOperation,
    TriggerEdgeCreationAction
} from '~glsp-sprotty';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { toArray } from 'sprotty/lib/utils/iterable';
import { EdgeAutocompleteContext } from './edge-autocomplete-context';
import { SearchAutocompletePalette } from '../search/search-palette';
import { AutocompleteSuggestion, IAutocompleteSuggestionProvider } from '../../autocomplete-palette/autocomplete-suggestion-providers';
import { SetEdgeTargetSelectionAction } from './action';
import { CloseReason, toActionArray } from '../../../base/auto-complete/auto-complete-widget';

export namespace EdgeAutocompletePaletteMetadata {
    export const ID = 'edge-autocomplete-palette';
}

@injectable()
export class EdgeAutocompletePalette extends SearchAutocompletePalette implements IActionHandler {
    protected context?: EdgeAutocompleteContext;

    protected readonly targetSuggestionProvider = new PossibleEdgeTargetAutocompleteSuggestionProvider();

    override id(): string {
        return EdgeAutocompletePaletteMetadata.ID;
    }

    handle(action: Action): Action | void {
        if (TriggerEdgeCreationAction.is(action)) {
            this.context = {
                trigger: action,
                role: 'source'
            };
            this.targetSuggestionProvider.setContext(action, this.context);
        }
    }

    protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        super.onBeforeShow(containerElement, root, ...contextElementIds);

        this.autocompleteWidget.inputField.placeholder = `Search for ${this.context?.role} elements`;
    }

    protected override getSuggestionProviders(root: Readonly<SModelRoot>, input: string): IAutocompleteSuggestionProvider[] {
        return [this.targetSuggestionProvider];
    }

    protected reload(): void {
        const context = this.context;
        this.hide();
        this.context = context;
        this.actionDispatcher.dispatch(
            SetUIExtensionVisibilityAction.create({
                extensionId: EdgeAutocompletePaletteMetadata.ID,
                visible: true
            })
        );
    }

    protected override executeSuggestion(input: LabeledAction | Action[] | Action): void {
        const action = toActionArray(input)[0] as SetEdgeTargetSelectionAction;

        if (this.context?.role === 'source') {
            this.context.sourceId = action.elementId;
            this.context.role = 'target';
            this.reload();
        } else if (this.context?.role === 'target') {
            this.context.targetId = action.elementId;
        }
        if (this.context?.sourceId !== undefined && this.context?.targetId !== undefined) {
            this.actionDispatcher.dispatchAll([
                CreateEdgeOperation.create({
                    elementTypeId: this.context.trigger.elementTypeId,
                    sourceElementId: this.context.sourceId,
                    targetElementId: this.context.targetId,
                    args: this.context.trigger.args
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
export class PossibleEdgeTargetAutocompleteSuggestionProvider implements IAutocompleteSuggestionProvider {
    protected proxyEdge?: SEdge;
    protected context?: EdgeAutocompleteContext;

    setContext(triggerAction: TriggerEdgeCreationAction, edgeAutocompleteContext: EdgeAutocompleteContext): void {
        this.proxyEdge = new SEdge();
        this.proxyEdge.type = triggerAction.elementTypeId;
        this.context = edgeAutocompleteContext;
    }

    isAllowedSource(element: SModelElement | undefined, role: 'source' | 'target'): boolean {
        return element !== undefined && this.proxyEdge !== undefined && isConnectable(element) && element.canConnect(this.proxyEdge, role);
    }

    async retrieveSuggestions(root: Readonly<SModelRoot>, text: string): Promise<AutocompleteSuggestion[]> {
        const context = this.context;
        if (this.context === undefined) {
            return [];
        }

        const nodes = toArray(root.index.all().filter(element => this.isAllowedSource(element, context!.role))) as SEdge[];
        return nodes.map(node => ({
            element: node,
            action: {
                label: `[${node.type}] ${name(node) ?? '<no-name>'}`,
                actions: [SetEdgeTargetSelectionAction.create(node.id, context!.role)],
                icon: codiconCSSString('arrow-both')
            }
        }));
    }
}
