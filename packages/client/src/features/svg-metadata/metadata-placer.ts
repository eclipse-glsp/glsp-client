/********************************************************************************
 * Copyright (c) 2020-2022 EclipseSource and others.
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
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { IVNodePostprocessor, SChildElement, SEdge, setAttr, SModelElement } from 'sprotty';

@injectable()
export class MetadataPlacer implements IVNodePostprocessor {
    decorate(vnode: VNode, element: SModelElement): VNode {
        setAttr(vnode, 'data-type', element.type);

        if (element instanceof SChildElement) {
            setAttr(vnode, 'data-parent', element.parent.id);
        }
        if (element instanceof SEdge) {
            setAttr(vnode, 'data-source', element.sourceId);
            setAttr(vnode, 'data-target', element.targetId);
        }
        return vnode;
    }

    postUpdate(): void {
        // empty
    }
}
