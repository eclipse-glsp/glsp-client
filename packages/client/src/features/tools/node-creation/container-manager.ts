/********************************************************************************
 * Copyright (c) 2024-2025 EclipseSource and others.
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

import { GModelElement, Point, TYPES, findChildrenAtPosition } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { CSS_GHOST_ELEMENT, CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { FeedbackEmitter } from '../../../base/feedback/feedback-emitter';
import { ContainerElement, isContainable } from '../../hints/model';
import { IChangeBoundsManager } from '../change-bounds/change-bounds-manager';

export interface InsertOptions extends Record<string, unknown> {
    /** Flag to indicate whether the location within a container needs to be valid. Default: false */
    validateLocationInContainer?: boolean;

    /** Overwrite for location validation if validation result is already known. Default: undefined */
    validLocationOverwrite?: boolean;

    /** Mouse event to be used for finding the container. Default: undefined */
    evt?: MouseEvent;
}

export const DEFAULT_INSERT_OPTIONS: InsertOptions = {
    validateLocationInContainer: false
};

export interface TrackedInsert {
    elementTypeId: string;
    location: Point;
    container?: GModelElement;
    valid: boolean;
    options: InsertOptions;
}

export interface IContainerManager {
    insert(proxy: GModelElement, location: Point, elementTypeId: string, opts?: Partial<InsertOptions>): TrackedInsert;
    isCreationAllowed(container: ContainerElement | undefined, elementTypeId: string, opts?: Partial<InsertOptions>): boolean;
    findContainer(location: Point, ctx: GModelElement, evt?: MouseEvent): ContainerElement | undefined;
    addInsertFeedback(feedback: FeedbackEmitter, trackedInsert: TrackedInsert, ctx?: GModelElement, event?: MouseEvent): FeedbackEmitter;
}

/**
 * The default {@link IContainerManager} implementation.
 * This class class manages the insertion of elements into containers by validating their positions and types,
 * providing feedback on the insertion process, and determining the appropriate container based on the location and context.
 */
@injectable()
export class ContainerManager implements IContainerManager {
    @inject(TYPES.IChangeBoundsManager) protected readonly changeBoundsManager: IChangeBoundsManager;

    insert(proxy: GModelElement, location: Point, elementTypeId: string, opts?: Partial<InsertOptions>): TrackedInsert {
        const options = { ...DEFAULT_INSERT_OPTIONS, ...opts };
        const container = this.findContainer(location, proxy, opts?.evt);
        let valid = this.isCreationAllowed(container, elementTypeId, opts);
        if (valid && (!container || options.validateLocationInContainer)) {
            // we need to check whether the location is valid either because we do not have a container or the option is set
            valid = opts?.validLocationOverwrite ?? this.changeBoundsManager.hasValidPosition(proxy, location);
        }
        return { elementTypeId, container, location, valid, options };
    }

    isCreationAllowed(container: ContainerElement | undefined, elementTypeId: string, opts?: Partial<InsertOptions>): boolean {
        return !container || container.isContainableElement(elementTypeId);
    }

    findContainer(location: Point, ctx: GModelElement, evt?: MouseEvent): ContainerElement | undefined {
        // reverse order of children to find the innermost, top-rendered containers first
        return [ctx.root, ...findChildrenAtPosition(ctx.root, location)]
            .reverse()
            .find(element => isContainable(element) && !element.cssClasses?.includes(CSS_GHOST_ELEMENT)) as ContainerElement | undefined;
    }

    addInsertFeedback(feedback: FeedbackEmitter, trackedInsert: TrackedInsert, ctx?: GModelElement, event?: MouseEvent): FeedbackEmitter {
        // cursor feedback
        if (!trackedInsert.valid) {
            feedback.add(cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED), cursorFeedbackAction(CursorCSS.DEFAULT));
        } else {
            feedback.add(cursorFeedbackAction(CursorCSS.NODE_CREATION), cursorFeedbackAction());
        }
        return feedback;
    }
}
