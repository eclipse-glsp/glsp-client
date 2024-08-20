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
import { Action, GModelRoot, IActionDispatcher, IActionHandler, TYPES, TriggerNodeCreationAction } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../../base/editor-context-service';
import { CursorCSS } from '../../../base/feedback/css-feedback';
import { GLSPAbstractUIExtension } from '../../../base/ui-extension/ui-extension';
import { ContainerManager } from '../../tools/node-creation/container-manager';
import { KeyboardGridCellSelectedAction } from '../keyboard-grid/action';
import { SetKeyboardPointerRenderPositionAction } from './actions';
import { KeyboardPointerMetadata } from './constants';
import { KeyboardPointerKeyboardListener } from './keyboard-pointer-listener';
import { KeyboardPointerPosition } from './keyboard-pointer-position';

@injectable()
export class KeyboardPointer extends GLSPAbstractUIExtension implements IActionHandler {
    protected _triggerAction: TriggerNodeCreationAction = {
        elementTypeId: 'task:automated',
        kind: 'triggerNodeCreation'
    };

    @inject(EditorContextService)
    public editorContextService: EditorContextService;
    @inject(TYPES.IContainerManager)
    public containerManager: ContainerManager;

    protected position: KeyboardPointerPosition = new KeyboardPointerPosition(this);
    protected keyListener: KeyboardPointerKeyboardListener;

    constructor(@inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher) {
        super();

        this.keyListener = new KeyboardPointerKeyboardListener(this, actionDispatcher);
    }

    get triggerAction(): TriggerNodeCreationAction {
        return this._triggerAction;
    }

    get isVisible(): boolean {
        return this.containerElement?.style.visibility === 'visible';
    }

    get getPosition(): KeyboardPointerPosition {
        return this.position;
    }
    get getKeyListener(): KeyboardPointerKeyboardListener {
        return this.keyListener;
    }

    id(): string {
        return KeyboardPointerMetadata.ID;
    }

    containerClass(): string {
        return KeyboardPointerMetadata.ID;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.style.position = 'absolute';
        containerElement.style.height = `${KeyboardPointerMetadata.CRICLE_HEIGHT}px`;
        containerElement.style.width = `${KeyboardPointerMetadata.CIRCLE_WIDTH}px`;
        containerElement.style.borderRadius = '100%';
    }

    protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<GModelRoot>, ...selectedElementIds: string[]): void {
        this.render();
    }

    handle(action: Action): Action | void {
        if (TriggerNodeCreationAction.is(action)) {
            this._triggerAction = action;
        } else if (SetKeyboardPointerRenderPositionAction.is(action)) {
            this.position.renderPosition = { x: action.x, y: action.y };
            this.render();
        } else if (KeyboardGridCellSelectedAction.is(action) && action.options.originId === KeyboardPointerMetadata.ID) {
            this.position.renderPosition = action.options.centerCellPosition;
            this.render();
        }
    }

    render(): void {
        if (this.containerElement !== undefined) {
            const { x, y } = this.position.renderPosition;
            this.containerElement.style.left = `${x}px`;
            this.containerElement.style.top = `${y}px`;

            const { status } = this.position.containableParentAtDiagramPosition(this._triggerAction.elementTypeId);

            this.containerElement.style.borderStyle = 'solid';
            this.containerElement.style.borderWidth = 'thick';
            switch (status) {
                case CursorCSS.NODE_CREATION: {
                    this.containerElement.style.borderColor = 'green';
                    break;
                }
                case CursorCSS.OPERATION_NOT_ALLOWED: {
                    this.containerElement.style.borderColor = 'red';
                    break;
                }
            }
        }
    }
}
