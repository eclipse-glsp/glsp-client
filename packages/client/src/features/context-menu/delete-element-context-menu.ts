/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { DeleteElementOperation, GModelRoot, IContextMenuItemProvider, MenuItem, Point, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService, EditorContextServiceProvider } from '../../base/editor-context-service';

@injectable()
export class DeleteElementContextMenuItemProvider implements IContextMenuItemProvider {
    /** @deprecated No longer used. The {@link EditorContextService} is now directly injected.*/
    // eslint-disable-next-line deprecation/deprecation
    @inject(TYPES.IEditorContextServiceProvider) editorContextServiceProvider: EditorContextServiceProvider;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    async getItems(_root: Readonly<GModelRoot>, _lastMousePosition?: Point): Promise<MenuItem[]> {
        return [this.createDeleteMenuItem()];
    }

    protected createDeleteMenuItem(): MenuItem {
        return {
            id: 'delete',
            label: 'Delete',
            sortString: 'd',
            group: 'edit',
            actions: [DeleteElementOperation.create(this.editorContext.selectedElements.map(e => e.id))],
            isEnabled: () => !this.editorContext.isReadonly && this.editorContext.selectedElements.length > 0
        };
    }
}
