/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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

import { Bounds } from '@eclipse-glsp/sprotty';

/** @deprecated Use {@link Bounds.left} */
export const left = Bounds.left;

/** @deprecated Use {@link Bounds.centerX} */
export const center = Bounds.center;

/** @deprecated Use {@link Bounds.right} */
export const right = Bounds.right;

/** @deprecated Use {@link Bounds.top} */
export const top = Bounds.top;

/** @deprecated Use {@link Bounds.middle} */
export const middle = Bounds.middle;

/** @deprecated Use {@link Bounds.bottom} */
export const bottom = Bounds.bottom;

/** @deprecated Use {@link Bounds.topLeft} */
export const topLeft = Bounds.topLeft;

/** @deprecated Use {@link Bounds.topCenter} */
export const topCenter = Bounds.topCenter;

/** @deprecated Use {@link Bounds.topRight} */
export const topRight = Bounds.topRight;

/** @deprecated Use {@link Bounds.middleLeft} */
export const middleLeft = Bounds.middleLeft;

/** @deprecated Use {@link Bounds.middleCenter} */
export const middleCenter = Bounds.middleCenter;

/** @deprecated Use {@link Bounds.middleRight} */
export const middleRight = Bounds.middleRight;

/** @deprecated Use {@link Bounds.bottomLeft} */
export const bottomLeft = Bounds.bottomLeft;

/** @deprecated Use {@link Bounds.bottomCenter} */
export const bottomCenter = Bounds.bottomCenter;

/** @deprecated Use {@link Bounds.bottomRight} */
export const bottomRight = Bounds.bottomRight;

/** @deprecated Use {@link Bounds.left} */
export const sortBy = Bounds.sortBy;

export const compareFunction =
    <T>(rankFunc: (elem: T) => number): ((x: T, y: T) => number) =>
    (x, y) =>
        rankFunc(x) - rankFunc(y);

/** @deprecated Use {@link Bounds.isAbove} */
export const isAbove = Bounds.isAbove;

/** @deprecated Use {@link Bounds.isBelow} */
export const isBelow = Bounds.isBelow;

/** @deprecated Use {@link Bounds.isBefore} */
export const isBefore = Bounds.isBefore;

/** @deprecated Use {@link Bounds.isAfter} */
export const isAfter = Bounds.isAfter;
