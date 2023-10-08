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
import { IView, ViewRegistry } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';

/**
 * Allows to look up the IView for a given GModelElement based on its type.
 */
@injectable()
export class GViewRegistry extends ViewRegistry {
    /* Overwrite the `register` method to only log an info message (instead of thrown an error) if
       an existing registration is overwritten */
    override register(key: string, instance: IView): void {
        if (key === undefined) {
            throw new Error('Key is undefined');
        }
        if (this.hasKey(key)) {
            // do not throw error but log overwriting
            console.log(`View instance for type '${key}' will be overwritten.`);
        }
        this.elements.set(key, instance);
    }
}
