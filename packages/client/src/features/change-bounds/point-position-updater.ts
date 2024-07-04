/********************************************************************************
 * Copyright (c) 2020-2024 EclipseSource and others.
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
/* eslint-disable import/no-deprecated */
/* eslint-disable deprecation/deprecation */

import { GModelElement, ISnapper, Point, Writable } from '@eclipse-glsp/sprotty';
import { calculateDeltaBetweenPoints } from '../../utils/gmodel-util';
import { isMouseEvent } from '../../utils/html-utils';
import { IHelperLineManager } from '../helper-lines/helper-line-manager';
import { Direction, getDirectionOf } from '../helper-lines/model';
import { PositionSnapper } from './position-snapper';
import { useSnap } from './snap';

/**
 * This class can be used to calculate the current position, when an element is
 * moved. This includes node movements, node resizing (resize handle movement)
 * or edge routing-point movements.
 *
 * You can initialize a this class with a optional {@link ISnapper}. If a
 * snapper is present, the positions will be snapped to the defined grid.
 *
 * @deprecated The use of this class is discouraged. Use the {@link ChangeBoundsManager.createTracker}
 * instead which centralized a few aspects of the tracking.
 */
export class PointPositionUpdater {
    protected positionSnapper: PositionSnapper;
    protected lastDragPosition?: Point;
    protected positionDelta: Writable<Point> = { x: 0, y: 0 };

    constructor(snapper?: PositionSnapper);
    constructor(snapper?: ISnapper, helperLineManager?: IHelperLineManager);
    constructor(first?: PositionSnapper | ISnapper, helperLineManager?: IHelperLineManager) {
        this.positionSnapper = first instanceof PositionSnapper ? first : new PositionSnapper(first, helperLineManager);
    }

    /**
     * Init the position with the {@link Point} of your mouse cursor.
     * This method is normally called in the `mouseDown` event.
     * @param mousePosition current mouse position e.g `{x: event.pageX, y: event.pageY }`
     */
    public updateLastDragPosition(mousePosition: Point): void;
    public updateLastDragPosition(mouseEvent: MouseEvent): void;
    public updateLastDragPosition(first: Point | MouseEvent): void {
        this.lastDragPosition = isMouseEvent(first) ? { x: first.pageX, y: first.pageY } : first;
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
     * @param useSnap if a snapper is defined you can disable it, e.g when a specific key is pressed `!event.shiftKey`
     * @param direction the direction in which the position is updated, will be calculated if not provided
     * @returns delta to previous position or undefined if no delta should be applied
     */
    public updatePosition(target: GModelElement, mousePosition: Point, useSnap: boolean, direction?: Direction[]): Point | undefined;
    public updatePosition(target: GModelElement, mouseEvent: MouseEvent, direction?: Direction[]): Point | undefined;
    public updatePosition(
        target: GModelElement,
        second: Point | MouseEvent,
        third?: boolean | Direction[],
        fourth?: Direction[]
    ): Point | undefined {
        if (!this.lastDragPosition) {
            return undefined;
        }
        const mousePosition = isMouseEvent(second) ? { x: second.pageX, y: second.pageY } : second;
        const shouldSnap = typeof third === 'boolean' ? third : useSnap(second as MouseEvent);
        const direction = typeof third !== 'boolean' ? third : fourth;

        // calculate update to last drag position
        const deltaToLastPosition = calculateDeltaBetweenPoints(mousePosition, this.lastDragPosition, target);
        this.lastDragPosition = mousePosition;
        if (Point.equals(deltaToLastPosition, Point.ORIGIN)) {
            return undefined;
        }

        // accumulate position delta with latest delta
        this.positionDelta.x += deltaToLastPosition.x;
        this.positionDelta.y += deltaToLastPosition.y;

        const directions = direction ?? getDirectionOf(this.positionDelta);

        // only send update if the position actually changes
        // otherwise accumulate delta until we get to an update
        const positionUpdate = this.positionSnapper.snapDelta(this.positionDelta, target, shouldSnap, directions);
        if (Point.equals(positionUpdate, Point.ORIGIN)) {
            return undefined;
        }
        // we update our position so we update our delta by the snapped position
        this.positionDelta.x -= positionUpdate.x;
        this.positionDelta.y -= positionUpdate.y;
        return positionUpdate;
    }
}
