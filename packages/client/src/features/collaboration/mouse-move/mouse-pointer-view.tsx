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
import {MousePointer} from '../model';
import {ShapeView} from 'sprotty/lib';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class MousePointerView extends ShapeView {
    override render(node: MousePointer, _context: RenderingContext): VNode {
        const graph = (
            <g>
                <g transform="translate(-8.3, -7.3)">
                    <polygon fill="#FFFFFF" points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6 "/>
                    <polygon fill="#FFFFFF" points="17.3,21.6 13.7,23.1 9,12 12.7,10.5 "/>
                    <rect fill={node.color} x="12.5" y="13.6" transform="matrix(0.9221 -0.3871 0.3871 0.9221 -5.7605 6.5909)" width="2" height="8"/>
                    <polygon fill={node.color} points="9.2,7.3 9.2,18.5 12.2,15.6 12.6,15.5 17.4,15.5 "/>
                </g>
                <text class-mouse-pointer-text={true} style={{ fill: node.color }} transform="translate(0,30)">{ node.name }</text>
            </g>
        );
        return graph;
    }
}
