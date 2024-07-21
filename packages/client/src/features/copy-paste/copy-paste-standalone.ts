/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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

import { Disposable, DisposableCollection, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional, preDestroy } from 'inversify';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { ICopyPasteHandler } from './copy-paste-handler';
/**
 * Startup service to hook up the copy&paste event handler
 */
@injectable()
export class CopyPasteStartup implements IDiagramStartup, Disposable {
    @inject(TYPES.ICopyPasteHandler)
    @optional()
    protected copyPasteHandler?: ICopyPasteHandler;

    protected toDispose = new DisposableCollection();

    postModelInitialization(): void {
        if (!this.copyPasteHandler) {
            return;
        }
        const copyListener = (e: ClipboardEvent): void => {
            this.copyPasteHandler?.handleCopy(e);
        };
        const cutListener = (e: ClipboardEvent): void => {
            this.copyPasteHandler?.handleCut(e);
        };
        const pasteListener = (e: ClipboardEvent): void => {
            this.copyPasteHandler?.handlePaste(e);
        };
        window.addEventListener('copy', copyListener);
        window.addEventListener('cut', cutListener);
        window.addEventListener('paste', pasteListener);

        this.toDispose.push(
            Disposable.create(() => {
                window.removeEventListener('copy', copyListener);
                window.removeEventListener('cut', cutListener);
                window.removeEventListener('paste', pasteListener);
            })
        );
    }

    @preDestroy()
    dispose(): void {
        this.toDispose.dispose();
    }
}
