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
import {
    Bounds,
    BoundsData,
    Dimension,
    GChildElement,
    GModelElement,
    GParentElement,
    HBoxLayoutOptions,
    HBoxLayouter,
    LayoutContainer,
    Point,
    StatefulLayouter,
    isBoundsAware,
    isLayoutContainer,
    isLayoutableChild
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { LayoutAware } from './layout-data';

export interface HBoxLayoutOptionsExt extends HBoxLayoutOptions {
    hGrab: boolean;
    vGrab: boolean;
    prefWidth: number | null;
    prefHeight: number | null;
}

/**
 * Extends HBoxLayouter to support additional layout options
 */
@injectable()
export class HBoxLayouterExt extends HBoxLayouter {
    static override KIND = HBoxLayouter.KIND;

    override layout(container: GParentElement & LayoutContainer, layouter: StatefulLayouter): void {
        const boundsData = layouter.getBoundsData(container);
        const options = this.getLayoutOptions(container);
        const childrenSize = this.getChildrenSize(container, options, layouter);

        const fixedSize = this.getFixedContainerBounds(container, options, layouter);

        const currentWidth = boundsData.bounds ? boundsData.bounds?.width - options.paddingLeft - options.paddingRight : 0;
        const currentHeight = boundsData.bounds ? boundsData.bounds?.height - options.paddingTop - options.paddingBottom : 0;

        const maxWidth =
            options.paddingFactor *
            (options.resizeContainer
                ? Math.max(fixedSize.width - options.paddingLeft - options.paddingRight, childrenSize.width)
                : Math.max(0, fixedSize.width - options.paddingLeft - options.paddingRight));
        const maxHeight =
            options.paddingFactor *
            (options.resizeContainer
                ? Math.max(fixedSize.height - options.paddingTop - options.paddingBottom, childrenSize.height)
                : Math.max(0, fixedSize.height - options.paddingTop - options.paddingBottom));

        const width = Math.max(currentWidth, maxWidth);
        const height = Math.max(currentHeight, maxHeight);

        // Remaining size that can be grabbed by children with the hGrab option
        const grabWidth = width - childrenSize.width;
        // Number of children that request hGrab
        // FIXME: This approach works fine when only 1 child uses HGrab, but may cause rounding issues
        // when the grabHeight can't be equally shared by all children.
        const grabbingChildren = container.children
            .map(child => this.getChildLayoutOptions(child, options))
            .filter(opt => opt.hGrab).length;

        if (width > 0 && height > 0) {
            const offset = this.layoutChildren(container, layouter, options, width, height, grabWidth, grabbingChildren);
            const computed = this.getComputedContainerDimensions(options, childrenSize.width, childrenSize.height);
            LayoutAware.setComputedDimensions(boundsData, computed);
            boundsData.bounds = this.getFinalContainerBounds(container, offset, options, computed.width, computed.height);
            boundsData.boundsChanged = true;
        }
    }

    protected override getChildrenSize(
        container: GParentElement & LayoutContainer,
        containerOptions: HBoxLayoutOptionsExt,
        layouter: StatefulLayouter
    ): Dimension {
        let maxWidth = 0;
        let maxHeight = -1;
        let isFirst = true;
        container.children.forEach(child => {
            if (isLayoutableChild(child)) {
                const bounds = layouter.getBoundsData(child).bounds;
                if (bounds !== undefined && Dimension.isValid(bounds)) {
                    maxWidth += bounds.width;
                    if (isFirst) {
                        isFirst = false;
                    } else {
                        maxWidth += containerOptions.hGap;
                    }
                    maxHeight = Math.max(maxHeight, bounds.height);
                }
            }
        });
        const result = {
            width: maxWidth,
            height: maxHeight
        };
        return result;
    }

    protected override layoutChildren(
        container: GParentElement & LayoutContainer,
        layouter: StatefulLayouter,
        containerOptions: HBoxLayoutOptionsExt,
        maxWidth: number,
        maxHeight: number,
        grabWidth?: number,
        grabbingChildren?: number
    ): Point {
        let currentOffset: Point = {
            x: containerOptions.paddingLeft + 0.5 * (maxWidth - maxWidth / containerOptions.paddingFactor),
            y: containerOptions.paddingTop + 0.5 * (maxHeight - maxHeight / containerOptions.paddingFactor)
        };

        container.children.forEach(child => {
            if (isLayoutableChild(child)) {
                const boundsData = layouter.getBoundsData(child);
                const bounds = boundsData.bounds;
                const childOptions = this.getChildLayoutOptions(child, containerOptions);
                if (bounds !== undefined && Dimension.isValid(bounds)) {
                    currentOffset = this.layoutChild(
                        child,
                        boundsData,
                        bounds,
                        childOptions,
                        containerOptions,
                        currentOffset,
                        maxWidth,
                        maxHeight,
                        grabWidth,
                        grabbingChildren
                    );
                }
            }
        });
        return currentOffset;
    }

    protected override layoutChild(
        child: GChildElement,
        boundsData: BoundsData,
        bounds: Bounds,
        childOptions: HBoxLayoutOptionsExt,
        containerOptions: HBoxLayoutOptionsExt,
        currentOffset: Point,
        maxWidth: number,
        maxHeight: number,
        grabWidth?: number,
        grabbingChildren?: number
    ): Point {
        const vAlign = childOptions.vGrab ? 'top' : childOptions.vAlign;
        const dy = this.getDy(vAlign, bounds, maxHeight);
        let offset = super.layoutChild(child, boundsData, bounds, childOptions, containerOptions, currentOffset, maxWidth, maxHeight);
        boundsData.bounds = {
            ...boundsData.bounds!,
            x: currentOffset.x,
            y: currentOffset.y + dy
        };
        if (childOptions.vGrab) {
            boundsData.bounds = {
                x: boundsData.bounds!.x,
                y: boundsData.bounds!.y,
                width: boundsData.bounds!.width,
                height: maxHeight
            };
            boundsData.boundsChanged = true;
        }
        if (childOptions.hGrab && grabWidth && grabbingChildren) {
            const width = boundsData.bounds!.width + grabWidth / grabbingChildren;
            boundsData.bounds = {
                x: boundsData.bounds!.x,
                y: boundsData.bounds!.y,
                width: width,
                height: boundsData.bounds!.height
            };
            boundsData.boundsChanged = true;
            offset = { x: currentOffset.x + width, y: currentOffset.y };
        }
        return offset;
    }

    protected override getFixedContainerBounds(
        container: GModelElement,
        layoutOptions: HBoxLayoutOptionsExt,
        layouter: StatefulLayouter
    ): Bounds {
        const currentContainer = container;
        // eslint-disable-next-line no-constant-condition
        if (isBoundsAware(currentContainer)) {
            const bounds = currentContainer.bounds;
            const elementOptions = this.getElementLayoutOptions(currentContainer);
            const width = elementOptions?.prefWidth ?? 0;
            const height = elementOptions?.prefHeight ?? 0;
            return { ...bounds, width, height };
        }
        return Bounds.EMPTY;
    }

    protected override getChildLayoutOptions(child: GChildElement, containerOptions: HBoxLayoutOptionsExt): HBoxLayoutOptionsExt {
        const filteredOptions = this.filterContainerOptions(containerOptions);

        if (!isLayoutableChild(child) && !isLayoutContainer(child)) {
            return filteredOptions;
        }

        return super.getChildLayoutOptions(child, filteredOptions) as HBoxLayoutOptionsExt;
    }

    protected override getLayoutOptions(element: GModelElement): HBoxLayoutOptionsExt {
        return super.getLayoutOptions(element) as HBoxLayoutOptionsExt;
    }

    protected getElementLayoutOptions(element: GModelElement): HBoxLayoutOptionsExt | undefined {
        return (element as any).layoutOptions;
    }

    protected getComputedContainerDimensions(options: HBoxLayoutOptionsExt, maxWidth: number, maxHeight: number): Dimension {
        return {
            width: maxWidth + options.paddingLeft + options.paddingRight,
            height: maxHeight + options.paddingTop + options.paddingBottom
        };
    }

    protected override getFinalContainerBounds(
        container: GParentElement & LayoutContainer,
        lastOffset: Point,
        options: HBoxLayoutOptionsExt,
        computedWidth: number,
        computedHeight: number
    ): Bounds {
        const elementOptions = this.getElementLayoutOptions(container);
        const width = elementOptions?.prefWidth ?? options.minWidth;
        const height = elementOptions?.prefHeight ?? options.minHeight;
        const result = {
            x: container.bounds.x,
            y: container.bounds.y,
            width: Math.max(width, computedWidth),
            height: Math.max(height, computedHeight)
        };

        return result;
    }

    protected override getDefaultLayoutOptions(): HBoxLayoutOptionsExt {
        return {
            resizeContainer: true,
            paddingTop: 5,
            paddingBottom: 5,
            paddingLeft: 5,
            paddingRight: 5,
            paddingFactor: 1,
            hGap: 1,
            vAlign: 'center',
            minWidth: 0,
            minHeight: 0,
            hGrab: false,
            vGrab: false,
            // eslint-disable-next-line no-null/no-null
            prefHeight: null,
            // eslint-disable-next-line no-null/no-null
            prefWidth: null
        };
    }

    protected filterContainerOptions(containerOptions: HBoxLayoutOptionsExt): HBoxLayoutOptionsExt {
        // Reset object-specific layout options to default before merging,
        // to make sure they won't be inherited (grab, prefSize)
        // eslint-disable-next-line no-null/no-null
        const localOptions = { vGrab: false, hGrab: false, prefHeight: null, prefWidth: null };
        return { ...containerOptions, ...localOptions };
    }
}
