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
    DOMHelper,
    findParentByFeature,
    GChildElement,
    GModelElement,
    GModelRoot,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    isViewport,
    MoveViewportAction,
    Point,
    SetViewportAction,
    TYPES,
    Viewport
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';
import { FocusTracker } from '../../base/focus/focus-tracker';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { EnableDefaultToolsAction } from '../../base/tool-manager/tool';
import { getElements, isSelectableAndBoundsAware, SelectableBoundsAware } from '../../utils/gmodel-util';
import { FocusDomAction } from '../accessibility/actions';
import { ZoomAction } from './zoom-viewport-action';

/**
 * Focuses the graph on different actions.
 */
@injectable()
export class RestoreViewportHandler implements IActionHandler, IDiagramStartup {
    @inject(TYPES.DOMHelper)
    protected domHelper: DOMHelper;

    @inject(FocusTracker)
    protected focusTracker: FocusTracker;

    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    handle(action: Action): void | Action {
        if (EnableDefaultToolsAction.is(action) || (FocusDomAction.is(action) && action.id === 'graph')) {
            this.focusGraph();
        }
    }

    get graphSelector(): string {
        const rootId = CSS.escape(this.domHelper.createUniqueDOMElementId(this.editorContext.modelRoot));
        return `#${rootId}`;
    }

    async postRequestModel(): Promise<void> {
        await this.waitForElement(this.graphSelector);
        this.focusGraph();
    }

    protected focusGraph(): void {
        if (this.focusTracker.hasFocus) {
            const container = this.focusTracker.diagramElement?.querySelector<HTMLElement>(this.graphSelector);
            container?.focus();
        }
    }

    protected waitForElement(selector: string): Promise<Element | null> {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
}

/**
 * Handles moving the viewport.
 */
@injectable()
export class MoveViewportHandler implements IActionHandler {
    @inject(EditorContextService)
    protected readonly editorContextService: EditorContextService;

    handle(action: MoveViewportAction): void | Action | ICommand {
        return this.handleMoveViewport(action);
    }

    protected handleMoveViewport(action: MoveViewportAction): Action | undefined {
        const viewport = findParentByFeature(this.editorContextService.modelRoot, isViewport);
        if (!viewport) {
            return;
        }
        const newViewport: Viewport = {
            scroll: {
                x: viewport.scroll.x + action.moveX,
                y: viewport.scroll.y + action.moveY
            },
            zoom: viewport.zoom
        };

        return SetViewportAction.create(viewport.id, newViewport, { animate: false });
    }
}

/*
 * Handles zooming in and out of the viewport.
 */
@injectable()
export class ZoomHandler implements IActionHandler {
    @inject(EditorContextService)
    protected readonly editorContextService: EditorContextService;
    @inject(TYPES.IActionDispatcher)
    protected readonly actionDispatcher: IActionDispatcher;

    handle(action: ZoomAction): Action | void {
        if (action.elementIds) {
            return this.handleZoomElement(action.elementIds, action.zoomFactor);
        } else {
            return this.handleZoomViewport(action.zoomFactor);
        }
    }

    protected handleZoomViewport(zoomFactor: number): Action | undefined {
        const viewport = this.editorContextService.viewport;
        if (!viewport) {
            return;
        }
        return SetViewportAction.create(viewport.id, { scroll: viewport.scroll, zoom: viewport.zoom * zoomFactor }, { animate: false });
    }

    protected handleZoomElement(elementIds: string[], zoomFactor: number): Action | undefined {
        const viewport = this.editorContextService.viewport;
        if (!viewport) {
            return;
        }

        const elements = getElements(viewport.index, elementIds, isSelectableAndBoundsAware);
        const center = this.getCenter(viewport, elements);

        const newZoom = viewport.zoom * zoomFactor;

        const newViewport = {
            scroll: {
                x: center.x - (0.5 * viewport.canvasBounds.width) / newZoom,
                y: center.y - (0.5 * viewport.canvasBounds.height) / newZoom
            },
            zoom: newZoom
        };

        return SetViewportAction.create(viewport.id, newViewport, { animate: false });
    }

    protected getCenter(viewport: GModelRoot & Viewport, selectedElements: SelectableBoundsAware[]): Point {
        // Get bounds of elements based on the viewport
        const allBounds = selectedElements.map(e => this.boundsInViewport(viewport, e, e.bounds));
        const mergedBounds = allBounds.reduce((b0, b1) => Bounds.combine(b0, b1));
        return Bounds.center(mergedBounds);
    }

    protected boundsInViewport(viewport: GModelRoot & Viewport, element: GModelElement, bounds: Bounds): Bounds {
        if (element instanceof GChildElement && element.parent !== viewport) {
            return this.boundsInViewport(viewport, element.parent, element.parent.localToParent(bounds) as Bounds);
        } else {
            return bounds;
        }
    }
}
