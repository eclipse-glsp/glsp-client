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

import { Args, Dimension, FeatureSet, GNode, boundsFeature, createFeatureSet, moveFeature } from '@eclipse-glsp/sprotty';
import { v4 as uuid } from 'uuid';
import { ArgsAware, argsFeature } from '../../../base/args-feature';

export const ARG_LENGTH = 'length';

export class InsertIndicator extends GNode implements ArgsAware {
    static override readonly DEFAULT_FEATURES = [boundsFeature, moveFeature, argsFeature];

    static TYPE = 'node:insert-indicator';

    override id: string = uuid();
    override type: string = InsertIndicator.TYPE;
    override features?: FeatureSet = createFeatureSet(InsertIndicator.DEFAULT_FEATURES);
    override cssClasses: string[] = ['insert-indicator', 'sprotty-node'];
    override size: Dimension = Dimension.ZERO;
    args: Args = {};

    constructor(length?: number) {
        super();
        if (length) {
            this.args = { [ARG_LENGTH]: length };
        }
    }
}
