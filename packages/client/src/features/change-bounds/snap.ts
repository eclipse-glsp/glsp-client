/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
/* eslint-disable @typescript-eslint/no-shadow */
import { GModelElement, ISnapper, KeyboardModifier, Point } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';

/**
 * A {@link ISnapper} implementation that snaps all elements onto a fixed gride size.
 * The default grid size is 10x10 pixel.
 * To configure a custom grid size  bind the `TYPES.ISnapper` service identifier
 * to constant value, e.g:
 *
 * ```ts
 * bind(TYPES.ISnapper).toConstantValue(new GridSnapper({x:25 ,y:25 }));
 * ```
 */
@injectable()
export class GridSnapper implements ISnapper {
    constructor(public grid: { x: number; y: number } = { x: 10, y: 10 }) {}

    snap(position: Point, _element: GModelElement): Point {
        return {
            x: Math.round(position.x / this.grid.x) * this.grid.x,
            y: Math.round(position.y / this.grid.y) * this.grid.y
        };
    }
}

export function useSnap(event: MouseEvent | KeyboardEvent): boolean {
    return !event.shiftKey;
}

export function unsnapModifier(): KeyboardModifier {
    return 'shift';
}
