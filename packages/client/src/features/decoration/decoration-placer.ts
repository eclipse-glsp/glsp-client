/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import { Decoration, DecorationPlacer, GChildElement, GModelElement, GRoutableElement, Point, isSizeable } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';

@injectable()
export class GlspDecorationPlacer extends DecorationPlacer {
    protected static readonly DECORATION_OFFSET: Point = { x: 12, y: 10 };

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
}
