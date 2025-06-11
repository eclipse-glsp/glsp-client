/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
import { Classes, VNode } from 'snabbdom';
import {RenderingContext, ShapeView, SShapeElement, isBoundsAware, isVisible, SArgumentable, svg } from '~glsp-sprotty';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class MultiLineTextNodeView extends ShapeView {
    render(label: Readonly<MultiLineTextNode>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(label, context)) {
            return undefined;
        }
        let nodeWidth=100;
        const parent=label.parent;
        if (isBoundsAware(parent)) {
            nodeWidth=parent.bounds.width;
        }

        // split text into words and lines...
        let line='';
        const lines: string[] = [];
        const words=splitWords(label.args.text);
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            line+=word+ ' ';
            if (line.length>(nodeWidth/6)) { // very naive approach ;-) 
                line=line.substring(0,line.length-word.length-2);
                lines.push(line);
                line=word +' ';
            }
        }
        lines.push(line); // last line

        // depending on the attribute 'align' we move the text element into the center
        let xOffset=5;
        if (label.args.align==='middle') {
            xOffset= nodeWidth*0.5;
        }
        const vnode = <g class-sprotty-node={label instanceof SNode}>
            <text class-sprotty-label={true} transform={'translate(' + xOffset + ',0)'}>
                {lines!.map((_line , _index)  => (
                   <tspan x="0" dy={_index===0?10:15}>{_line}</tspan>
                ))}
            </text>
        </g>;

        const subType = getSubType(label);
        if (subType) {
            setAttr(vnode, 'class', subType);
        }
        return vnode;
    }
}

function splitWords(text: any): string {
    return text.split(' ');
}

export class MultiLineTextNode extends SShapeElement implements SArgumentable {
	static readonly DEFAULT_FEATURES = [
		boundsFeature];
	layout: string;
	readonly args: Args;
    text = '';
	align = '';
}