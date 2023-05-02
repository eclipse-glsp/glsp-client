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
import {ViewportRect} from '../model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class ViewportRectView extends ShapeView {
    override render(node: ViewportRect, _context: RenderingContext): VNode {
        const graph = (
            <g>
                <rect stroke={node.color} width={node.bounds.width} height={node.bounds.height} rx={2} ry={2}
                      style-stroke-width={3} style-vector-effect='non-scaling-stroke' fill="none"></rect>
            </g>
        );
        return graph;
    }
}
