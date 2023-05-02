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
/* eslint-disable max-len */
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { RenderingContext, svg } from 'sprotty';
import {ShapeView} from 'sprotty/lib';
import {SelectionIcon} from './model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class SelectionIconView extends ShapeView {
    override render(node: SelectionIcon, _context: RenderingContext): VNode {
        const selectionIconIdx = node.parent.children
            .filter(c => c instanceof SelectionIcon)
            .indexOf(node);
        const translate = 'translate(' + (12 * selectionIconIdx) + ',-5)';
        const graph = (
            <g>
                <g transform={translate}>
                    <circle r={5} cx={5} cy={5} fill={node.color} style-fill-opacity={0.5} stroke={node.color} style-stroke-width={1}></circle>
                </g>
            </g>
        );
        return graph;
    }
}
