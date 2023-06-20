/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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

import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { DOMHelper, IVNodePostprocessor, SChildElement, SEdge, SModelElement, SModelRoot, TYPES, setAttr } from '~glsp-sprotty';

@injectable()
export class MetadataPlacer implements IVNodePostprocessor {
    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;

    decorate(vnode: VNode, element: SModelElement): VNode {
        if (element instanceof SModelRoot) {
            setAttr(vnode, 'data-svg-metadata-api', true);
        }

        setAttr(vnode, 'data-svg-metadata-type', element.type);

        if (element instanceof SChildElement) {
            setAttr(vnode, 'data-svg-metadata-parent-id', this.domHelper.createUniqueDOMElementId(element.parent));
        }
        if (element instanceof SEdge) {
            if (element.source !== undefined) {
                setAttr(vnode, 'data-svg-metadata-edge-source-id', this.domHelper.createUniqueDOMElementId(element.source));
            }
            if (element.target !== undefined) {
                setAttr(vnode, 'data-svg-metadata-edge-target-id', this.domHelper.createUniqueDOMElementId(element.target));
            }
        }
        return vnode;
    }

    postUpdate(): void {
        // empty
    }
}
