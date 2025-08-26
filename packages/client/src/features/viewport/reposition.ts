/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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
    BoundsAwareViewportCommand,
    Dimension,
    GChildElement,
    GModelElement,
    GModelRoot,
    Point,
    TYPES,
    Viewport,
    getRouteBounds,
    hasArrayProp
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';
import { GEdge } from '../../model';
import { calcElementAndRoute } from '../../utils/gmodel-util';

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

    @inject(EditorContextService) protected readonly editorContext: EditorContextService;

    constructor(@inject(TYPES.Action) protected action: RepositionAction) {
        super(true);
    }

    protected override boundsInViewport(element: GModelElement, bounds: Bounds, viewport: GModelRoot & Viewport): Bounds {
        if (element instanceof GChildElement && element.parent !== viewport) {
            return this.boundsInViewport(element.parent, element.parent.localToParent(bounds) as Bounds, viewport);
        } else if (element instanceof GEdge) {
            const edgeBounds = getRouteBounds(calcElementAndRoute(element).newRoutingPoints ?? []);

            if (element instanceof GChildElement && element.parent !== viewport) {
                return this.boundsInViewport(element.parent, element.parent.localToParent(edgeBounds), viewport);
            }

            return edgeBounds;
        }

        return bounds;
    }

    getElementIds(): string[] {
        return this.action.elementIDs;
    }

    getNewViewport(combinedElementBounds: Bounds, model: GModelRoot): Viewport | undefined {
        if (!Dimension.isValid(model.canvasBounds)) {
            return undefined;
        }

        const viewport = this.editorContext.viewport;
        if (viewport) {
            if (this.isFullyVisible(combinedElementBounds, viewport)) {
                return undefined;
            } else {
                const zoom = viewport.zoom;
                const centerOfElements = Bounds.center(combinedElementBounds);
                const canvasCenter = Dimension.center(model.canvasBounds);
                const scrollCenter = Point.subtract(centerOfElements, canvasCenter);
                const scroll = Point.map(scrollCenter, coordinate => coordinate / zoom);
                return { scroll, zoom };
            }
        }

        return undefined;
    }

    protected isFullyVisible(bounds: Bounds, viewport: GModelRoot & Viewport): boolean {
        return (
            bounds.x >= viewport.scroll.x &&
            bounds.x + bounds.width <= viewport.scroll.x + viewport.canvasBounds.width / viewport.zoom &&
            bounds.y >= viewport.scroll.y &&
            bounds.y + bounds.height <= viewport.scroll.y + viewport.canvasBounds.height / viewport.zoom
        );
    }
}
