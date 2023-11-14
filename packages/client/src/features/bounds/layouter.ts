/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
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
import {
    Bounds,
    BoundsData,
    ILogger,
    LayoutContainer,
    LayoutRegistry,
    Layouter,
    GModelElement,
    GParentElement,
    StatefulLayouter,
    isLayoutContainer
} from '@eclipse-glsp/sprotty';

@injectable()
export class LayouterExt extends Layouter {
    override layout(element2boundsData: Map<GModelElement, BoundsData>): void {
        new StatefulLayouterExt(element2boundsData, this.layoutRegistry, this.logger).layout();
    }
}

// 2-pass layout:
// Step 1: Find "rendered size" of each element (may take resizeContainer into account)
// Child-to-parent layout
// Step 2: Extend parents as necessary, then use the adjusted parent size to properly
// align children (center/end alignments, hGrab/vGrab)
// Parent-to-children layout

export class StatefulLayouterExt extends StatefulLayouter {
    protected toBeLayouted2: (GParentElement & LayoutContainer)[];

    /**
     *
     * @param elementToBoundsData The map of element to bounds data. Bounds Data are computed from the hidden
     * SVG rendering pass.
     * @param layoutRegistry2 The registry of available layouts.
     * @param log The log.
     */
    constructor(
        protected readonly elementToBoundsData: Map<GModelElement, BoundsData>,
        protected readonly layoutRegistry2: LayoutRegistry,
        log: ILogger
    ) {
        super(elementToBoundsData, layoutRegistry2, log);
        this.toBeLayouted2 = [];
        elementToBoundsData.forEach((data, element) => {
            if (isLayoutContainer(element)) {
                this.toBeLayouted2.push(element);
            }
        });
        for (const element of this.toBeLayouted2) {
            // Clear previous layout information for dynamic-layout objects
            elementToBoundsData.delete(element);
        }
    }

    override getBoundsData(element: GModelElement): BoundsData {
        let boundsData = this.elementToBoundsData.get(element);
        let bounds = (element as any).bounds;
        if (isLayoutContainer(element) && this.toBeLayouted2.indexOf(element) >= 0) {
            bounds = this.doLayout(element);
        } else if (isLayoutContainer(element)) {
            bounds = {
                x: 0,
                y: 0,
                width: -1,
                height: -1
            };
        }
        if (!boundsData) {
            boundsData = {
                bounds: bounds,
                boundsChanged: false,
                alignmentChanged: false
            };
            this.elementToBoundsData.set(element, boundsData);
        }
        return boundsData;
    }

    override layout(): void {
        // First pass: apply layout with cleared container data. Will get
        // preferred size for all elements (Children first, then parents)
        while (this.toBeLayouted2.length > 0) {
            const element = this.toBeLayouted2[0];
            this.doLayout(element);
        }

        this.toBeLayouted2 = [];
        this.elementToBoundsData.forEach((data, element) => {
            if (isLayoutContainer(element)) {
                this.toBeLayouted2.push(element);
            }
        });

        // Second pass: apply layout with initial size data for all
        // nodes. Update the position/size of all elements, taking
        // vGrab/hGrab into account (parent -> children).
        while (this.toBeLayouted2.length > 0) {
            const element = this.toBeLayouted2[0];
            this.doLayout(element);
        }
    }

    protected override doLayout(element: GParentElement & LayoutContainer): Bounds {
        const index = this.toBeLayouted2.indexOf(element);
        if (index >= 0) {
            this.toBeLayouted2.splice(index, 1);
        }
        const layout = this.layoutRegistry2.get(element.layout);
        if (layout) {
            layout.layout(element, this);
        }
        const boundsData = this.elementToBoundsData.get(element);
        if (boundsData !== undefined && boundsData.bounds !== undefined) {
            return boundsData.bounds;
        } else {
            this.log.error(element, 'Layout failed');
            return Bounds.EMPTY;
        }
    }
}
