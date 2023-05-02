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
import {Args, Bounds, isBounds, Point, SModelElementSchema} from '@eclipse-glsp/protocol';
import { exportFeature, getRouteBounds, SEdge, SGraph, SModelElement, viewportFeature } from 'sprotty';
import { Containable, containerFeature } from '../features/hints/model';
import { Saveable, saveFeature } from '../features/save/model';

export class GLSPGraph extends SGraph implements Saveable, Containable {
    static override readonly DEFAULT_FEATURES = [viewportFeature, exportFeature, saveFeature, containerFeature];
    dirty = false;
    isContainableElement(input: string | SModelElement | SModelElementSchema): boolean {
        return true;
    }
}

export class GEdge extends SEdge {
    args: Args;
    override localToParent(point: Point | Bounds): Bounds {
        const bounds = getRouteBounds(this.routingPoints);
        const result = {
            x: point.x + bounds.x,
            y: point.y + bounds.y,
            width: -1,
            height: -1
        };
        if (isBounds(point)) {
            result.width = point.width;
            result.height = point.height;
        }
        return result;
    }

    override parentToLocal(point: Point | Bounds): Bounds {
        const bounds = getRouteBounds(this.routingPoints);
        const result = {
            x: point.x - bounds.x,
            y: point.y - bounds.y,
            width: -1,
            height: -1
        };
        if (isBounds(point)) {
            result.width = point.width;
            result.height = point.height;
        }
        return result;
    }
}
