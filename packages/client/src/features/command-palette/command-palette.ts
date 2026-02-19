/********************************************************************************
 * Copyright (c) 2024-2026 EclipseSource and others.
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

import { Bounds, CommandPalette, getWindowScroll, GModelElement, GModelRoot } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { CSS_HIDDEN_EXTENSION_CLASS, CSS_UI_EXTENSION_CLASS } from '../../base/ui-extension/ui-extension';
import { getElements, isSelectableAndBoundsAware } from '../../utils/gmodel-util';

@injectable()
export class GlspCommandPalette extends CommandPalette {
    protected override initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);
        containerElement.style.position = '';
        containerElement.classList.add(CSS_UI_EXTENSION_CLASS);
    }

    protected override setContainerVisible(visible: boolean): void {
        if (visible) {
            this.containerElement?.classList.remove(CSS_HIDDEN_EXTENSION_CLASS);
        } else {
            this.containerElement?.classList.add(CSS_HIDDEN_EXTENSION_CLASS);
        }
    }

    protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<GModelRoot>, ...selectedElementIds: string[]): void {
        let x = this.xOffset;
        let y = this.yOffset;

        const selectedElements = getElements(root.index, selectedElementIds, isSelectableAndBoundsAware);
        if (selectedElements.length === 1) {
            const bounds = this.getAbsoluteBounds(selectedElements[0]);
            x += bounds.x + bounds.width;
            y += bounds.y;
        } else {
            const bounds = this.getAbsoluteBounds(root);
            x += bounds.x;
            y += bounds.y;
        }
        containerElement.style.left = `${x}px`;
        containerElement.style.top = `${y}px`;
        containerElement.style.width = `${this.defaultWidth}px`;
    }

    protected getAbsoluteBounds(element: Readonly<GModelElement>): Bounds {
        let x = 0;
        let y = 0;
        let width = 0;
        let height = 0;

        const svgElementId = this.domHelper.createUniqueDOMElementId(element);
        const svgElement = document.getElementById(svgElementId);
        if (svgElement) {
            const rect = svgElement.getBoundingClientRect();
            const scroll = getWindowScroll();
            x = rect.left + scroll.x;
            y = rect.top + scroll.y;
            width = rect.width;
            height = rect.height;
        }
        return { x, y, width, height };
    }
}
