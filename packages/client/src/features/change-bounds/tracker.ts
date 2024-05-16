/********************************************************************************
 * Copyright (c) 2024 Axon Ivy AG and others.
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
import { Disposable, MousePositionTracker, Movement, Point, Vector } from '@eclipse-glsp/sprotty';

export class MovementCalculator implements Disposable {
    protected position?: Point;

    setPosition(position: Point): void {
        this.position = { ...position };
    }

    updatePosition(param: Vector | Movement): void {
        const vector = Vector.is(param) ? param : param.vector;
        this.setPosition(Point.add(this.position ?? Point.ORIGIN, vector));
    }

    get hasPosition(): boolean {
        return this.position !== undefined;
    }

    calculateMoveTo(targetPosition: Point): Movement {
        return !this.position ? Movement.ZERO : Point.move(this.position, targetPosition);
    }

    dispose(): void {
        this.position = undefined;
    }
}

export class DiagramMovementCalculator extends MovementCalculator {
    constructor(readonly positionTracker: MousePositionTracker) {
        super();
    }

    init(): void {
        const position = this.positionTracker.lastPositionOnDiagram;
        if (position) {
            this.setPosition(position);
        }
    }

    calculateMoveToCurrent(): Movement {
        const targetPosition = this.positionTracker.lastPositionOnDiagram;
        return targetPosition ? this.calculateMoveTo(targetPosition) : Movement.ZERO;
    }

    reset(): void {
        this.dispose();
    }
}
