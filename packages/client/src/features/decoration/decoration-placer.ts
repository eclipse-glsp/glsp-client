/********************************************************************************
 * Copyright (c) 2019-2025 EclipseSource and others.
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
    DOMHelper,
    Decoration,
    DecorationPlacer,
    GChildElement,
    GModelElement,
    GRoutableElement,
    ISvgExportPostProcessor,
    LazyInjector,
    Point,
    TYPES,
    isDecoration,
    isSizeable
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';
import { filter } from '../../utils/gmodel-util';

@injectable()
export class GlspDecorationPlacer extends DecorationPlacer implements ISvgExportPostProcessor {
    protected static readonly DECORATION_OFFSET: Point = { x: 12, y: 10 };
    @inject(TYPES.DOMHelper)
    protected domHelper: DOMHelper;

    @inject(LazyInjector)
    protected lazyInjector: LazyInjector;

    get editorContextService(): EditorContextService {
        return this.lazyInjector.get(EditorContextService);
    }

    protected override getPosition(element: GModelElement & Decoration): Point {
        if (element instanceof GChildElement && element.parent instanceof GRoutableElement) {
            return super.getPosition(element);
        }
        if (isSizeable(element)) {
            return {
                x: -GlspDecorationPlacer.DECORATION_OFFSET.x,
                y: -GlspDecorationPlacer.DECORATION_OFFSET.y
            };
        }
        return Point.ORIGIN;
    }
    // HiddenVNodePostprocessor implementation
    override postUpdate(cause?: Action): void;
    // ISvgExportPostProcessor implementation
    override postUpdate(element: SVGSVGElement, cause?: Action): void;
    override postUpdate(elementOrCause?: SVGSVGElement | Action, _cause?: Action): void {
        // Called as HiddenVNodePostprocessor => no-op
        if (!elementOrCause || Action.is(elementOrCause)) {
            return;
        }

        // Called as ISvgExportPostProcessor
        // Adjust the position of all decorations in the exported SVG
        const svg = elementOrCause;
        const translate = `translate(-${GlspDecorationPlacer.DECORATION_OFFSET.x}px, -${GlspDecorationPlacer.DECORATION_OFFSET.y}px)`;
        filter(this.editorContextService.modelRoot.index, isDecoration).forEach(decoration => {
            const domId = this.domHelper.createUniqueDOMElementId(decoration);
            const element = svg.querySelector<SVGElement>(`#${domId}`);
            element!.style.transform = translate;
        });
    }
}
