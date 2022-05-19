/********************************************************************************
 * Copyright (c) 2020-2022 EclipseSource and others.
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
import { Point, Writable } from '@eclipse-glsp/protocol';
import { injectable } from 'inversify';
import { findParentByFeature, ISnapper, isViewport, SModelElement } from 'sprotty';

/**
 * A {@link ISnapper} implementation that snaps all elements onto a fixed gride size.
 * The default grid size is 10x10 pixel.
 * To configure a custom grid size  bind the `TYPES.ISnapper` service identifier
 * to constant value, e.g:
 *
 * ```ts
 * bind(TYPES.ISnapper).toConstantValue(new GridSnapper({x:25 ,y:25 }));
 * ```
 */
@injectable()
export class GridSnapper implements ISnapper {
    constructor(public grid: { x: number; y: number } = { x: 10, y: 10 }) {}

    snap(position: Point, element: SModelElement): Point {
        return {
            x: Math.round(position.x / this.grid.x) * this.grid.x,
            y: Math.round(position.y / this.grid.y) * this.grid.y
        };
    }
}

/**
 * This class can be used to calculate the current position, when an element is
 * moved. This includes node movements, node resizing (resize handle movement)
 * or edge routing-point movements.
 *
 * You can initialize a this class with a optional {@link ISnapper}. If a
 * snapper is present, the positions will be snapped to the defined grid.
 */
export class PointPositionUpdater {
    protected lastDragPosition?: Point;
    protected positionDelta: Writable<Point> = { x: 0, y: 0 };

    constructor(protected snapper?: ISnapper) {}

    /**
     * Init the position with the {@link Point} of your mouse cursor.
     * This method is normally called in the `mouseDown` event.
     * @param mousePosition current mouse position e.g `{x: event.pageX, y: event.pageY }`
     */
    public updateLastDragPosition(mousePosition: Point): void {
        this.lastDragPosition = mousePosition;
    }

    /**
     * Check if the mouse is currently not in a drag mode.
     * @returns true if the last drag position is undefined
     */
    public isLastDragPositionUndefined(): boolean {
        return this.lastDragPosition === undefined;
    }

    /**
     * Reset the updater for new movements.
     * This method is normally called in the `mouseUp` event.
     */
    public resetPosition(): void {
        this.lastDragPosition = undefined;
        this.positionDelta = { x: 0, y: 0 };
    }

    /**
     * Calculate the current position of your movement.
     * This method is normally called in the `mouseMove` event.
     * @param target node which is moved around
     * @param mousePosition current mouse position e.g `{x: event.pageX, y: event.pageY }`
     * @param isSnapEnabled if a snapper is defined you can disable it, e.g when a specific key is pressed `!event.altKey`
     * @returns current position or undefined if updater has no last drag position initialized
     */
    public updatePosition(target: SModelElement, mousePosition: Point, isSnapEnabled: boolean): Point | undefined {
        if (this.lastDragPosition) {
            const newDragPosition = mousePosition;

            const viewport = findParentByFeature(target, isViewport);
            const zoom = viewport?.zoom ?? 1;
            const dx = (mousePosition.x - this.lastDragPosition.x) / zoom;
            const dy = (mousePosition.y - this.lastDragPosition.y) / zoom;
            const deltaToLastPosition = { x: dx, y: dy };
            this.lastDragPosition = newDragPosition;

            // update position delta with latest delta
            this.positionDelta.x += deltaToLastPosition.x;
            this.positionDelta.y += deltaToLastPosition.y;

            // snap our delta and only send update if the position actually changes
            // otherwise accumulate delta until we do snap to an update
            const positionUpdate = this.snap(this.positionDelta, target, isSnapEnabled);
            if (positionUpdate.x === 0 && positionUpdate.y === 0) {
                return undefined;
            }

            // we update our position so we update our delta by the snapped position
            this.positionDelta.x -= positionUpdate.x;
            this.positionDelta.y -= positionUpdate.y;
            return positionUpdate;
        }
        return undefined;
    }

    protected snap(position: Point, element: SModelElement, isSnap: boolean): Point {
        return isSnap && this.snapper ? this.snapper.snap(position, element) : { x: position.x, y: position.y };
    }
}
