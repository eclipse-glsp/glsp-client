/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
import { saveAs } from 'file-saver';
import { injectable } from 'inversify';
import { ExportSvgAction, IActionHandler } from '@eclipse-glsp/sprotty';

/**
 * The default handler for {@link ExportSvgAction}s. This generic handler can be used in
 * any GLSP project independent of the target platform. However, platform integration modules typically
 *  * this handler is rebound to an application specific handler in platform integration modules
 * (e.g. the Theia integration)
 */
@injectable()
export class ExportSvgActionHandler implements IActionHandler {
    handle(action: ExportSvgAction): void {
        const blob = new Blob([action.svg], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'diagram.svg');
    }
}
