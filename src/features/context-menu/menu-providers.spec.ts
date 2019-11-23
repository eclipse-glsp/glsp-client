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
import 'mocha';
import { expect } from 'chai';
import { ContextMenuProviderRegistry } from './menu-providers';
import { SModelRoot } from 'sprotty';

describe('ContextMenuProviderRegistry', () => {

    it('should return no items if there are no providers', async () => {
        const reg = new ContextMenuProviderRegistry();
        expect(reg.getItems(new SModelRoot())).to.be.empty;
    });

    it('should return no items with empty list of providers', async () => {
        const reg = new ContextMenuProviderRegistry([]);
        expect(reg.getItems(new SModelRoot())).to.be.empty;
    });

    it('should return the union of elements of all providers', async () => {
        const reg = new ContextMenuProviderRegistry([
            {
                getItems(root) {
                    return Promise.resolve([
                        {
                            id: "one",
                            label: "One",
                            actions: []
                        }
                    ]);
                }
            }
        ]);
        expect(await reg.getItems(new SModelRoot())).to.lengthOf(2);
    });

});
