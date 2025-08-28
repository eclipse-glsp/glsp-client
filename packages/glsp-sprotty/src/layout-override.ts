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

import { inject, injectable, interfaces, multiInject, optional } from 'inversify';
import {
    ILogger,
    InstanceRegistry,
    HBoxLayouter as SHBoxLayouter,
    ILayout as SLayout,
    LayoutRegistration as SLayoutRegistration,
    VBoxLayouter as SVBoxLayouter,
    TYPES,
    configureLayout as sconfigureLayout
} from 'sprotty';
import { AbstractLayout as SAbstractLayout } from 'sprotty/lib/features/bounds/abstract-layout';
import { AbstractLayoutOptions } from './re-exports';

export interface ILayout extends SLayout {
    /** Flag to indicate whether the layouting of the children is independant from their order. */
    orderAgnostic?: boolean;
}

export interface LayoutRegistration extends SLayoutRegistration {
    factory: () => ILayout;
}

@injectable()
export class LayoutRegistry extends InstanceRegistry<ILayout> {
    @inject(TYPES.ILogger) logger: ILogger;

    constructor(@multiInject(TYPES.LayoutRegistration) @optional() layouts: LayoutRegistration[] = []) {
        super();
        layouts.forEach(layout => {
            if (this.hasKey(layout.layoutKind)) {
                this.logger.warn('Layout kind is already defined: ', layout.layoutKind);
            } else {
                this.register(layout.layoutKind, layout.factory());
            }
        });
    }
}

export function configureLayout(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    kind: string,
    constr: interfaces.ServiceIdentifier<ILayout>
): void {
    return sconfigureLayout(context, kind, constr);
}

@injectable()
export abstract class AbstractLayout<T extends AbstractLayoutOptions> extends SAbstractLayout<T> implements ILayout {
    orderAgnostic?: boolean = true;
}

@injectable()
export class VBoxLayouter extends SVBoxLayouter implements ILayout {
    orderAgnostic?: boolean = false;
}

@injectable()
export class HBoxLayouter extends SHBoxLayouter implements ILayout {
    orderAgnostic?: boolean = false;
}
