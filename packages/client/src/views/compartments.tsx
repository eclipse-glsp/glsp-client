/********************************************************************************
 * Copyright (c) 2021-2025 EclipseSource and others.
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
import { Dimension, GCompartment, RenderingContext, ShapeView, svg } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';

@injectable()
export class StructureCompartmentView extends ShapeView {
    render(model: Readonly<GCompartment>, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(model, context)) {
            return undefined;
        }
        const rectSize = Dimension.isValid(model.size) ? model.size : Dimension.ZERO;
        return (
            <g>
                <rect class-sprotty-comp={true} x='0' y='0' width={rectSize.width} height={rectSize.height}></rect>
                {context.renderChildren(model)}
            </g>
        );
    }
}
