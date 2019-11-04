/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { injectable } from "inversify";
import {
    Action,
    Bounds,
    BoundsAware,
    ElementMove,
    includes,
    isBoundsAware,
    isMoveable,
    isSelectable,
    MoveAction,
    Point,
    PointToPointLine,
    SModelElement
} from "sprotty/lib";
import { FluentIterable, toArray } from "sprotty/lib/utils/iterable";

import { ApplyCursorCSSFeedbackAction, CursorCSS } from "../tool-feedback/cursor-feedback";
import { isBoundsAwareMoveable } from "./model";


export interface IMovementRestrictor {
    attemptMove(element: SModelElement, mousePoint: Point, target: SModelElement, delta: Point, result: Action[]): boolean
}

@injectable()
export class NoCollisionMovementRestrictor {
    hasCollided = false;
    /*
    * Attempt to perform an element move. Returns true if the move is not restricted anc can be applied successfull and false otherwise
    */
    attemptMove(element: SModelElement, mousePoint: Point, target: SModelElement, delta: Point, result: Action[]): boolean {
        if (!isBoundsAwareMoveable(element)) {
            return false;
        }
        let mouseOverElement: boolean = false;
        let willOverlap: boolean = false;
        // Create ghost element to check possible bounds
        const ghostElement = Object.create(element);

        ghostElement.bounds = this.getCenteredBoundsToPointer(mousePoint, element.bounds);
        // Set type to Ghost to keep tracking it through elements
        ghostElement.type = "Ghost";
        ghostElement.id = element.id;
        // Check collision for gost element (to see when it has passed beyond obstacle)
        const collisionTargetsGhost: SModelElement[] = this.getCollisionChain(target, ghostElement, delta, [])
            .filter(collidingElement => isSelectable(collidingElement) && !collidingElement.selected);

        // After collision the mouse is back inside the element => change cursor back to default
        if (this.hasCollided && includes(element.bounds, mousePoint)) {
            mouseOverElement = true;
            result.push(new ApplyCursorCSSFeedbackAction(CursorCSS.DEFAULT));
        }

        const selectedElements: FluentIterable<SModelElement> = target.root.index.all()
            .filter(selected => isSelectable(selected) && selected.selected);

        // If the ghost element has moved beyond the obstacle move the actual element there aswell
        // But only if a single element is selected (multi-selection jumps are not supported)
        if (this.hasCollided && collisionTargetsGhost.length === 0 && toArray(selectedElements).length === 1) {
            mouseOverElement = true;
            result.push(new ApplyCursorCSSFeedbackAction(CursorCSS.DEFAULT));

            if (element.id === ghostElement.id) {
                element.bounds = ghostElement.bounds;
            }
        }
        // Get only the valid, non-slected collision targets to avoid in-selection collisions
        const collisionTargets: SModelElement[] = this.getCollisionChain(target, element, delta, [])
            .filter(collidingElement => isSelectable(collidingElement) && !collidingElement.selected);

        if (collisionTargets.length > 0) {
            collisionTargets.forEach(collisionTarget => {
                if (isBoundsAware(collisionTarget)) {
                    // Only snap on first collision to avoid erratic jumps
                    if (!this.hasCollided) {
                        const snappedBounds = this.getSnappedBounds(element, collisionTarget);
                        const snapMoves: ElementMove[] = [];
                        snapMoves.push({
                            elementId: element.id,
                            fromPosition: {
                                x: element.position.x,
                                y: element.position.y
                            },
                            toPosition: {
                                x: snappedBounds.x,
                                y: snappedBounds.y
                            }
                        });
                        result.push(new MoveAction(snapMoves, false));
                    }
                    willOverlap = true;
                    this.hasCollided = true;
                    result.push(new ApplyCursorCSSFeedbackAction(CursorCSS.OVERLAP_FORBIDDEN));
                }
            });
        }
        if ((!willOverlap && !this.hasCollided) ||
            (this.hasCollided && !willOverlap && mouseOverElement)) {
            this.hasCollided = false;
            return true;
        }
        return false;
    }
    /**
       * Used to return the collision target(s) or the collision chain in case of multiple selected elements
       */
    getCollisionChain(target: SModelElement, element: SModelElement, delta: Point, collisionChain: SModelElement[]): SModelElement[] {
        if (isBoundsAwareMoveable(element)) {
            target.root.index.all()
                .filter(candidate => isSelectable(candidate) && element.id !== candidate.id && collisionChain.indexOf(candidate) < 0)
                .forEach(candidate => {
                    if (isMoveable(element) && isMoveable(candidate)) {
                        if (isBoundsAware(element) && isBoundsAware(candidate)) {
                            const futureBounds: Bounds = {
                                x: element.position.x + delta.x,
                                y: element.position.y + delta.y,
                                width: element.bounds.width,
                                height: element.bounds.height
                            };
                            if (isOverlappingBounds(futureBounds, candidate.bounds) && (!isOverlappingBounds(element.bounds, candidate.bounds) || element.type === "Ghost")) {
                                collisionChain.push(candidate);
                                if (isSelectable(candidate) && candidate.selected) {
                                    // Check what the selected candidate will collide with and add it to the chain
                                    collisionChain.push.apply(collisionChain, this.getCollisionChain(target, candidate, delta, collisionChain));

                                }
                            }
                        }
                    }
                });
        }
        return collisionChain;
    }

    /**
    * Returns bounds centered around the point
    */
    getCenteredBoundsToPointer(mousePoint: Point, bounds: Bounds): Bounds {
        const middleX = mousePoint.x - bounds.width / 2;
        const middleY = mousePoint.y - bounds.height / 2;
        const shiftedBounds: Bounds = { x: middleX, y: middleY, width: bounds.width, height: bounds.height };
        return shiftedBounds;
    }

    // Remove this and use the one from the improved routing branch
    getDistanceBetweenParallelLines(p1: Point, p2: Point, secondLine: PointToPointLine): Number {
        const numerator: number = Math.abs((secondLine.a * p1.x) + (secondLine.b * p1.y) - secondLine.c);
        const denominator: number = Math.sqrt(Math.pow(secondLine.a, 2) + Math.pow(secondLine.b, 2));
        return numerator / denominator;
    }

    /**
     * Snaps the element to the target in case of a collision
     */
    getSnappedBounds(element: SModelElement & BoundsAware, target: SModelElement & BoundsAware): Bounds {
        let snappedBounds = element.bounds;

        // Build corner points
        const elementTopLeft = {
            x: element.bounds.x,
            y: element.bounds.y
        };
        const elementTopRight = {
            x: element.bounds.x + element.bounds.width,
            y: element.bounds.y
        };
        const elementBottomLeft = {
            x: element.bounds.x,
            y: element.bounds.y + element.bounds.height
        };
        const elementBottomRight = {
            x: element.bounds.x + element.bounds.width,
            y: element.bounds.y + element.bounds.height
        };
        const targetTopLeft = {
            x: target.bounds.x,
            y: target.bounds.y
        };
        const targetTopRight = {
            x: target.bounds.x + target.bounds.width,
            y: target.bounds.y
        };
        const targetBottomLeft = {
            x: target.bounds.x,
            y: target.bounds.y + target.bounds.height
        };
        const targetBottomRight = {
            x: target.bounds.x + target.bounds.width,
            y: target.bounds.y + target.bounds.height
        };

        // Build lines
        const targetTopLine = new PointToPointLine(targetTopLeft, targetTopRight);
        const targetBottomLine = new PointToPointLine(targetBottomLeft, targetBottomRight);
        const targetLeftLine = new PointToPointLine(targetTopLeft, targetBottomLeft);
        const targetRightLine = new PointToPointLine(targetTopRight, targetBottomRight);

        // Compute distances
        const distanceTop = this.getDistanceBetweenParallelLines(elementBottomLeft, elementBottomRight, targetTopLine);
        const distanceBottom = this.getDistanceBetweenParallelLines(elementTopLeft, elementTopRight, targetBottomLine);
        const distanceLeft = this.getDistanceBetweenParallelLines(elementTopLeft, elementBottomLeft, targetRightLine);
        const distanceRight = this.getDistanceBetweenParallelLines(elementTopRight, elementBottomRight, targetLeftLine);

        const minimumCandidates: number[] = [];

        // Overlap on the horizontal lines
        if (isOverlapping1Dimension(element.bounds.x, element.bounds.width, target.bounds.x, target.bounds.width)) {
            minimumCandidates.push(distanceTop.valueOf());
            minimumCandidates.push(distanceBottom.valueOf());
        }
        // Overlap on the horizontal lines
        if (isOverlapping1Dimension(element.bounds.y, element.bounds.height, target.bounds.y, target.bounds.height)) {
            minimumCandidates.push(distanceLeft.valueOf());
            minimumCandidates.push(distanceRight.valueOf());
        }

        // Get minimum distance and then snap accordingly
        minimumCandidates.sort((a, b) => a - b);
        const minimumDistance = minimumCandidates[0];

        if (minimumDistance === distanceTop) {
            snappedBounds = {
                x: element.bounds.x,
                y: target.bounds.y - 1 - element.bounds.height,
                width: element.bounds.width,
                height: element.bounds.height
            };
        }
        if (minimumDistance === distanceBottom) {
            snappedBounds = {
                x: element.bounds.x,
                y: target.bounds.y + target.bounds.height + 1,
                width: element.bounds.width,
                height: element.bounds.height
            };
        }
        if (minimumDistance === distanceLeft) {
            snappedBounds = {
                x: target.bounds.x + target.bounds.width + 1,
                y: element.bounds.y,
                width: element.bounds.width,
                height: element.bounds.height
            };
        }
        if (minimumDistance === distanceRight) {
            snappedBounds = {
                x: target.bounds.x - 1 - element.bounds.width,
                y: element.bounds.y,
                width: element.bounds.width,
                height: element.bounds.height
            };
        }
        return snappedBounds;
    }

}

/**
* Used to check if 1D boxes (lines) overlap
*/
export function isOverlapping1Dimension(x1: number, width1: number, x2: number, width2: number): boolean {
    return x1 + width1 >= x2 && x2 + width2 >= x1;
}

/**
* Used to check if 2 bounds are overlapping
*/
export function isOverlappingBounds(bounds1: Bounds, bounds2: Bounds): boolean {
    return isOverlapping1Dimension(bounds1.x, bounds1.width, bounds2.x, bounds2.width) &&
        isOverlapping1Dimension(bounds1.y, bounds1.height, bounds2.y, bounds2.height);

}

