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
import {
    CommandStack,
    Disposable,
    DisposableCollection,
    Event,
    GModelRoot,
    ICommand,
    LazyInjector,
    SetModelCommand,
    UpdateModelCommand
} from '@eclipse-glsp/sprotty';
import { inject, injectable, preDestroy } from 'inversify';
import { EditorContextService } from './editor-context-service';

@injectable()
export class GLSPCommandStack extends CommandStack implements Disposable {
    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;
    protected toDispose = new DisposableCollection();

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }

    // Use lazyInjector to resolve circular dependency
    //  GLSPActionDispatcher --> GLSPCommandStack --> EditorContextService --> GLSPActionDispatcher
    get editorContext(): EditorContextService {
        return this.lazyInjector.get(EditorContextService);
    }

    /**
     * @deprecated Use the `EditorContext.onModelRootChanged` event instead
     */
    get onModelRootChanged(): Event<Readonly<GModelRoot>> {
        return this.editorContext.onModelRootChanged;
    }

    override undo(): Promise<GModelRoot> {
        this.logger.warn(
            this,
            'GLSPCommandStack.undo() was called. This should never happen as the GLSP server is responsible for handling undo requests'
        );
        return this.currentModel;
    }

    override redo(): Promise<GModelRoot> {
        this.logger.warn(
            this,
            'GLSPCommandStack.redo() was called. This should never happen as the GLSP server is responsible for handling redo requests'
        );
        return this.currentModel;
    }

    override async execute(command: ICommand): Promise<GModelRoot> {
        if (command instanceof SetModelCommand || command instanceof UpdateModelCommand) {
            const result = await super.execute(command);
            this.notifyListeners(result);
            return result;
        }

        return super.execute(command);
    }

    protected notifyListeners(root: Readonly<GModelRoot>): void {
        this.editorContext.notifyModelRootChanged(root, this);
    }
}
