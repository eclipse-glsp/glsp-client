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
import { v4 as uuid } from 'uuid';
import { ExportSvgAction, RequestAction, GModelRoot, SvgExporter } from '@eclipse-glsp/sprotty';

@injectable()
export class GLSPSvgExporter extends SvgExporter {
    override export(root: GModelRoot, _request?: RequestAction<ExportSvgAction>): void {
        if (typeof document !== 'undefined') {
            const svgElement = this.findSvgElement();
            if (svgElement) {
                // createSvg requires the svg to have a non-empty id, so we generate one if necessary
                const originalId = svgElement.id;
                try {
                    svgElement.id = originalId || uuid();
                    // provide generated svg code with respective sizing for proper viewing in browser and remove undesired border
                    const bounds = this.getBounds(root);
                    const svg = this.createSvg(svgElement, root).replace(
                        'style="',
                        `style="width: ${bounds.width}px !important;height: ${bounds.height}px !important;border: none !important;`
                    );
                    // do not give request/response id here as otherwise the action is treated as an unrequested response
                    this.actionDispatcher.dispatch(ExportSvgAction.create(svg));
                } finally {
                    svgElement.id = originalId;
                }
            }
        }
    }

    protected findSvgElement(): SVGSVGElement | null {
        const div = document.getElementById(this.options.hiddenDiv);
        // search for first svg element as hierarchy within Sprotty might change
        return div && div.querySelector('svg');
    }
}
