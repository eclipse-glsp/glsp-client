/********************************************************************************
 * Copyright (c) 2024-2025 EclipseSource and others.
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

import { CenterGridSnapper, GModelElement, ISnapper, Point, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { Grid } from './grid';

/**
 * A {@link ISnapper} implementation that snaps all elements onto a fixed gride size.
 * The default grid size is 10x10 pixel.
 * To configure a custom grid size  bind the `TYPES.ISnapper` service identifier
 * to constant value, e.g:
 *
 * ```ts
 * bind(TYPES.ISnapper).toConstantValue(new GridSnapper({ x: 25, y: 25 }));
 * ```
 *
 * or use the `Grid` to define the grid size more generically:
 * ```ts
 * bind(TYPES.Grid).toConstantValue({ x: 25, y: 25 });
 * bind(TYPES.ISnapper).to(GridSnapper);
 * ```
 */
@injectable()
export class GridSnapper implements ISnapper {
    constructor(@optional() @inject(TYPES.Grid) public readonly grid: Grid = Grid.DEFAULT) {}

    snap(position: Point, element: GModelElement): Point {
        return Point.snapToGrid(position, this.grid);
    }
}

@injectable()
export class GLSPCenterGridSnapper extends CenterGridSnapper {
    constructor(@optional() @inject(TYPES.Grid) public readonly grid: Grid = Grid.DEFAULT) {
        super();
    }

    override get gridX(): number {
        return this.grid.x;
    }

    override get gridY(): number {
        return this.grid.y;
    }
}
