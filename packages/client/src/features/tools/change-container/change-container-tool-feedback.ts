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
import { Action, GChildElement, GModelElement, GModelRoot, Point, findChildrenAtPosition } from '@eclipse-glsp/sprotty';
import { applyCssClasses, deleteCssClasses } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { BoundsAwareModelElement, getMatchingElements, isNonRoutableSelectedMovableBoundsAware } from '../../../utils/gmodel-util';
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

    constructor(protected override tool: ChangeContainerTool) {
        super(tool);
        this.containerFeedback = tool.createFeedbackEmitter();
    }

    protected override addMoveFeedback(trackedMove: TrackedMove, ctx: GModelElement, event: MouseEvent): void {
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
        // valid drop — clear start positions so elements stay at their dragged position
        this.elementId2startPos.clear();
        this.dispose();
        return [];
    }

    protected updateContainerFeedback(target: GModelElement, event: MouseEvent): void {
        const reparentableElements = this.getReparentableElements(target);
        if (reparentableElements.length === 0) {
            this.isValidDrop = false;
            this.clearContainerFeedback();
            return;
        }

        const position = getAbsolutePosition(target, event);
        const container = findTargetContainer(target.root, position, reparentableElements);
        if (!container) {
            this.isValidDrop = false;
            this.clearContainerFeedback();
            return;
        }

        // only update feedback if the target container changed
        if (this.previousTargetId === container.id) {
            return;
        }
        this.clearContainerFeedback();
        this.previousTargetId = container.id;

        const allAccepted = reparentableElements.every(
            element =>
                // element already in this container → always valid (no reparent needed)
                (element instanceof GChildElement && element.parent.id === container.id) || container.isContainableElement(element)
        );
        this.isValidDrop = allAccepted;

        const targetCss = allAccepted ? CSS_CHANGE_CONTAINER_TARGET_ALLOWED : CSS_CHANGE_CONTAINER_TARGET_NOT_ALLOWED;
        const elementCss = allAccepted ? CSS_CHANGE_CONTAINER_ELEMENT_ALLOWED : CSS_CHANGE_CONTAINER_ELEMENT_NOT_ALLOWED;
        this.containerFeedback.add(applyCssClasses(container, targetCss), deleteCssClasses(container, targetCss));
        reparentableElements.forEach(element => {
            this.containerFeedback.add(applyCssClasses(element, elementCss), deleteCssClasses(element, elementCss));
        });
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
        return getMatchingElements(target.index, isNonRoutableSelectedMovableBoundsAware).filter(isReparentable);
    }

    override dispose(): void {
        this.clearContainerFeedback();
        this.isValidDrop = false;
        super.dispose();
    }
}

/**
 * Finds the topmost {@link ContainerElement} at the given position, excluding the specified elements.
 * @param root The root element to search within.
 * @param position The absolute position to search at.
 * @param exclude Elements to exclude from the search (typically the dragged elements).
 * @returns The topmost container element at the position, or `undefined` if none is found.
 */
export function findTargetContainer(root: GModelRoot, position: Point, exclude: GModelElement[]): ContainerElement | undefined {
    const excludeIds = new Set(exclude.map(e => e.id));
    const elementsBelow = findChildrenAtPosition(root, position).filter(e => !excludeIds.has(e.id));
    // reverse to get the topmost (last-rendered) element first
    return [...elementsBelow].reverse().find((e): e is ContainerElement => isContainable(e));
}
