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

import { FeatureModule } from '@eclipse-glsp/sprotty';
import { configureElementNavigationTool } from './element-navigation/element-navigation-module';
import { configureFocusTrackerTool } from './focus-tracker/focus-tracker-module';
import { configureKeyboardControlTools } from './keyboard-pointer/keyboard-pointer-module';
import { configureKeyboardToolPaletteTool } from './keyboard-tool-palette/keyboard-tool-palette-module';
import { configureSearchPaletteModule } from './search/search-palette-module';
import { configureToastTool } from './toast/toast-module';
import { configureViewKeyTools } from './view-key-tools/view-key-tools-module';

/**
 * Enables the accessibility tools for a keyboard-only-usage
 */
export const accessibilityModule = new FeatureModule(
    (bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        configureViewKeyTools(context);
        configureSearchPaletteModule(context);
        configureKeyboardToolPaletteTool(context);
        configureKeyboardControlTools(context);
        configureElementNavigationTool(context);
        configureFocusTrackerTool(context);
        configureToastTool(context);
    },
    {
        featureId: Symbol('accessibility')
    }
);
