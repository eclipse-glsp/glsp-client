/********************************************************************************
 * Copyright (c) 2025-2026 EclipseSource and others.
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
import { Action, BringToFrontAction, GChildElement, GModelElement, GModelRoot, Point, findChildrenAtPosition } from '@eclipse-glsp/sprotty';
import { applyCssClasses, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import {
    BoundsAwareModelElement,
    findTopLevelElementByFeature,
    getMatchingElements,
    isNonRoutableSelectedMovableBoundsAware
} from '../../../utils/gmodel-util';
import { getAbsolutePosition } from '../../../utils/viewpoint-util';
import { ContainerElement, isContainable, isReparentable } from '../../hints/model';
import { FeedbackMoveMouseListener } from '../change-bounds/change-bounds-tool-move-feedback';
import { TrackedMove } from '../change-bounds/change-bounds-tracker';
import type { ChangeContainerTool } from './change-container-tool';

/** CSS class applied to a target container that accepts the dragged element types. */
export const CSS_CHANGE_CONTAINER_TARGET_ALLOWED = 'change-container-target-allowed';
/** CSS class applied to a target container that rejects the dragged element types. */
export const CSS_CHANGE_CONTAINER_TARGET_NOT_ALLOWED = 'change-container-target-not-allowed';
/** CSS class applied to a dragged element when the current target container accepts it. */
export const CSS_CHANGE_CONTAINER_ELEMENT_ALLOWED = 'change-container-element-allowed';
/** CSS class applied to a dragged element when the current target container rejects it. */
export const CSS_CHANGE_CONTAINER_ELEMENT_NOT_ALLOWED = 'change-container-element-not-allowed';

/**
 * Extended {@link FeedbackMoveMouseListener} that adds container-specific CSS feedback during drag.
 * Highlights the target container as valid or invalid based on whether it accepts the dragged element types,
 * using the {@link CSS_CHANGE_CONTAINER_TARGET_ALLOWED}/{@link CSS_CHANGE_CONTAINER_TARGET_NOT_ALLOWED}
 * and {@link CSS_CHANGE_CONTAINER_ELEMENT_ALLOWED}/{@link CSS_CHANGE_CONTAINER_ELEMENT_NOT_ALLOWED} CSS classes.
 * Skips movement restriction feedback since it does not apply during container changes.
 * If the drop target is invalid, the move is reverted on mouse-up.
 */
export class ChangeContainerFeedbackListener extends FeedbackMoveMouseListener {
    protected containerFeedback: FeedbackEmitter;
    protected previousTargetId?: string;
    protected isValidDrop = false;
    protected validElementIds = new Set<string>();
    // cached for the duration of a single drag to avoid rescanning the model index on every mouse move
    protected reparentableElements?: BoundsAwareModelElement[];

    constructor(protected override tool: ChangeContainerTool) {
        super(tool);
        this.containerFeedback = tool.createFeedbackEmitter();
    }

    protected override initializeElementsToMove(root: GModelRoot): void {
        super.initializeElementsToMove(root);
        this.reparentableElements = getMatchingElements(root.index, isNonRoutableSelectedMovableBoundsAware).filter(isReparentable);
        // bring moved elements and their parent containers to front so they render above other containers during drag
        const ids: string[] = [];
        for (const id of this.elementId2startPos.keys()) {
            const element = root.index.getById(id);
            if (element instanceof GChildElement) {
                // bring the topmost ancestor below root to front so it renders above sibling containers
                const topLevel = findTopLevelElementByFeature(element, (e): e is GChildElement => e instanceof GChildElement);
                if (topLevel) {
                    ids.push(topLevel.id);
                }
            }
            ids.push(id);
        }
        if (ids.length > 0) {
            this.tool.dispatchActions([BringToFrontAction.create(ids)]);
        }
    }

    protected override addMoveFeedback(_trackedMove: TrackedMove, _ctx: GModelElement, _event: MouseEvent): void {
        // skip movement restrictor — it does not apply during container changes
    }

    override draggingMouseMove(target: GModelElement, event: MouseEvent): Action[] {
        const result = super.draggingMouseMove(target, event);
        this.updateContainerFeedback(target, event);
        return result;
    }

    override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        if (!this.isValidDrop) {
            // invalid drop target — keep all start positions so dispose() reverts the move
            this.dispose();
            return [];
        }
        if (!this.tool.movementOptions.allElementsNeedToBeValid) {
            // only clear start positions of accepted elements so they stay at their dragged position;
            // rejected elements keep their start positions and get reverted on dispose
            this.validElementIds.forEach(id => this.elementId2startPos.delete(id));
        } else {
            // all accepted — clear all start positions so elements stay
            this.elementId2startPos.clear();
        }
        this.dispose();
        return [];
    }

    protected updateContainerFeedback(target: GModelElement, event: MouseEvent): void {
        const reparentableElements = this.getReparentableElements(target);
        if (reparentableElements.length === 0) {
            this.isValidDrop = false;
            this.validElementIds.clear();
            this.clearContainerFeedback();
            return;
        }

        const position = getAbsolutePosition(target, event);
        const container = findTargetContainer(target.root, position, reparentableElements);
        if (!container) {
            this.isValidDrop = false;
            this.validElementIds.clear();
            this.clearContainerFeedback();
            return;
        }

        // only update feedback if the target container changed
        if (this.previousTargetId === container.id) {
            return;
        }
        this.clearContainerFeedback();
        this.previousTargetId = container.id;

        this.validElementIds.clear();
        reparentableElements.forEach(element => {
            if (isAcceptedContainer(element, container)) {
                this.validElementIds.add(element.id);
            }
        });
        const allAccepted = this.validElementIds.size === reparentableElements.length;
        const anyAccepted = this.validElementIds.size > 0;

        if (this.tool.movementOptions.allElementsNeedToBeValid) {
            // all-or-nothing: drop is only valid if every element is accepted
            this.isValidDrop = allAccepted;
            const targetCss = allAccepted ? CSS_CHANGE_CONTAINER_TARGET_ALLOWED : CSS_CHANGE_CONTAINER_TARGET_NOT_ALLOWED;
            const elementCss = allAccepted ? CSS_CHANGE_CONTAINER_ELEMENT_ALLOWED : CSS_CHANGE_CONTAINER_ELEMENT_NOT_ALLOWED;
            this.containerFeedback.add(applyCssClasses(container, targetCss), deleteCssClasses(container, targetCss));
            reparentableElements.forEach(element => {
                this.containerFeedback.add(applyCssClasses(element, elementCss), deleteCssClasses(element, elementCss));
            });
        } else {
            // per-element: drop is valid if at least one element is accepted
            this.isValidDrop = anyAccepted;
            const targetCss = anyAccepted ? CSS_CHANGE_CONTAINER_TARGET_ALLOWED : CSS_CHANGE_CONTAINER_TARGET_NOT_ALLOWED;
            this.containerFeedback.add(applyCssClasses(container, targetCss), deleteCssClasses(container, targetCss));
            reparentableElements.forEach(element => {
                const elementCss = this.validElementIds.has(element.id)
                    ? CSS_CHANGE_CONTAINER_ELEMENT_ALLOWED
                    : CSS_CHANGE_CONTAINER_ELEMENT_NOT_ALLOWED;
                this.containerFeedback.add(applyCssClasses(element, elementCss), deleteCssClasses(element, elementCss));
            });
        }
        this.containerFeedback.submit();
    }

    protected clearContainerFeedback(): void {
        if (this.previousTargetId !== undefined) {
            this.containerFeedback.dispose();
            this.containerFeedback = this.tool.createFeedbackEmitter();
            this.previousTargetId = undefined;
        }
    }

    protected getReparentableElements(target: GModelElement): BoundsAwareModelElement[] {
        // use the cache populated at drag start; fall back to a fresh scan if the drag has not been initialized yet
        return (
            this.reparentableElements ?? getMatchingElements(target.index, isNonRoutableSelectedMovableBoundsAware).filter(isReparentable)
        );
    }

    override dispose(): void {
        this.clearContainerFeedback();
        this.isValidDrop = false;
        this.validElementIds.clear();
        this.reparentableElements = undefined;
        super.dispose();
    }
}

/**
 * Finds the topmost {@link ContainerElement} at the given position, excluding the specified elements.
 * The {@link GModelRoot} itself is considered as a fallback container so that elements can be reparented
 * to the diagram (root) level when no nested container is under the cursor.
 * @param root The root element to search within.
 * @param position The absolute position to search at.
 * @param exclude Elements to exclude from the search (typically the dragged elements).
 * @returns The topmost container element at the position, or `undefined` if none is found.
 */
export function findTargetContainer(root: GModelRoot, position: Point, exclude: GModelElement[]): ContainerElement | undefined {
    const excludeIds = new Set(exclude.map(e => e.id));
    // include the root as a fallback candidate so reparenting to the diagram level is possible;
    // reverse to get the topmost (last-rendered) nested element first, with the root as last resort
    const candidates = [root, ...findChildrenAtPosition(root, position)].filter(e => !excludeIds.has(e.id));
    return candidates.reverse().find((e): e is ContainerElement => isContainable(e));
}

/**
 * Determines whether the given `container` accepts the given `element` as a (re-)parenting target.
 * An element is accepted if it either already resides in the container (i.e. a no-op move) or if the
 * container declares the element type as containable via {@link ContainerElement.isContainableElement}.
 * @param element The element that should be reparented.
 * @param container The prospective target container.
 * @returns `true` if the container accepts the element, `false` otherwise.
 */
export function isAcceptedContainer(element: GModelElement, container: ContainerElement): boolean {
    return (element instanceof GChildElement && element.parent.id === container.id) || container.isContainableElement(element);
}
