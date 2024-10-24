/********************************************************************************
 * Copyright (c) 2023-2024 Business Informatics Group (TU Wien) and others.
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

import { CreateNodeOperation, IActionDispatcher, matchesKeystroke, SetUIExtensionVisibilityAction } from '@eclipse-glsp/sprotty';
import { CursorCSS } from '../../../base/feedback/css-feedback';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { KeyboardNodeGridMetadata } from '../keyboard-grid/constants';
import { KeyboardPointerMetadata } from './constants';
import { KeyboardPointer } from './keyboard-pointer';
import { KeyboardPointerPosition } from './keyboard-pointer-position';

/**
 * Keyboard listener for the pointer with the necessary logic to handle keyboard events
 */
export class KeyboardPointerKeyboardListener {
    protected get position(): KeyboardPointerPosition {
        return this.keyboardPointer.getPosition;
    }

    constructor(
        protected readonly keyboardPointer: KeyboardPointer,
        protected readonly actionDispatcher: IActionDispatcher
    ) {}

    keyDown(event: KeyboardEvent): void {
        this.moveIfArrows(event);
        this.createIfEnterEvent(event);
        this.hideIfEscapeEvent(event);
    }

    protected moveIfArrows(event: KeyboardEvent): any {
        if (this.matchesMovePointerDown(event)) {
            this.position.renderPosition = this.position.calcRelativeRenderPosition(0, 10);
            this.keyboardPointer.render();
        } else if (this.matchesMovePointerUp(event)) {
            this.position.renderPosition = this.position.calcRelativeRenderPosition(0, -10);
            this.keyboardPointer.render();
        } else if (this.matchesMovePointerRight(event)) {
            this.position.renderPosition = this.position.calcRelativeRenderPosition(10, 0);
            this.keyboardPointer.render();
        } else if (this.matchesMovePointerLeft(event)) {
            this.position.renderPosition = this.position.calcRelativeRenderPosition(-10, 0);
            this.keyboardPointer.render();
        }
    }

    protected createIfEnterEvent(event: KeyboardEvent): any {
        const elementTypeId = this.keyboardPointer.triggerAction.elementTypeId;

        const { container, status } = this.position.containableParentAtDiagramPosition(elementTypeId);

        if (container !== undefined && status === CursorCSS.NODE_CREATION) {
            if (this.matchesConfirmPointerPosition(event)) {
                // close everything and return to default

                const containerId = container.id;
                const location = this.position.diagramPosition;

                this.actionDispatcher.dispatchAll([
                    SetUIExtensionVisibilityAction.create({
                        extensionId: KeyboardPointerMetadata.ID,
                        visible: false,
                        contextElementsId: []
                    }),
                    SetUIExtensionVisibilityAction.create({
                        extensionId: KeyboardNodeGridMetadata.ID,
                        visible: false,
                        contextElementsId: []
                    }),
                    CreateNodeOperation.create(elementTypeId, { location, containerId, args: this.keyboardPointer.triggerAction.args }),
                    EnableDefaultToolsAction.create()
                ]);
            } else if (this.matchesConfirmPointerPositionAndStayInMode(event)) {
                // stay in this mode, selected palette option stays, grid and keyboard mouse are displayed

                const containerId = container.id;
                const location = this.position.diagramPosition;

                this.actionDispatcher.dispatch(
                    CreateNodeOperation.create(elementTypeId, { location, containerId, args: this.keyboardPointer.triggerAction.args })
                );
            }
        }
    }

    protected hideIfEscapeEvent(event: KeyboardEvent): any {
        if (this.matchesDeactivatePointer(event)) {
            this.keyboardPointer.hide();
        }
    }

    protected matchesDeactivatePointer(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }
    protected matchesConfirmPointerPosition(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Enter');
    }
    protected matchesConfirmPointerPositionAndStayInMode(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Enter', 'ctrl');
    }

    protected matchesMovePointerLeft(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowLeft');
    }
    protected matchesMovePointerRight(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowRight');
    }
    protected matchesMovePointerUp(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowUp');
    }
    protected matchesMovePointerDown(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'ArrowDown');
    }
}
