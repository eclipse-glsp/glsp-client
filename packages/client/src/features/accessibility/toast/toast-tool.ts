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

import { Action, IActionDispatcher, IActionHandler, ICommand, SetUIExtensionVisibilityAction, TYPES } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../../base/editor-context-service';
import { IDiagramStartup } from '../../../base/model/diagram-loader';
import { GLSPAbstractUIExtension } from '../../../base/ui-extension/ui-extension';
import { HideToastAction, ShowToastMessageAction, ToastOptions } from './toast-handler';

/**
 * This extension is used to create customized user notifications as toast messages.
 */
@injectable()
export class Toast extends GLSPAbstractUIExtension implements IActionHandler, IDiagramStartup {
    static readonly ID = 'toast';
    protected messages: { [key: symbol]: ToastOptions } = {};

    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher;
    @inject(EditorContextService)
    protected editorContext: EditorContextService;

    id(): string {
        return Toast.ID;
    }
    containerClass(): string {
        return Toast.ID;
    }

    protected initializeContents(_containerElement: HTMLElement): void {
        this.render();
    }

    handle(action: Action): ICommand | Action | void {
        if (ShowToastMessageAction.is(action)) {
            this.messages[action.options.id] = action.options;
            this.render();

            if (action.options.timeout) {
                setTimeout(() => {
                    this.delete(action.options.id);
                }, action.options.timeout);
            }
        } else if (HideToastAction.is(action)) {
            if (action.options.timeout) {
                setTimeout(() => {
                    this.delete(action.options.id);
                }, action.options.timeout);
            } else {
                this.delete(action.options.id);
            }
        }
    }

    protected render(): void {
        if (this.containerElement === undefined) {
            return;
        }

        this.containerElement.innerHTML = '';

        this.values(this.messages).forEach(message => {
            this.containerElement.appendChild(this.createToastMessage(message));
        });
    }

    protected delete(id: symbol): void {
        delete this.messages[id];
        this.render();
    }

    protected createToastMessage(option: ToastOptions): HTMLDivElement {
        const cell = document.createElement('div');
        cell.classList.add('toast-cell', `toast-column-${option.position}`);

        const container = document.createElement('div');
        container.classList.add('toast-container');

        const text = document.createElement('span');
        text.textContent = option.message;

        container.appendChild(text);
        cell.appendChild(container);

        return cell;
    }

    preInitialize(): void {
        this.actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: Toast.ID, visible: true }));
    }

    values(obj: { [key: symbol]: ToastOptions }): ToastOptions[] {
        return Object.getOwnPropertySymbols(obj).map(s => obj[s]);
    }
}
