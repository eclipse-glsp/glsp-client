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
    LayoutContainer,
    Point,
    StatefulLayouter,
    VBoxLayoutOptions,
    VBoxLayouter,
    isBoundsAware,
    isLayoutContainer,
    isLayoutableChild
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { LayoutAware } from './layout-data';

export interface VBoxLayoutOptionsExt extends VBoxLayoutOptions {
    hGrab: boolean;
    vGrab: boolean;
    prefWidth: number | null;
    prefHeight: number | null;
}

/**
 * Extends VBoxLayouter to support additional layout options
 */
@injectable()
export class VBoxLayouterExt extends VBoxLayouter {
    static override KIND = VBoxLayouter.KIND;

    override layout(container: GParentElement & LayoutContainer, layouter: StatefulLayouter): void {
        const boundsData = layouter.getBoundsData(container);
        const options = this.getLayoutOptions(container);
        const childrenSize = this.getChildrenSize(container, options, layouter);

        const fixedSize = this.getFixedContainerBounds(container, options, layouter);

        const currentWidth = (boundsData.bounds?.width || 0) - options.paddingLeft - options.paddingRight;
        const currentHeight = (boundsData.bounds?.height || 0) - options.paddingTop - options.paddingBottom;

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

        // Remaining size that can be grabbed by children with the vGrab option
        const grabHeight: number = height - childrenSize.height;
        // Number of children that request vGrab
        // FIXME: This approach works fine when only 1 child uses VGrab, but may cause rounding issues
        // when the grabHeight can't be equally shared by all children.
        const grabbingChildren = container.children
            .map(child => this.getChildLayoutOptions(child, options))
            .filter(opt => opt.vGrab).length;

        if (maxWidth > 0 && maxHeight > 0) {
            const offset = this.layoutChildren(container, layouter, options, width, height, grabHeight, grabbingChildren);
            const computed = this.getComputedContainerDimensions(options, childrenSize.width, childrenSize.height);
            LayoutAware.setComputedDimensions(boundsData, computed);
            boundsData.bounds = this.getFinalContainerBounds(container, offset, options, computed.width, computed.height);
            boundsData.boundsChanged = true;
        }
    }

    protected override getChildrenSize(
        container: GParentElement & LayoutContainer,
        containerOptions: VBoxLayoutOptionsExt,
        layouter: StatefulLayouter
    ): Dimension {
        let maxWidth = -1;
        let maxHeight = 0;
        let isFirst = true;
        container.children.forEach(child => {
            if (isLayoutableChild(child)) {
                const bounds = layouter.getBoundsData(child).bounds;
                if (bounds !== undefined && Dimension.isValid(bounds)) {
                    maxHeight += bounds.height;
                    if (isFirst) {
                        isFirst = false;
                    } else {
                        maxHeight += containerOptions.vGap;
                    }
                    maxWidth = Math.max(maxWidth, bounds.width);
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
        containerOptions: VBoxLayoutOptionsExt,
        maxWidth: number,
        maxHeight: number,
        grabHeight?: number,
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
                        grabHeight,
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
        childOptions: VBoxLayoutOptionsExt,
        containerOptions: VBoxLayoutOptionsExt,
        currentOffset: Point,
        maxWidth: number,
        maxHeight: number,
        grabHeight?: number,
        grabbingChildren?: number
    ): Point {
        const hAlign = childOptions.hGrab ? 'left' : childOptions.hAlign;
        const dx = this.getDx(hAlign, bounds, maxWidth);
        let offset = super.layoutChild(child, boundsData, bounds, childOptions, containerOptions, currentOffset, maxWidth, maxHeight);
        boundsData.bounds = {
            ...boundsData.bounds!,
            x: currentOffset.x + dx,
            y: currentOffset.y
        };
        if (childOptions.hGrab) {
            boundsData.bounds = {
                x: boundsData.bounds!.x,
                y: boundsData.bounds!.y,
                width: maxWidth,
                height: boundsData.bounds!.height
            };
            boundsData.boundsChanged = true;
        }
        if (childOptions.vGrab && grabHeight && grabbingChildren) {
            const height = boundsData.bounds!.height + grabHeight / grabbingChildren;
            boundsData.bounds = {
                x: boundsData.bounds!.x,
                y: boundsData.bounds!.y,
                width: boundsData.bounds!.width,
                height: height
            };
            boundsData.boundsChanged = true;
            offset = { x: currentOffset.x, y: currentOffset.y + height };
        }
        return offset;
    }

    protected override getFixedContainerBounds(
        container: GModelElement,
        layoutOptions: VBoxLayoutOptionsExt,
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

    protected override getChildLayoutOptions(child: GChildElement, containerOptions: VBoxLayoutOptionsExt): VBoxLayoutOptionsExt {
        const filteredOptions = this.filterContainerOptions(containerOptions);

        if (!isLayoutableChild(child) && !isLayoutContainer(child)) {
            return filteredOptions;
        }

        return super.getChildLayoutOptions(child, filteredOptions) as VBoxLayoutOptionsExt;
    }

    protected override getLayoutOptions(element: GModelElement): VBoxLayoutOptionsExt {
        return super.getLayoutOptions(element) as VBoxLayoutOptionsExt;
    }

    protected getElementLayoutOptions(element: GModelElement): VBoxLayoutOptionsExt | undefined {
        return (element as any).layoutOptions;
    }

    protected getComputedContainerDimensions(options: VBoxLayoutOptionsExt, maxWidth: number, maxHeight: number): Dimension {
        return {
            width: maxWidth + options.paddingLeft + options.paddingRight,
            height: maxHeight + options.paddingTop + options.paddingBottom
        };
    }

    protected override getFinalContainerBounds(
        container: GParentElement & LayoutContainer,
        lastOffset: Point,
        options: VBoxLayoutOptionsExt,
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

    protected override getDefaultLayoutOptions(): VBoxLayoutOptionsExt {
        return {
            resizeContainer: true,
            paddingTop: 5,
            paddingBottom: 5,
            paddingLeft: 5,
            paddingRight: 5,
            paddingFactor: 1,
            vGap: 1,
            hAlign: 'center',
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

    protected filterContainerOptions(containerOptions: VBoxLayoutOptionsExt): VBoxLayoutOptionsExt {
        // Reset object-specific layout options to default before merging,
        // to make sure they won't be inherited (grab, prefSize)
        // eslint-disable-next-line no-null/no-null
        const localOptions = { vGrab: false, hGrab: false, prefHeight: null, prefWidth: null };
        return { ...containerOptions, ...localOptions };
    }
}
