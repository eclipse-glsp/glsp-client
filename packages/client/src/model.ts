/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
    Args,
    Bounds,
    GModelElementSchema,
    GShapeElement,
    Point,
    SEdgeImpl,
    SGraphImpl,
    getRouteBounds,
    isBounds
} from '@eclipse-glsp/sprotty';
import { ArgsAware, argsFeature } from './base/args-feature';
import { Containable, containerFeature } from './features/hints/model';

export class GGraph extends SGraphImpl implements Containable, ArgsAware {
    static override readonly DEFAULT_FEATURES = [...SGraphImpl.DEFAULT_FEATURES, containerFeature, argsFeature];
    args?: Args;
    isContainableElement(_input: string | GShapeElement | GModelElementSchema): boolean {
        return true;
    }
}

export class GEdge extends SEdgeImpl implements ArgsAware {
    static override readonly DEFAULT_FEATURES = [...SEdgeImpl.DEFAULT_FEATURES, argsFeature];

    args?: Args;

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
