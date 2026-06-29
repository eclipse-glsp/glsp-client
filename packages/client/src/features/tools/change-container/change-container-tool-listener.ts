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
import { Action, ChangeContainerOperation, CompoundOperation, GChildElement, GModelElement, Operation } from '@eclipse-glsp/sprotty';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { BoundsAwareModelElement, getMatchingElements, isNonRoutableSelectedMovableBoundsAware } from '../../../utils/gmodel-util';
import { getAbsolutePosition, toAbsolutePosition } from '../../../utils/viewpoint-util';
import { ContainerElement, isReparentable } from '../../hints/model';
import type { ChangeContainerTool } from './change-container-tool';
import { findTargetContainer } from './change-container-tool-feedback';

/**
 * Mouse listener that dispatches {@link ChangeContainerOperation}s when the user drops elements
 * onto a valid container. Also dispatches {@link EnableDefaultToolsAction} to restore the default tools
 * after the operation completes.
 */
export class ChangeContainerListener extends DragAwareMouseListener {
    constructor(protected tool: ChangeContainerTool) {
        super();
    }

    override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
        return this.handleChangeContainerOnServer(target, event);
    }

    protected handleChangeContainerOnServer(target: GModelElement, event: MouseEvent): Action[] {
        const movedElements = getMatchingElements(target.index, isNonRoutableSelectedMovableBoundsAware);
        // only reparentable elements can be moved between containers
        const reparentableElements = movedElements.filter(isReparentable);
        const actions: Action[] = [EnableDefaultToolsAction.create()];
        if (reparentableElements.length === 0) {
            return actions;
        }

        const position = getAbsolutePosition(target, event);
        const container = findTargetContainer(target.root, position, reparentableElements);
        if (!container) {
            return actions;
        }

        const operations = this.createChangeContainerOperations(reparentableElements, container);
        if (operations.length > 0) {
            actions.push(CompoundOperation.create(operations));
        }
        return actions;
    }

    protected createChangeContainerOperations(elements: BoundsAwareModelElement[], container: ContainerElement): Operation[] {
        return elements
            .filter(
                element =>
                    // skip elements already in the target container
                    (!(element instanceof GChildElement) || element.parent.id !== container.id) &&
                    // verify the container accepts this element type
                    container.isContainableElement(element)
            )
            .map(element =>
                ChangeContainerOperation.create({
                    elementId: element.id,
                    targetContainerId: container.id,
                    // use the element's current absolute position (after move feedback)
                    // so the server can convert it to coordinates relative to the new container
                    location: toAbsolutePosition(element)
                })
            );
    }
}
