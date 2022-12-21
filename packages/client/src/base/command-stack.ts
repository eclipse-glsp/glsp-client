/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { RedoAction, UndoAction } from '@eclipse-glsp/protocol';
import { inject, injectable } from 'inversify';
import { CommandStack, IActionDispatcher, SModelRoot } from 'sprotty';
import { TYPES } from './types';

@injectable()
export class GLSPCommandStack extends CommandStack {
    @inject(TYPES.IActionDispatcherProvider) protected actionDispatcher: () => Promise<IActionDispatcher>;

    override undo(): Promise<SModelRoot> {
        this.actionDispatcher().then(dispatcher => dispatcher.dispatch(UndoAction.create()));
        return this.thenUpdate();
    }

    override redo(): Promise<SModelRoot> {
        this.actionDispatcher().then(dispatcher => dispatcher.dispatch(RedoAction.create()));
        return this.thenUpdate();
    }
}
