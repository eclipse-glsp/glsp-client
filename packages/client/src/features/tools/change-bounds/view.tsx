/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { IView, Point, RenderingContext, setAttr, svg } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { GResizeHandle } from '../../change-bounds/model';

@injectable()
export class GResizeHandleView implements IView {
    render(handle: GResizeHandle, context: RenderingContext): VNode | undefined {
        if (context.targetKind === 'hidden') {
            return undefined;
        }
        const position = this.getPosition(handle);
        if (position !== undefined) {
            const node = (
                <circle
                    class-sprotty-resize-handle={true}
                    class-mouseover={handle.hoverFeedback}
                    cx={position.x}
                    cy={position.y}
                    r={this.getRadius()}
                />
            );
            setAttr(node, 'data-kind', handle.location);
            return node;
        }
        // Fallback: Create an empty group
        return <g />;
    }

    protected getPosition(handle: GResizeHandle): Point | undefined {
        return Point.subtract(GResizeHandle.getHandlePosition(handle), handle.parent.bounds);
    }

    getRadius(): number {
        return 7;
    }
}

export {
    /** @deprecated Use {@link GResizeHandleView} instead */
    GResizeHandleView as SResizeHandleView
};
