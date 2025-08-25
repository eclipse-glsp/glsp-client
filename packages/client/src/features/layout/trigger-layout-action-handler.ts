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
import { Action, IActionHandler, ICommand, LayoutOperation, TriggerLayoutAction } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';

/**
 * The handler for {@link TriggerLayoutAction}s.
 * This handler provides some client-level information to the layout operation.
 */
@injectable()
export class TriggerLayoutActionHandler implements IActionHandler {
    @inject(EditorContextService) protected editorContext: EditorContextService;

    handle(action: TriggerLayoutAction): ICommand | Action | void {
        return LayoutOperation.create(this.editorContext.get().selectedElementIds, {
            args: action.args,
            canvasBounds: this.editorContext.canvasBounds,
            viewport: this.editorContext.viewportData
        });
    }
}
