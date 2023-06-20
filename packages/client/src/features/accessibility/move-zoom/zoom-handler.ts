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

import { inject, injectable } from 'inversify';
import { throttle } from 'lodash';
import {
    Action,
    Bounds,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    Point,
    SChildElement,
    SModelElement,
    SModelRoot,
    SetViewportAction,
    TYPES,
    Viewport,
    findParentByFeature,
    isViewport
} from '~glsp-sprotty';
import { EditorContextService } from '../../../base/editor-context-service';
import { SelectableBoundsAware, getElements, isSelectableAndBoundsAware } from '../../../utils/smodel-util';

/**
 * Action for triggering zooming of the viewport.
 */
export interface ZoomViewportAction extends Action {
    kind: typeof ZoomViewportAction.KIND;
    /**
     * used to specify the amount by which the viewport should be zoomed
     */
    zoomFactor: number;
}

export namespace ZoomViewportAction {
    export const KIND = 'zoomViewportAction';

    export function is(object: any): object is ZoomViewportAction {
        return Action.hasKind(object, KIND);
    }

    export function create(zoomFactor: number): ZoomViewportAction {
        return { kind: KIND, zoomFactor };
    }
}

/**
 * Action for triggering zooming of the elements..
 */
export interface ZoomElementAction extends Action {
    kind: typeof ZoomElementAction.KIND;
    /**
     * used to specify the elements to be zoomed in/out
     */
    elementIds: string[];
    /**
     * used to specify the amount by which the viewport should be zoomed
     */
    zoomFactor: number;
}

export namespace ZoomElementAction {
    export const KIND = 'zoomElementAction';

    export function is(object: any): object is ZoomElementAction {
        return Action.hasKind(object, KIND);
    }

    export function create(elementIds: string[], zoomFactor: number): ZoomElementAction {
        return { kind: KIND, elementIds, zoomFactor };
    }
}

/* The ZoomViewportHandler class is an implementation of the IActionHandler interface that handles
zooming in and out of a viewport. */
@injectable()
export class ZoomViewportHandler implements IActionHandler {
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;

    static readonly defaultZoomInFactor = 1.1;
    static readonly defaultZoomOutFactor = 0.9;

    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    protected readonly throttledHandleViewportZoom = throttle((action: ZoomViewportAction) => this.handleZoomViewport(action), 150);

    handle(action: Action): void {
        if (ZoomViewportAction.is(action)) {
            this.throttledHandleViewportZoom(action);
        }
    }

    handleZoomViewport(action: ZoomViewportAction): void {
        const viewport = findParentByFeature(this.editorContextService.modelRoot, isViewport);
        if (!viewport) {
            return;
        }
        this.dispatcher.dispatch(this.setNewZoomFactor(viewport, action.zoomFactor));
    }

    protected setNewZoomFactor(viewport: SModelRoot & Viewport, zoomFactor: number): SetViewportAction {
        const newZoom = viewport.zoom * zoomFactor;

        const newViewport = {
            scroll: viewport.scroll,
            zoom: newZoom
        };

        return SetViewportAction.create(viewport.id, newViewport, { animate: true });
    }
}

/* The ZoomElementHandler class is an implementation of the IActionHandler interface that handles
zooming in and out of elements. */
@injectable()
export class ZoomElementHandler implements IActionHandler {
    @inject(EditorContextService)
    protected editorContextService: EditorContextService;
    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    protected readonly throttledHandleElementZoom = throttle((action: ZoomElementAction) => this.handleZoomElement(action), 150);

    handle(action: Action): void | Action | ICommand {
        if (ZoomElementAction.is(action)) {
            this.throttledHandleElementZoom(action);
        }
    }

    handleZoomElement(action: ZoomElementAction): void {
        const viewport = findParentByFeature(this.editorContextService.modelRoot, isViewport);
        if (!viewport) {
            return;
        }

        const elements = getElements(this.editorContextService.modelRoot.index, action.elementIds, isSelectableAndBoundsAware);
        const center = this.getCenter(viewport, elements);
        this.dispatcher.dispatch(this.setNewZoomFactor(viewport, action.zoomFactor, center));
    }

    protected getCenter(viewport: SModelRoot & Viewport, selectedElements: SelectableBoundsAware[]): Point {
        // Get bounds of elements based on the viewport
        const allBounds = selectedElements.map(e => this.boundsInViewport(viewport, e, e.bounds));
        const mergedBounds = allBounds.reduce((b0, b1) => Bounds.combine(b0, b1));
        return Bounds.center(mergedBounds);
    }

    // copy from center-fit.ts, translates the children bounds to the viewport bounds
    protected boundsInViewport(viewport: SModelRoot & Viewport, element: SModelElement, bounds: Bounds): Bounds {
        if (element instanceof SChildElement && element.parent !== viewport) {
            return this.boundsInViewport(viewport, element.parent, element.parent.localToParent(bounds) as Bounds);
        } else {
            return bounds;
        }
    }

    protected setNewZoomFactor(viewport: SModelRoot & Viewport, zoomFactor: number, point: Point): SetViewportAction {
        const newZoom = viewport.zoom * zoomFactor;

        const newViewport = {
            scroll: {
                x: point.x - (0.5 * viewport.canvasBounds.width) / newZoom,
                y: point.y - (0.5 * viewport.canvasBounds.height) / newZoom
            },
            zoom: newZoom
        };

        return SetViewportAction.create(viewport.id, newViewport, { animate: true });
    }
}
