/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
/* eslint-disable deprecation/deprecation */
import { inject, injectable } from 'inversify';
import {
    Action,
    IActionDispatcher,
    IActionHandler,
    IContextMenuItemProvider,
    MenuItem,
    Point,
    GModelRoot,
    MessageAction,
    StatusAction,
    TYPES,
    hasStringProp,
    isSelected
} from '@eclipse-glsp/sprotty';

/**
 * An `InvokeCopyPasteAction` is dispatched by the client to initiate a cut, copy or paste operation.
 */
export interface InvokeCopyPasteAction extends Action {
    kind: typeof InvokeCopyPasteAction.KIND;
    command: 'copy' | 'cut' | 'paste';
}

export namespace InvokeCopyPasteAction {
    export const KIND = 'invokeCopyPaste';

    export function is(object: any): object is InvokeCopyPasteAction {
        return Action.hasKind(object, KIND) && hasStringProp(object, 'command');
    }

    export function create(command: 'copy' | 'cut' | 'paste'): InvokeCopyPasteAction {
        return { kind: KIND, command };
    }
}

@injectable()
export class InvokeCopyPasteActionHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher) protected dispatcher: IActionDispatcher;
    handle(action: InvokeCopyPasteAction): void {
        switch (action.command) {
            case 'copy':
                if (supportsCopy()) {
                    document.execCommand('copy');
                } else {
                    this.notifyUserToUseShortcut('copy');
                }
                break;
            case 'paste':
                if (supportsPaste()) {
                    document.execCommand('paste');
                } else {
                    this.notifyUserToUseShortcut('paste');
                }
                break;
            case 'cut':
                if (supportsCut()) {
                    document.execCommand('cut');
                } else {
                    this.notifyUserToUseShortcut('cut');
                }
                break;
        }
    }

    protected notifyUserToUseShortcut(operation: string): void {
        const message = `Please use the browser's ${operation} command or shortcut.`;
        const timeout = 10000;
        const severity = 'WARNING';
        this.dispatcher.dispatchAll([StatusAction.create(message, { severity, timeout }), MessageAction.create(message, { severity })]);
    }
}

@injectable()
export class CopyPasteContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<GModelRoot>, _lastMousePosition?: Point): Promise<MenuItem[]> {
        const hasSelectedElements = Array.from(root.index.all().filter(isSelected)).length > 0;
        return Promise.resolve([
            this.createCopyMenuItem(hasSelectedElements),
            this.createCutMenuItem(hasSelectedElements),
            this.createPasteMenuItem()
        ]);
    }

    protected createPasteMenuItem(): MenuItem {
        return {
            id: 'paste',
            label: 'Paste',
            group: 'copy-paste',
            actions: [InvokeCopyPasteAction.create('paste')],
            isEnabled: () => true
        };
    }

    protected createCutMenuItem(hasSelectedElements: boolean): MenuItem {
        return {
            id: 'cut',
            label: 'Cut',
            group: 'copy-paste',
            actions: [InvokeCopyPasteAction.create('cut')],
            isEnabled: () => hasSelectedElements
        };
    }

    protected createCopyMenuItem(hasSelectedElements: boolean): MenuItem {
        return {
            id: 'copy',
            label: 'Copy',
            group: 'copy-paste',
            actions: [InvokeCopyPasteAction.create('copy')],
            isEnabled: () => hasSelectedElements
        };
    }
}

export function supportsCopy(): boolean {
    return isNative() || document.queryCommandSupported('copy');
}

export function supportsCut(): boolean {
    return isNative() || document.queryCommandSupported('cut');
}

export function supportsPaste(): boolean {
    const isChrome = userAgent().indexOf('Chrome') >= 0;
    return isNative() || (!isChrome && document.queryCommandSupported('paste'));
}

export function isNative(): boolean {
    return typeof (window as any).process !== 'undefined';
}

function userAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : '';
}
