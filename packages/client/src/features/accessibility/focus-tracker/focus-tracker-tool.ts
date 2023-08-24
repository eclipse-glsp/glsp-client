/********************************************************************************
 * Copyright (c) 2023 Business Informatics Group (TU Wien) and others.
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

import { injectable, inject } from 'inversify';
import { GLSPTool } from '../../../base/tool-manager/glsp-tool-manager';
import { ShowToastMessageAction } from '../toast/toast-handler';
import * as messages from '../toast/messages.json';
import { GLSPActionDispatcher } from '../../../base/action-dispatcher';
import { ViewerOptions, TYPES } from '~glsp-sprotty';

@injectable()
export class FocusTrackerTool implements GLSPTool {
    static ID = 'glsp.focus-tracker';

    isEditTool = false;
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;
    @inject(TYPES.ViewerOptions)
    protected readonly viewerOptions: ViewerOptions;

    protected readonly focusInFunction = (event: FocusEvent): Promise<void> => this.focusIn(event);
    protected readonly focusOutFunction = (event: FocusEvent): Promise<void> => this.focusOut(event);
    protected registered = false;

    get id(): string {
        return FocusTrackerTool.ID;
    }

    enable(): void {
        if (!this.registered) {
            document.addEventListener('focusin', this.focusInFunction);
            document.addEventListener('focusout', this.focusOutFunction);
        }
        this.registered = true;
    }

    disable(): void {
        // the focus tracker cannot be disabled after enabling it
    }

    protected async focusOut(event: FocusEvent): Promise<void> {
        await this.showToast('Focus not set');
    }

    protected async focusIn(event: FocusEvent): Promise<void> {
        let message: string | undefined;
        const target = event.target;

        if (target instanceof HTMLElement) {
            const parent = this.parentWithAriaLabel(target);
            const textMessage = this.handleTextNode(target);
            // eslint-disable-next-line no-null/no-null
            if (target.ariaLabel !== null) {
                message = this.handleAriaLabel(target);
            } else {
                if (parent === undefined && textMessage !== undefined) {
                    message = textMessage;
                } else if (parent !== undefined && textMessage === undefined) {
                    message = `Focus is in ${parent.ariaLabel}`;
                } else if (parent !== undefined && textMessage !== undefined) {
                    message = `${parent.ariaLabel} -> ${textMessage}`;
                }
            }
        }

        await this.showToast(message);
    }

    protected handleTextNode(target: HTMLElement): string | undefined {
        const textNode = Array.prototype.filter
            .call(target.childNodes, element => element.nodeType === Node.TEXT_NODE)
            .map(element => element.textContent)
            .join('');

        if (textNode.trim().length !== 0) {
            return textNode;
        }

        return undefined;
    }

    protected handleAriaLabel(target: HTMLElement): string | undefined {
        // eslint-disable-next-line no-null/no-null
        return target.ariaLabel === null ? undefined : target.ariaLabel;
    }

    protected showToast(message?: string): Promise<void> {
        return this.actionDispatcher.dispatchAll([
            ShowToastMessageAction.create({
                id: Symbol.for(FocusTrackerTool.ID),
                message: `${messages.focus.focus_on} ${message ?? 'unknown'}`,
                position: 'left'
            })
        ]);
    }
    protected parentWithAriaLabel(target: HTMLElement): HTMLElement | undefined {
        let current = target.parentElement;

        while (
            // eslint-disable-next-line no-null/no-null
            current !== null &&
            current !== document.body &&
            current !== document.getElementById(this.viewerOptions.baseDiv) &&
            // eslint-disable-next-line no-null/no-null
            current.ariaLabel === null
        ) {
            current = current.parentElement;
        }

        if (current === document.getElementById(this.viewerOptions.baseDiv) || current === document.body) {
            return undefined;
        }

        return current ?? undefined;
    }
}
