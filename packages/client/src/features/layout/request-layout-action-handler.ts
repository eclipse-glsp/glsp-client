/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
import { Action, isViewport, LayoutOperation, RequestLayoutAction } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';

/**
 * The handler for {@link RequestLayoutAction}s.
 * This handler returns an enriched LayoutOperation with the canvasBounds and viewport information.
 */
@injectable()
export class RequestLayoutActionHandler {
    @inject(EditorContextService)
    protected editorContext?: EditorContextService;

    handle(action: RequestLayoutAction): Action | void {
        if (this.editorContext) {
            const root = this.editorContext.modelRoot;
            if (isViewport(root)) {
                return LayoutOperation.create([], root.canvasBounds, root);
            }
        }

        return LayoutOperation.create();
    }
}
