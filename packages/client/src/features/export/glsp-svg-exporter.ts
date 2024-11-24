/********************************************************************************
 * Copyright (c) 2022-2024 EclipseSource and others.
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
    Action,
    ExportSvgAction,
    ExportSvgOptions,
    GModelRoot,
    RequestAction,
    RequestExportSvgAction,
    SvgExporter
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { v4 as uuid } from 'uuid';

@injectable()
export class GLSPSvgExporter extends SvgExporter {
    override export(root: GModelRoot, request?: RequestExportSvgAction): void {
        if (typeof document !== 'undefined') {
            let svgElement = this.findSvgElement();
            if (svgElement) {
                svgElement = this.prepareSvgElement(svgElement, root, request);
                const serializedSvg = this.createSvg(svgElement, root, request?.options ?? {}, request);
                const svgExport = this.getSvgExport(serializedSvg, svgElement, root, request);
                // do not give request/response id here as otherwise the action is treated as an unrequested response
                this.actionDispatcher.dispatch(
                    ExportSvgAction.create(svgExport, { responseId: request?.requestId, options: request?.options })
                );
            }
        }
    }

    protected override createSvg(svgElement: SVGSVGElement, root: GModelRoot, options?: ExportSvgOptions, cause?: Action): string {
        // createSvg requires the svg to have a non-empty id, so we generate one if necessary
        const originalId = svgElement.id;
        try {
            svgElement.id = originalId || uuid();
            return super.createSvg(svgElement, root, options, cause);
        } finally {
            svgElement.id = originalId;
        }
    }

    protected findSvgElement(): SVGSVGElement | null {
        const div = document.getElementById(this.options.hiddenDiv);
        // search for first svg element as hierarchy within Sprotty might change
        return div && div.querySelector('svg');
    }

    protected prepareSvgElement(svgElement: SVGSVGElement, root: GModelRoot, request?: RequestAction<ExportSvgAction>): SVGSVGElement {
        return svgElement;
    }

    protected override copyStyles(source: Element, target: Element, skippedProperties: string[]): void {
        this.copyStyle(source, target, skippedProperties);

        // IE doesn't retrun anything on source.children
        for (let i = 0; i < source.childNodes.length; ++i) {
            const sourceChild = source.childNodes[i];
            const targetChild = target.childNodes[i];
            if (sourceChild instanceof Element) {
                this.copyStyles(sourceChild, targetChild as Element, []);
            }
        }
    }

    protected copyStyle(source: Element, target: Element, skippedProperties: string[]): void {
        const sourceStyle = getComputedStyle(source);
        const targetStyle = getComputedStyle(target);

        let style = '';
        for (let i = 0; i < sourceStyle.length; i++) {
            const propertyName = sourceStyle[i];
            if (!skippedProperties.includes(propertyName)) {
                const propertyValue = sourceStyle.getPropertyValue(propertyName);
                const propertyPriority = sourceStyle.getPropertyPriority(propertyName);
                if (targetStyle.getPropertyValue(propertyName) !== propertyValue) {
                    if (this.shouldUpdateStyle(target)) {
                        // rather set the property directly on the element to keep other values intact
                        target.style.setProperty(propertyName, propertyValue);
                    } else {
                        // collect all properties to set them at once
                        style += `${propertyName}: ${propertyValue}${propertyPriority ? ' !' + propertyPriority : ''}; `;
                    }
                }
            }
        }
        if (style !== '') {
            target.setAttribute('style', style.trim());
        }
    }

    protected shouldUpdateStyle(element: any): element is ElementCSSInlineStyle {
        // we want to simply update the style of elements and keep other values intact if they have a style property
        return 'tagName' in element && 'style' in element;
    }

    protected getSvgExport(
        serializedSvgElement: string,
        svgElement: SVGElement,
        root: GModelRoot,
        request?: RequestAction<ExportSvgAction>
    ): string {
        const svgExportStyle = this.getSvgExportStyle(svgElement, root, request);
        return svgExportStyle ? serializedSvgElement.replace('style="', `style="${svgExportStyle}`) : serializedSvgElement;
    }

    protected getSvgExportStyle(svgElement: SVGElement, root: GModelRoot, request?: RequestAction<ExportSvgAction>): string | undefined {
        // provide generated svg code with respective sizing for proper viewing in browser and remove undesired border
        const bounds = this.getBounds(root, document);
        return (
            `width: ${bounds.width}px !important;` +
            `height: ${bounds.height}px !important;` +
            'border: none !important;' +
            'cursor: default !important;'
        );
    }
}
