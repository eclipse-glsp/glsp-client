/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import { ExportResultAction, IActionHandler } from '@eclipse-glsp/sprotty';
import { saveAs } from 'file-saver';
import { injectable } from 'inversify';

/**
 * Default handler for the unified {@link ExportResultAction}. Triggers a browser file
 * download for client-originated UI flows (parallel to the legacy
 * `ExportSvgActionHandler` for the SVG-only path).
 *
 * Server-orchestrated flows (e.g. the MCP `diagram-png` resource handler) consume the
 * `ExportResultAction` via the action dispatcher's `requestUntil` and don't go through
 * this handler — so this binding lives in the `standaloneExportModule` and is omitted
 * by Theia/VS Code integrations that prefer their own download UX.
 */
@injectable()
export class ExportResultActionHandler implements IActionHandler {
    handle(action: ExportResultAction): void {
        if (!ExportResultAction.is(action)) {
            return;
        }
        const blob = this.toBlob(action);
        saveAs(blob, `diagram.${this.extensionFor(action.format)}`);
    }

    protected toBlob(action: ExportResultAction): Blob {
        // `encoding` is `ProposalString<'text' | 'base64'>` — an open union. Reject unknown
        // tags explicitly: silently treating an arbitrary value as text would mojibake binary
        // payloads, while treating it as base64 would corrupt text payloads.
        switch (action.encoding) {
            case 'text':
                return new Blob([action.data], { type: `${action.mimeType};charset=utf-8` });
            case 'base64':
                return new Blob([this.decodeBase64(action.data)], { type: action.mimeType });
            default:
                throw new Error(
                    `ExportResultActionHandler: unsupported encoding '${action.encoding}' for format '${action.format}'. ` +
                        'Adopters that ship a custom encoding must also subclass this handler to decode it.'
                );
        }
    }

    protected extensionFor(format: string): string {
        return format.toLowerCase();
    }

    protected decodeBase64(data: string): ArrayBuffer {
        const binary = atob(data);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; ++i) {
            view[i] = binary.charCodeAt(i);
        }
        return buffer;
    }
}
