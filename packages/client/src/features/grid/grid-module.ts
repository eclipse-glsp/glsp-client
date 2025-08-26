/********************************************************************************
 * Copyright (c) 2023-2025 Axon Ivy AG and others.
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

import { FeatureModule, TYPES, bindAsService, configureActionHandler, configureCommand } from '@eclipse-glsp/sprotty';
import '../../../css/grid.css';
import { Grid } from './grid';
import { GridManager } from './grid-manager';
import { ShowGridAction, ShowGridCommand } from './grid-model';
import { GridSnapper } from './grid-snapper';

export const gridModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };

        bind(TYPES.Grid).toConstantValue(Grid.DEFAULT);

        configureCommand(context, ShowGridCommand);

        bindAsService(context, TYPES.IGridManager, GridManager);
        configureActionHandler(context, ShowGridAction.KIND, GridManager);

        bind(TYPES.ISnapper).to(GridSnapper);
    },
    { featureId: Symbol('grid') }
);
