/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { Bounds } from '@eclipse-glsp/protocol';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import {
    ATTR_BBOX_ELEMENT,
    BoundsAware,
    Hoverable,
    IViewArgs,
    RenderingContext,
    SShapeElementImpl,
    Selectable,
    CircularNodeView as SprottyCircularNodeView,
    DiamondNodeView as SprottyDiamondNodeView,
    svg
} from 'sprotty';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class DiamondNodeView extends SprottyDiamondNodeView {
    override render(
        node: Readonly<SShapeElementImpl & Hoverable & Selectable>,
        context: RenderingContext,
        args?: IViewArgs
    ): VNode | undefined {
        // The super class may change the bounds of the given node as browsers may calculate larger bounds for the rendered node (BBox).
        // To ensure that the node's bounds remains unchanged, we render a rectangle with the correct bounds during hidden rendering.
        return applyHiddenBoundingRect(node, context, super.render(node, context, args));
    }
}

@injectable()
export class CircularNodeView extends SprottyCircularNodeView {
    override render(
        node: Readonly<SShapeElementImpl & Hoverable & Selectable>,
        context: RenderingContext,
        args?: IViewArgs
    ): VNode | undefined {
        // The super class may change the bounds of the given node as browsers may calculate larger bounds for the rendered node (BBox).
        // To ensure that the node's bounds remains unchanged, we render a rectangle with the correct bounds during hidden rendering.
        return applyHiddenBoundingRect(node, context, super.render(node, context, args));
    }
}

/**
 * Creates a hidden rectangle with the bounds of the given element.
 * @param withBounds The element to create the hidden rectangle for.
 * @returns The hidden rectangle.
 */
export function hiddenBoundingRect(withBounds: BoundsAware): VNode {
    // an element with attribute ATTR_BBOX_ELEMENT is used by the hidden bounds updater to determine the bounds if it is within a g-element
    // we set the fill to transparent since the SVG export uses the hidden rendering to generate the image and we do not want to be seen
    return <rect attrs={{ [ATTR_BBOX_ELEMENT]: true }} {...Bounds.dimension(withBounds.bounds)} style={{ fill: 'transparent' }} />;
}

/**
 * Applies a hidden bounding rectangle to the given view if we are in the hidden rendering context where sizes are being determined.
 *
 * @param withBounds The element to apply the hidden bounding rectangle to.
 * @param context The rendering context.
 * @param view The view to apply the hidden bounding rectangle to.
 * @returns The view with the hidden bounding rectangle applied, wrapped in a group element if necessary.
 */
export function applyHiddenBoundingRect<V extends VNode | undefined>(withBounds: BoundsAware, context: RenderingContext, view: V): V {
    if (view && context.targetKind === 'hidden') {
        const parent = view.sel === 'g' ? view : <g>{view}</g>;
        parent.children?.unshift(hiddenBoundingRect(withBounds));
        return parent;
    }
    return view;
}
