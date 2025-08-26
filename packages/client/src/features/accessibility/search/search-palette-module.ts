/********************************************************************************
 * Copyright (c) 2023-2025 Business Informatics Group (TU Wien) and others.
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

import { bindAsService, BindingContext, FeatureModule, TYPES } from '@eclipse-glsp/sprotty';
import '../../../../css/search.css';
import { SearchAutocompletePalette } from './search-palette';
import { SearchAutocompletePaletteTool } from './search-tool';

export const searchPaletteModule = new FeatureModule(
    (bind, _unbind, isBound, rebind) => {
        const context = { bind, isBound, rebind };
        configureSearchPaletteModule(context);
    },
    { featureId: Symbol('searchPalette') }
);

export function configureSearchPaletteModule(context: Pick<BindingContext, 'bind'>): void {
    bindAsService(context, TYPES.IUIExtension, SearchAutocompletePalette);
    bindAsService(context, TYPES.IDefaultTool, SearchAutocompletePaletteTool);
}
