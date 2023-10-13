/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
    Disposable,
    DisposableCollection,
    GModelElement,
    KeyListener,
    TYPES,
    ViewerOptions,
    matchesKeystroke
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, preDestroy } from 'inversify';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { InvokeCopyPasteAction } from './copy-paste-context-menu';
import { ICopyPasteHandler } from './copy-paste-handler';
/**
 * Startup service to hook up the copy&paste event handler
 */
@injectable()
export class CopyPasteStartup implements IDiagramStartup, Disposable {
    @inject(TYPES.ICopyPasteHandler)
    @optional()
    protected copyPasteHandler?: ICopyPasteHandler;

    @inject(TYPES.ViewerOptions)
    protected options: ViewerOptions;

    protected toDispose = new DisposableCollection();

    postModelInitialization(): void {
        const baseDiv = document.getElementById(this.options.baseDiv);

        if (!this.copyPasteHandler || !baseDiv) {
            return;
        }
        const copyListener = (e: ClipboardEvent): void => {
            this.copyPasteHandler?.handleCopy(e);
            e.preventDefault();
        };
        const cutListener = (e: ClipboardEvent): void => {
            this.copyPasteHandler?.handleCut(e);
            e.preventDefault();
        };
        const pasteListener = (e: ClipboardEvent): void => {
            this.copyPasteHandler?.handlePaste(e);
            e.preventDefault();
        };
        baseDiv.addEventListener('copy', copyListener);
        baseDiv.addEventListener('cut', cutListener);
        baseDiv.addEventListener('paste', pasteListener);

        this.toDispose.push(
            Disposable.create(() => {
                baseDiv.removeEventListener('copy', copyListener);
                baseDiv.removeEventListener('cut', cutListener);
                baseDiv.removeEventListener('paste', pasteListener);
            })
        );
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }
}

@injectable()
export class CopyPasteKeyListener extends KeyListener {
    override keyDown(_element: GModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyC', 'ctrlCmd')) {
            return [InvokeCopyPasteAction.create('copy')];
        }
        if (matchesKeystroke(event, 'KeyV', 'ctrlCmd')) {
            return [InvokeCopyPasteAction.create('paste')];
        }
        if (matchesKeystroke(event, 'KeyX', 'ctrlCmd')) {
            return [InvokeCopyPasteAction.create('cut')];
        }
        return [];
    }
}
