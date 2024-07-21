/********************************************************************************
 * Copyright (c) 2021-2024 EclipseSource and others.
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
import {
    AbstractLayout,
    AbstractLayoutOptions,
    Bounds,
    BoundsData,
    Dimension,
    GChildElement,
    GParentElement,
    LayoutContainer,
    Point,
    StatefulLayouter
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { LayoutAware } from './layout-data';

/**
 * Layouts children of a container with explicit X/Y positions
 */
@injectable()
export class FreeFormLayouter extends AbstractLayout<AbstractLayoutOptions> {
    static KIND = 'freeform';

    override layout(container: GParentElement & LayoutContainer, layouter: StatefulLayouter): void {
        const boundsData = layouter.getBoundsData(container);
        const options = this.getLayoutOptions(container);
        const childrenSize = this.getChildrenSize(container, options, layouter);

        // The real size of the compartment will be determined by the parent node layout;
        // we only need to compute the bounds required to layout the children.

        const maxWidth = childrenSize.width > 0 ? childrenSize.width + options.paddingLeft + options.paddingRight : 0;
        const maxHeight = childrenSize.height > 0 ? childrenSize.height + options.paddingTop + options.paddingBottom : 0;
        if (childrenSize.width > 0 && childrenSize.height > 0) {
            const offset = this.layoutChildren(container, layouter, options, maxWidth, maxHeight);
            const computed = this.getComputedContainerDimensions(options, childrenSize.width, childrenSize.height);
            LayoutAware.setComputedDimensions(boundsData, computed);
            boundsData.bounds = this.getFinalContainerBounds(container, offset, options, computed.width, computed.height);
            boundsData.boundsChanged = true;
        } else {
            boundsData.bounds = { x: boundsData.bounds!.x, y: boundsData.bounds!.y, width: 0, height: 0 };
            boundsData.boundsChanged = true;
        }
    }

    protected getChildrenSize(
        container: GParentElement & LayoutContainer,
        containerOptions: AbstractLayoutOptions,
        layouter: StatefulLayouter
    ): Dimension {
        let maxX = 0;
        let maxY = 0;
        container.children.forEach(child => {
            const bounds = layouter.getBoundsData(child).bounds;
            if (bounds !== undefined && Dimension.isValid(bounds)) {
                const childMaxX = bounds.x + bounds.width;
                const childMaxY = bounds.y + bounds.height;
                maxX = Math.max(maxX, childMaxX);
                maxY = Math.max(maxY, childMaxY);
            }
        });
        return {
            width: maxX,
            height: maxY
        };
    }

    protected layoutChild(
        child: GChildElement,
        boundsData: BoundsData,
        bounds: Bounds,
        childOptions: AbstractLayoutOptions,
        containerOptions: AbstractLayoutOptions,
        currentOffset: Point,
        maxWidth: number,
        maxHeight: number
    ): Point {
        boundsData.bounds = {
            x: (child as any).bounds.x,
            y: (child as any).bounds.y,
            width: bounds.width,
            height: bounds.height
        };
        boundsData.boundsChanged = true;
        return currentOffset;
    }

    protected getComputedContainerDimensions(options: AbstractLayoutOptions, maxWidth: number, maxHeight: number): Dimension {
        return {
            width: maxWidth + options.paddingLeft + options.paddingRight,
            height: maxHeight + options.paddingTop + options.paddingBottom
        };
    }

    protected override getFinalContainerBounds(
        container: GParentElement & LayoutContainer,
        lastOffset: Point,
        options: AbstractLayoutOptions,
        maxWidth: number,
        maxHeight: number
    ): Bounds {
        const result = {
            x: container.bounds.x,
            y: container.bounds.y,
            width: Math.max(options.minWidth, maxWidth),
            height: Math.max(options.minHeight, maxHeight)
        };

        return result;
    }

    protected getDefaultLayoutOptions(): AbstractLayoutOptions {
        return {
            resizeContainer: true,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingFactor: 1,
            minWidth: 0,
            minHeight: 0
        };
    }

    protected spread(a: AbstractLayoutOptions, b: AbstractLayoutOptions): AbstractLayoutOptions {
        return { ...a, ...b };
    }
}
