/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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
import {
    IActionDispatcher,
    IActionHandler,
    SetUIExtensionVisibilityAction,
    StatusAction,
    TYPES,
    codiconCSSClasses
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { IDiagramStartup } from '../../base/model/diagram-loader';
import { GLSPAbstractUIExtension } from '../../base/ui-extension/ui-extension';

/**
 * A reusable status overlay for rendering (icon + message) and handling of {@link StatusAction}'s.
 */
@injectable()
export class StatusOverlay extends GLSPAbstractUIExtension implements IActionHandler, IDiagramStartup {
    static readonly ID = 'glsp.server.status.overlay';

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    protected statusIconDiv?: HTMLDivElement;
    protected statusMessageDiv?: HTMLDivElement;
    protected pendingTimeout?: number;

    override id(): string {
        return StatusOverlay.ID;
    }

    override containerClass(): string {
        return 'sprotty-status';
    }
    protected override initializeContents(containerElement: HTMLElement): void {
        this.statusIconDiv = document.createElement('div');
        containerElement.appendChild(this.statusIconDiv);

        this.statusMessageDiv = document.createElement('div');
        this.statusMessageDiv.classList.add('sprotty-status-message');
        containerElement.appendChild(this.statusMessageDiv);
    }

    protected setStatus(status: StatusAction): void {
        if (this.statusMessageDiv) {
            this.statusMessageDiv.textContent = status.message;
            this.removeClasses(this.statusMessageDiv, 1);
            this.statusMessageDiv.classList.add(status.severity.toLowerCase());
        }
        if (this.statusIconDiv) {
            this.removeClasses(this.statusIconDiv, 0);
            const classes = this.statusIconDiv.classList;
            classes.add(status.severity.toLowerCase());
            switch (status.severity) {
                case 'FATAL':
                    classes.add(...codiconCSSClasses('error'));
                    break;
                case 'ERROR':
                    classes.add(...codiconCSSClasses('warning'));
                    break;
                case 'WARNING':
                    classes.add(...codiconCSSClasses('warning'));
                    break;
                case 'INFO':
                    classes.add(...codiconCSSClasses('info'));
                    break;
            }
        }
    }

    protected clearStatus(): void {
        this.setStatus(StatusAction.create('', { severity: 'NONE' }));
    }

    protected clearTimeout(): void {
        if (this.pendingTimeout) {
            window.clearTimeout(this.pendingTimeout);
            this.pendingTimeout = undefined;
        }
    }

    protected removeClasses(element: Element, keep: number): void {
        const classes = element.classList;
        while (classes.length > keep) {
            const item = classes.item(classes.length - 1);
            if (item) {
                classes.remove(item);
            }
        }
    }

    handle(action: StatusAction): void {
        this.clearTimeout();
        if (action.severity === 'NONE') {
            this.clearStatus();
            return;
        }
        this.setStatus(action);

        // Check for timeout
        const statusTimeout = action.timeout ?? -1;
        if (statusTimeout > 0) {
            this.pendingTimeout = window.setTimeout(() => this.clearStatus(), statusTimeout);
        }
    }

    preInitialize(): Promise<void> {
        return this.actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: this.id(), visible: true }));
    }
}
