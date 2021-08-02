/********************************************************************************
 * Copyright (c) 2019-2021 EclipseSource and others.
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ContainerModule, injectable, multiInject, optional } from 'inversify';
import { configureCommand, ILayout, LayoutRegistry, TYPES } from 'sprotty';

import { GLSP_TYPES } from '../../base/types';
import { FreeFormLayouter } from './freeform-layout';
import { AlignElementsCommand, ResizeElementsCommand } from './layout-commands';
import { VBoxLayouterExt } from './vbox-layout';

const layoutCommandsModule = new ContainerModule((bind, _unbind, isBound, rebind) => {
    configureCommand({ bind, isBound }, ResizeElementsCommand);
    configureCommand({ bind, isBound }, AlignElementsCommand);
    rebind(TYPES.LayoutRegistry).to(LayoutRegistryExt);
    bind(GLSP_TYPES.LayoutRegistration).to(VBoxLayoutRegistration);
    bind(GLSP_TYPES.LayoutRegistration).to(FreeFormLayoutRegistration);
});

export default layoutCommandsModule;

/**
 * An extension of Sprotty's LayoutRegistry, supporting additional
 * layouts configured with dependency-injection.
 *
 * FIXME: Remove this when updating to the next version of Sprotty,
 * as the new version of the LayoutRegistry directly supports Dependency-injection
 */
@injectable()
export class LayoutRegistryExt extends LayoutRegistry {
    constructor(@multiInject(GLSP_TYPES.LayoutRegistration) @optional() layouts: (LayoutRegistration)[] = []) {
        super();
        layouts.forEach(layout => {
            if (this.hasKey(layout.layoutKind)) {
                this.deregister(layout.layoutKind);
            }
            this.register(layout.layoutKind, layout.getLayout());
        });
    }
}

export interface LayoutRegistration {
    layoutKind: string;
    getLayout: () => ILayout;
}

@injectable()
class VBoxLayoutRegistration implements LayoutRegistration {
    layoutKind = VBoxLayouterExt.KIND;

    getLayout(): ILayout {
        return new VBoxLayouterExt();
    }
}

@injectable()
class FreeFormLayoutRegistration implements LayoutRegistration {
    layoutKind = FreeFormLayouter.KIND;

    getLayout(): ILayout {
        return new FreeFormLayouter();
    }
}
