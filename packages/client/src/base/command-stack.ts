/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
    SetModelCommand,
    TYPES,
    UpdateModelCommand
} from '@eclipse-glsp/sprotty';
import { inject, injectable, preDestroy } from 'inversify';
import { EditorContextService } from './editor-context-service';
import { IServiceProvider } from './service-provider';

@injectable()
export class GLSPCommandStack extends CommandStack implements Disposable {
    @inject(TYPES.IServiceProvider)
    protected serviceProvider: IServiceProvider;

    protected toDispose = new DisposableCollection();

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }

    get editorContext(): EditorContextService {
        return this.serviceProvider.get(EditorContextService);
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

    override execute(command: ICommand): Promise<GModelRoot> {
        const result = super.execute(command);
        if (command instanceof SetModelCommand || command instanceof UpdateModelCommand) {
            result.then(root => this.notifyListeners(root));
        }
        return result;
    }

    protected notifyListeners(root: Readonly<GModelRoot>): void {
        this.editorContext.notifyModelRootChanged(root, this);
    }
}
