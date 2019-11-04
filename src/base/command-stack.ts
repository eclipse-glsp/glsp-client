/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable } from "inversify";
import { CommandStack, IActionDispatcher, SModelRoot, TYPES } from "sprotty/lib";

import { GlspRedoAction, GlspUndoAction } from "../features/undo-redo/model";

@injectable()
export class GLSPCommandStack extends CommandStack {

    @inject(TYPES.IActionDispatcherProvider) protected actionDispatcher: () => Promise<IActionDispatcher>;

    undo(): Promise<SModelRoot> {
        this.actionDispatcher().then(dispatcher => dispatcher.dispatch(new GlspUndoAction()));
        return this.thenUpdate();
    }

    redo(): Promise<SModelRoot> {
        this.actionDispatcher().then(dispatcher => dispatcher.dispatch(new GlspRedoAction()));
        return this.thenUpdate();
    }
}

