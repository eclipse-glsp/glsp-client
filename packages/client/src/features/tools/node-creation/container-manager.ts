/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { GModelElement, Point, findChildrenAtPosition } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { CSS_GHOST_ELEMENT, CursorCSS, FeedbackEmitter, cursorFeedbackAction } from '../../../base';
import { ContainerElement, isContainable } from '../../hints';
import { ChangeBoundsManager } from '../change-bounds';

export interface TrackedInsert {
    elementTypeId: string;
    location: Point;
    container?: GModelElement;
    valid: boolean;
}

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

@injectable()
export class ContainerManager {
    @inject(ChangeBoundsManager) protected readonly changeBoundsManager: ChangeBoundsManager;

    insert(proxy: GModelElement, location: Point, elementTypeId: string, opts?: Partial<InsertOptions>): TrackedInsert {
        const options = { ...DEFAULT_INSERT_OPTIONS, ...opts };
        const container = this.findContainer(location, proxy, opts?.evt);
        let valid = !container || container.isContainableElement(elementTypeId);
        if (valid && (!container || options.validateLocationInContainer)) {
            // we need to check whether the location is valid either because we do not have a container or the option is set
            valid = opts?.validLocationOverwrite ?? this.changeBoundsManager.hasValidPosition(proxy, location);
        }
        return { elementTypeId, container, location, valid };
    }

    findContainer(location: Point, ctx: GModelElement, evt?: MouseEvent): ContainerElement | undefined {
        // reverse order of children to find the innermost, top-rendered containers first
        return findChildrenAtPosition(ctx.root, location)
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
