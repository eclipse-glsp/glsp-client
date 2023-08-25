/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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
    Bounds,
    Dimension,
    hasArrayProp,
    Viewport,
    BoundsAwareViewportCommand,
    getRouteBounds,
    isViewport,
    SChildElement,
    SEdge,
    SModelElement,
    SModelRoot,
    TYPES
} from '~glsp-sprotty';
import { inject, injectable } from 'inversify';
import { calcElementAndRoute } from '../../utils/smodel-util';

export interface RepositionAction extends Action {
    kind: typeof RepositionAction.KIND;
    elementIDs: string[];
}

export namespace RepositionAction {
    export const KIND = 'repositionAction';

    export function is(object: any): object is RepositionAction {
        return Action.hasKind(object, KIND) && hasArrayProp(object, 'elementIDs');
    }

    export function create(elementIDs: string[]): RepositionAction {
        return {
            kind: KIND,
            elementIDs
        };
    }
}

/**
 * Moves the viewport to an unvisible element, while maintaining the current zoom level.
 */
@injectable()
export class RepositionCommand extends BoundsAwareViewportCommand {
    static readonly KIND = RepositionAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RepositionAction) {
        super(true);
    }

    protected override boundsInViewport(element: SModelElement, bounds: Bounds, viewport: SModelRoot & Viewport): Bounds {
        if (element instanceof SChildElement && element.parent !== viewport) {
            return this.boundsInViewport(element.parent, element.parent.localToParent(bounds) as Bounds, viewport);
        } else if (element instanceof SEdge) {
            const edgeBounds = getRouteBounds(calcElementAndRoute(element).newRoutingPoints ?? []);

            if (element instanceof SChildElement && element.parent !== viewport) {
                return this.boundsInViewport(element.parent, element.parent.localToParent(edgeBounds), viewport);
            }

            return edgeBounds;
        }

        return bounds;
    }

    getElementIds(): string[] {
        return this.action.elementIDs;
    }

    getNewViewport(bounds: Bounds, model: SModelRoot): Viewport | undefined {
        if (!Dimension.isValid(model.canvasBounds)) {
            return undefined;
        }

        if (isViewport(model)) {
            const zoom = model.zoom;
            const c = Bounds.center(bounds);

            if (this.isFullyVisible(bounds, model)) {
                return undefined;
            } else {
                return {
                    scroll: {
                        x: c.x - (0.5 * model.canvasBounds.width) / zoom,
                        y: c.y - (0.5 * model.canvasBounds.height) / zoom
                    },
                    zoom: zoom
                };
            }
        }

        return undefined;
    }

    protected isFullyVisible(bounds: Bounds, viewport: SModelRoot & Viewport): boolean {
        return (
            bounds.x >= viewport.scroll.x &&
            bounds.x + bounds.width <= viewport.scroll.x + viewport.canvasBounds.width / viewport.zoom &&
            bounds.y >= viewport.scroll.y &&
            bounds.y + bounds.height <= viewport.scroll.y + viewport.canvasBounds.height / viewport.zoom
        );
    }
}
