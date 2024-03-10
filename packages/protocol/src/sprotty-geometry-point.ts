/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { Point } from 'sprotty-protocol/lib/utils/geometry';

declare module 'sprotty-protocol/lib/utils/geometry' {
    namespace Point {
        /**
         * Type guard to check if a point is valid. For a point to be valid it needs to be defined and have valid x and y coordinates.
         *
         * @param point the point to be checked for validity
         */
        function isValid(point?: Point): point is Point;
    }
}

Point.isValid = (point?: Point): point is Point => point !== undefined && !isNaN(point.x) && !isNaN(point.y);

export { Point };
