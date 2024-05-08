/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
import { GModelElement, ISnapper, Point, TYPES, Writable } from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { IHelperLineManager } from '../helper-lines/helper-line-manager';
import { Direction, HelperLine, isHelperLine } from '../helper-lines/model';

/**
 * @deprecated The use of this class is discouraged. Use the {@link ChangeBoundsManager.createTracker}
 * instead which centralized a few aspects of the tracking.
 */
@injectable()
export class PositionSnapper {
    constructor(
        @optional() @inject(TYPES.ISnapper) protected snapper?: ISnapper,
        @optional() @inject(TYPES.IHelperLineManager) protected helperLineManager?: IHelperLineManager
    ) {}

    snapPosition(position: Point, element: GModelElement, isSnap: boolean = true): Point {
        return isSnap && this.snapper ? this.snapper.snap(position, element) : { x: position.x, y: position.y };
    }

    snapDelta(positionDelta: Point, element: GModelElement, isSnap: boolean, directions: Direction[]): Point {
        const delta: Writable<Point> = this.snapPosition(positionDelta, element, isSnap);
        const minimumDelta = this.getMinimumDelta(element, isSnap, directions);
        if (!minimumDelta) {
            return delta;
        }
        delta.x = Math.abs(delta.x) >= minimumDelta.x ? delta.x : 0;
        delta.y = Math.abs(delta.y) >= minimumDelta.y ? delta.y : 0;
        return delta;
    }

    protected getMinimumDelta(target: GModelElement, isSnap: boolean, directions: Direction[]): Point | undefined {
        return this.getHelperLineMinimum(target, isSnap, directions);
    }

    protected getHelperLineMinimum(target: GModelElement, isSnap: boolean, directions: Direction[]): Point | undefined {
        if (!this.helperLineManager) {
            return undefined;
        }
        const helperLines = target.root.children.filter(child => isHelperLine(child)) as HelperLine[];
        if (helperLines.length === 0) {
            return undefined;
        }

        const minimum: Writable<Point> = { x: 0, y: 0 };
        if (directions.includes(Direction.Left) && helperLines.some(line => line.isLeft || line.isCenter)) {
            minimum.x = this.helperLineManager.getMinimumMoveDelta(target, isSnap, Direction.Left);
        } else if (directions.includes(Direction.Right) && helperLines.some(line => line.isRight || line.isCenter)) {
            minimum.x = this.helperLineManager.getMinimumMoveDelta(target, isSnap, Direction.Right);
        }
        if (directions.includes(Direction.Up) && helperLines.some(line => line.isTop || line.isMiddle)) {
            minimum.y = this.helperLineManager.getMinimumMoveDelta(target, isSnap, Direction.Up);
        } else if (directions.includes(Direction.Down) && helperLines.some(line => line.isBottom || line.isMiddle)) {
            minimum.y = this.helperLineManager.getMinimumMoveDelta(target, isSnap, Direction.Down);
        }
        return minimum;
    }
}
