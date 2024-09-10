/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
    rank: number;
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
import { Action, GModelElement, MousePositionTracker, Point } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { Ranked } from './ranked';

@injectable()
export class GLSPMousePositionTracker extends MousePositionTracker implements Ranked {
    /* we want to be executed before all default mouse listeners since we are just tracking the position and others may need it */
    rank = Ranked.DEFAULT_RANK - 200;

    override mouseMove(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        // we cannot simply use the offsetX and offsetY properties of the event since they also consider nested HTML elements
        // such as foreignObjects or the projection bars divs. Instead, we manually translate the client coordinates to the diagram
        const globalOrigin = target.root.canvasBounds;
        const clientToPosition = { x: event.clientX, y: event.clientY };
        const rootToPosition = Point.subtract(clientToPosition, globalOrigin);
        const positionOnDiagram = target.root.parentToLocal(rootToPosition);
        this.lastPosition = positionOnDiagram;
        return [];
    }
}
