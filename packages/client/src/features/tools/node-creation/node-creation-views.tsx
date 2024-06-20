/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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
/** @jsx svg */
import { IView, RenderingContext, TYPES, setClass, svg } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { GArgument } from '../../../utils/argument-utils';
import { Grid } from '../../grid/grid';
import { ARG_LENGTH, InsertIndicator } from './insert-indicator';

@injectable()
export class InsertIndicatorView implements IView {
    @optional() @inject(TYPES.Grid) protected grid?: Grid;

    render(model: Readonly<InsertIndicator>, context: RenderingContext): VNode | undefined {
        if (context.targetKind === 'hidden') {
            return undefined;
        }
        const size = this.getSize(model);
        const node = (
            <g>
                <polyline class-sprotty-node={true} class-insert-indicator={true} points={`0,${-size / 2} 0,${size / 2}`}></polyline>
                <polyline class-sprotty-node={true} class-insert-indicator={true} points={`${-size / 2},0 ${size / 2},0`}></polyline>
            </g>
        );
        model.cssClasses.forEach(cl => setClass(node, cl, true));
        return node;
    }

    protected getSize(model: Readonly<InsertIndicator>): number {
        return GArgument.getNumber(model, ARG_LENGTH) ?? this.grid?.x ?? 10;
    }
}
