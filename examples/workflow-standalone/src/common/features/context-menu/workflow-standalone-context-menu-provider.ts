/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import { TaskEditor, isTaskNode } from '@eclipse-glsp-examples/workflow-glsp';
import {
    ClientMenuItem,
    EditorContextService,
    GIssueMarker,
    GModelRoot,
    GParentElement,
    IContextMenuItemProvider,
    LazyInjector,
    NavigateAction,
    NavigateToMarkerAction,
    Point,
    SetUIExtensionVisibilityAction
} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';

@injectable()
export class WorkflowStandaloneContextMenuProvider implements IContextMenuItemProvider {
    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    protected get editorContext(): EditorContextService {
        return this.lazyInjector.get(EditorContextService);
    }
    getItems(root: Readonly<GModelRoot>, lastMousePosition?: Point): Promise<ClientMenuItem[]> {
        const goToChildren: ClientMenuItem[] = [
            {
                id: 'next node',
                label: 'Next node',
                actions: [NavigateAction.create('next')],
                isEnabled: () => this.editorContext.selectedElements.filter(isTaskNode).length === 1
            },
            {
                id: 'previous node',
                label: 'Previous node',
                actions: [NavigateAction.create('previous')],
                isEnabled: () => this.editorContext.selectedElements.filter(isTaskNode).length === 1
            },
            {
                id: 'next-marker',
                label: 'Go to Next Marker',
                actions: [NavigateToMarkerAction.create({ direction: 'next' })],
                isEnabled: () => collectIssueMarkers(root).length > 0
            },
            {
                id: 'previous-marker',
                label: 'Go to Previous Marker',
                actions: [NavigateToMarkerAction.create({ direction: 'previous' })],
                isEnabled: () => collectIssueMarkers(root).length > 0
            }
        ];
        const goTo: ClientMenuItem = {
            id: 'go-to',
            label: 'Go To',
            actions: [],
            children: goToChildren
        };

        const selectedTasks = this.editorContext.selectedElements.filter(isTaskNode);
        const editTask: ClientMenuItem = {
            id: 'edit-task',
            label: 'Edit task',
            group: 'edit',
            actions:
                selectedTasks.length === 1
                    ? [
                          SetUIExtensionVisibilityAction.create({
                              extensionId: TaskEditor.ID,
                              visible: true,
                              contextElementsId: [selectedTasks[0].id]
                          })
                      ]
                    : [],
            isEnabled: () => !this.editorContext.isReadonly && selectedTasks.length === 1
        };

        return Promise.resolve([editTask, goTo]);
    }
}

export function collectIssueMarkers(root: GParentElement): GIssueMarker[] {
    const markers = [];
    for (const child of root.children) {
        if (child instanceof GIssueMarker) {
            markers.push(child);
        }
        markers.push(...collectIssueMarkers(child));
    }
    return markers;
}
