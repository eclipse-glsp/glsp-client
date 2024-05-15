/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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

import { CommandPalette } from '@eclipse-glsp/sprotty';
import { injectable } from 'inversify';
import { CSS_HIDDEN_EXTENSION_CLASS, CSS_UI_EXTENSION_CLASS } from '../../base/ui-extension/ui-extension';

@injectable()
export class GlspCommandPalette extends CommandPalette {
    protected override initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);
        containerElement.classList.add(CSS_UI_EXTENSION_CLASS);
    }

    protected override setContainerVisible(visible: boolean): void {
        if (visible) {
            this.containerElement?.classList.remove(CSS_HIDDEN_EXTENSION_CLASS);
        } else {
            this.containerElement?.classList.add(CSS_HIDDEN_EXTENSION_CLASS);
        }
    }
}
