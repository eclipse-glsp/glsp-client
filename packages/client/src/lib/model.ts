/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { SModelElementSchema } from '@eclipse-glsp/protocol';
import { exportFeature, SGraph, SModelElement, viewportFeature } from 'sprotty';
import { Containable, containerFeature } from '../features/hints/model';
import { Saveable, saveFeature } from '../features/save/model';

export class GLSPGraph extends SGraph implements Saveable, Containable {
    static override readonly DEFAULT_FEATURES = [viewportFeature, exportFeature, saveFeature, containerFeature];
    dirty = false;
    isContainableElement(input: string | SModelElement | SModelElementSchema): boolean {
        return true;
    }
}
