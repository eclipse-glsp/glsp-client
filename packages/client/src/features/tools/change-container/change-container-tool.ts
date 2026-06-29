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
import { inject, injectable, optional } from 'inversify';

import { ChangeContainerOperation, Disposable, MouseListener, TYPES } from '@eclipse-glsp/sprotty';
import { ISelectionListener, SelectionService } from '../../../base/selection-service';
import { BaseEditTool } from '../base-tools';
import { IChangeBoundsManager } from '../change-bounds/change-bounds-manager';
import { IMovementOptions } from '../change-bounds/change-bounds-tool';
import { FeedbackMoveMouseListener, MoveFeedbackTool } from '../change-bounds/change-bounds-tool-move-feedback';
import { ChangeBoundsTracker } from '../change-bounds/change-bounds-tracker';
import { ChangeContainerFeedbackListener } from './change-container-tool-feedback';
import { ChangeContainerListener } from './change-container-tool-listener';
export {
    ChangeContainerFeedbackListener,
    CSS_CHANGE_CONTAINER_ELEMENT_ALLOWED,
    CSS_CHANGE_CONTAINER_ELEMENT_NOT_ALLOWED,
    CSS_CHANGE_CONTAINER_TARGET_ALLOWED,
    CSS_CHANGE_CONTAINER_TARGET_NOT_ALLOWED,
    findTargetContainer
} from './change-container-tool-feedback';
export { ChangeContainerListener } from './change-container-tool-listener';

/**
 * Tool that allows users to re-parent elements by dragging them into a new container.
 * It reuses the {@link FeedbackMoveMouseListener} for visual drag feedback and dispatches
 * {@link ChangeContainerOperation}s on mouse-up to move selected elements into the container at the cursor position.
 *
 * During drag, the {@link ChangeContainerFeedbackListener} applies CSS feedback to both the target container
 * and the dragged elements, indicating whether the drop is valid. If the drop is invalid, the move is reverted.
 *
 * After completing the operation, default tools are re-enabled via {@link EnableDefaultToolsAction}.
 */
@injectable()
export class ChangeContainerTool extends BaseEditTool implements MoveFeedbackTool {
    static ID = 'glsp.change-container-tool';

    @inject(SelectionService) protected selectionService: SelectionService;
    @inject(TYPES.IChangeBoundsManager) readonly changeBoundsManager: IChangeBoundsManager;
    @inject(TYPES.IMovementOptions) @optional() readonly movementOptions: IMovementOptions = { allElementsNeedToBeValid: true };

    get id(): string {
        return ChangeContainerTool.ID;
    }

    enable(): void {
        // install feedback move mouse listener for client-side move updates
        const feedbackMoveMouseListener = this.createMoveMouseListener();
        this.toDisposeOnDisable.push(this.mouseTool.registerListener(feedbackMoveMouseListener));
        if (Disposable.is(feedbackMoveMouseListener)) {
            this.toDisposeOnDisable.push(feedbackMoveMouseListener);
        }
        if (ISelectionListener.is(feedbackMoveMouseListener)) {
            this.toDisposeOnDisable.push(this.selectionService.addListener(feedbackMoveMouseListener));
        }

        // install change container listener for server-side updates
        const changeContainerListener = this.createChangeContainerListener();
        this.toDisposeOnDisable.push(this.mouseTool.registerListener(changeContainerListener));
        if (Disposable.is(changeContainerListener)) {
            this.toDisposeOnDisable.push(changeContainerListener);
        }
    }

    createChangeBoundsTracker(): ChangeBoundsTracker {
        return this.changeBoundsManager.createTracker();
    }

    protected createMoveMouseListener(): MouseListener {
        return new ChangeContainerFeedbackListener(this);
    }

    protected createChangeContainerListener(): MouseListener {
        return new ChangeContainerListener(this);
    }
}
