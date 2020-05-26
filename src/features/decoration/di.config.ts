/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
import "../../../css/decoration.css";

import { ContainerModule } from "inversify";
import { configureModelElement, SIssueMarker, TYPES } from "sprotty";

import { GlspDecorationPlacer } from "./decoration-placer";
import { GlspIssueMarkerView } from "./view";

const glspDecorationModule = new ContainerModule((bind, _unbind, isBound) => {
    configureModelElement({ bind, isBound }, 'marker', SIssueMarker, GlspIssueMarkerView);
    bind(GlspDecorationPlacer).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(GlspDecorationPlacer);
});

export default glspDecorationModule;
