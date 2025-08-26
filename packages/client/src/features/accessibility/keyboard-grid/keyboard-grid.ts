/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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
import '../../../../css/keyboard.css';

import {
    Action,
    GModelRoot,
    IActionDispatcher,
    IActionHandler,
    ICommand,
    KeyCode,
    matchesKeystroke,
    Point,
    SetUIExtensionVisibilityAction,
    TYPES
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { GLSPAbstractUIExtension } from '../../../base/ui-extension/ui-extension';
import { EnableKeyboardGridAction, KeyboardGridCellSelectedAction, KeyboardGridKeyboardEventAction } from './action';
import { KeyboardGridMetadata } from './constants';

@injectable()
export class KeyboardGrid extends GLSPAbstractUIExtension implements IActionHandler {
    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher;

    protected triggerActions: Action[] = [];
    protected originId: string;

    id(): string {
        return KeyboardGridMetadata.ID;
    }

    containerClass(): string {
        return KeyboardGridMetadata.ID;
    }
    handle(action: Action): void | Action | ICommand {
        if (EnableKeyboardGridAction.is(action)) {
            this.triggerActions = action.options.triggerActions;
            this.originId = action.options.originId;
            this.actionDispatcher.dispatch(
                SetUIExtensionVisibilityAction.create({
                    extensionId: KeyboardGridMetadata.ID,
                    visible: true
                })
            );
        }
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.tabIndex = KeyboardGridMetadata.TAB_INDEX;
        containerElement.classList.add('grid-container');

        for (let i = 1; i <= 9; i++) {
            const gridNumber = document.createElement('div');
            const gridItem = document.createElement('div');

            gridItem.classList.add('grid-item');
            gridItem.id = `keyboard-grid-item-${i}`;

            gridNumber.classList.add('grid-item-number');
            gridNumber.innerHTML = i.toString();

            gridItem.appendChild(gridNumber);
            containerElement.appendChild(gridItem);
        }

        this.containerElement.onkeydown = ev => {
            this.onKeyDown(ev);
        };
    }

    protected onKeyDown(event: KeyboardEvent): void {
        this.activateCellIfDigitEvent(event);
        this.hideIfEscapeEvent(event);

        this.actionDispatcher.dispatch(
            KeyboardGridKeyboardEventAction.create({
                originId: this.originId,
                event
            })
        );
    }

    protected override setContainerVisible(visible: boolean): void {
        if (this.containerElement) {
            if (visible) {
                this.containerElement.classList.remove('grid-hidden');
                this.containerElement.classList.add('grid-visible');
            } else {
                this.containerElement.classList.remove('grid-visible');
                this.containerElement.classList.add('grid-hidden');
            }
        }
    }

    override show(root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
        super.show(root, ...contextElementIds);
        this.containerElement.focus();
    }

    protected hideIfEscapeEvent(event: KeyboardEvent): any {
        if (this.matchesDeactivateGrid(event)) {
            this.hide();
        }
    }

    protected activateCellIfDigitEvent(event: KeyboardEvent): any {
        let index: number | undefined = undefined;

        for (let i = 1; i <= 9; i++) {
            if (this.matchesGridBoxAtIndex(event, i)) {
                index = i;
                break;
            }
        }

        if (index !== undefined) {
            const position = this.centerPositionOfCell(index);

            this.dispatchActionsForCell(index, position);
        }
    }

    protected dispatchActionsForCell(index: number, cellCenter: Point): void {
        this.actionDispatcher.dispatchAll([
            ...this.triggerActions,
            KeyboardGridCellSelectedAction.create({
                originId: this.originId,
                cellId: index.toString(),
                centerCellPosition: cellCenter
            })
        ]);
    }
    protected centerPositionOfCell(index: number): Point {
        let x = 0;
        let y = 0;

        const activeGridCell = document.getElementById(`keyboard-grid-item-${index}`);
        // eslint-disable-next-line no-null/no-null
        if (activeGridCell !== null) {
            const positions = this.getCenterOfCell(activeGridCell);
            x = positions[0];
            y = positions[1];
        }

        return {
            x,
            y
        };
    }
    protected matchesDeactivateGrid(event: KeyboardEvent): boolean {
        return matchesKeystroke(event, 'Escape');
    }
    protected matchesGridBoxAtIndex(event: KeyboardEvent, index: number): boolean {
        return matchesKeystroke(event, ('Digit' + index) as KeyCode) || matchesKeystroke(event, ('Numpad' + index) as KeyCode);
    }
    // https://www.delftstack.com/howto/javascript/get-position-of-element-in-javascript/
    private getOffset(el: any): { top: number; left: number } {
        let _x = 0;
        let _y = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    }

    private getCenterOfCell(cell: HTMLElement): number[] {
        const cellLeft = this.getOffset(cell).left;
        const cellTop = this.getOffset(cell).top;
        const cellWidth = cell.offsetWidth;
        const cellHeight = cell.offsetHeight;

        const newCellWidth = cellWidth / 2;
        const newCellHeight = cellHeight / 2;

        return [cellLeft + newCellWidth, cellTop + newCellHeight];
    }
}
