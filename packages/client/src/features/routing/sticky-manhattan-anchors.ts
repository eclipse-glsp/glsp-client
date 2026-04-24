/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
    DIAMOND_ANCHOR_KIND,
    ELLIPTIC_ANCHOR_KIND,
    ManhattanDiamondAnchor,
    ManhattanEllipticAnchor,
    ManhattanRectangularAnchor,
    RECTANGULAR_ANCHOR_KIND
} from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { GLSPStickyManhattanEdgeRouter } from './sticky-manhattan-edge-router';

// Anchor computers are keyed by `<routerKind>:<anchorKind>` in the AnchorComputerRegistry.
// The sticky router has its own routerKind, so dedicated subclasses must be registered even
// though their geometry behavior is identical to the standard Manhattan anchors.

@injectable()
export class StickyManhattanRectangularAnchor extends ManhattanRectangularAnchor {
    static override readonly KIND = GLSPStickyManhattanEdgeRouter.KIND + ':' + RECTANGULAR_ANCHOR_KIND;
    override get kind(): string {
        return StickyManhattanRectangularAnchor.KIND;
    }
}

@injectable()
export class StickyManhattanDiamondAnchor extends ManhattanDiamondAnchor {
    static override readonly KIND = GLSPStickyManhattanEdgeRouter.KIND + ':' + DIAMOND_ANCHOR_KIND;
    override get kind(): string {
        return StickyManhattanDiamondAnchor.KIND;
    }
}

@injectable()
export class StickyManhattanEllipticAnchor extends ManhattanEllipticAnchor {
    static override readonly KIND = GLSPStickyManhattanEdgeRouter.KIND + ':' + ELLIPTIC_ANCHOR_KIND;
    override get kind(): string {
        return StickyManhattanEllipticAnchor.KIND;
    }
}
