/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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
    LayoutContainer,
    LayoutRegistry,
    SprottyBringToFrontCommand,
    TYPES,
    ZOrderElement,
    isLayoutContainer
} from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';

@injectable()
export class BringToFrontCommand extends SprottyBringToFrontCommand {
    @inject(TYPES.LayoutRegistry) protected layoutRegistry: LayoutRegistry;

    protected getLayoutContainer(zorder: ZOrderElement): LayoutContainer | undefined {
        return isLayoutContainer(zorder.element.parent) ? zorder.element.parent : undefined;
    }

    protected shouldBringToFront(zorder: ZOrderElement): boolean {
        // only re-order children if the layout supports it
        const layoutContainer = this.getLayoutContainer(zorder);
        return !layoutContainer || (this.layoutRegistry.get(layoutContainer.layout)?.orderAgnostic ?? true);
    }

    protected override bringToFront(zorder: ZOrderElement): void {
        if (this.shouldBringToFront(zorder)) {
            super.bringToFront(zorder);
        }
    }
}
