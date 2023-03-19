/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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

import { BindingContext, bindOrRebind } from '@eclipse-glsp/protocol';
import { configureViewerOptions } from 'sprotty';
import { TYPES } from './types';

/**
 * Provides core configuration options for a GLSP diagram
 */
export interface GLSPDiagramOptions {
    /**
     * The diagram type (i.e. language identifier) of the diagram
     */
    diagramType: string;
    /**
     * The base id of the diagram (i.e. the id of the base div it is rendered in)
     */
    widgetId: string;
    /**
     *  The client id of this diagram. Used to initialize a new GLSP server session for the diagram.
     *  If not defined the {@link widgetId} will serve as client id.
     */
    clientId: string;
    /**
     * Uri of the source model file for this diagram. Can be `undefined` for cases where
     * the source model is not loaded from a file input.
     */
    sourceUri?: string;
}

export const defaultWidgetId = 'sprotty';

/**
 * Utility {@link GLSPDiagramOptions} which is used in the {@link configureDiagramContainer} utility function
 * to partially set diagram options. The only required property is the `diagramType`, for every other property
 * fallback values will be used if they are `undefined`.
 */
export type PartialGLSPDiagramOptions = Partial<GLSPDiagramOptions> & { diagramType: string };

/**
 * Utility function to (partially) configure the {@link GLSPDiagramOptions} for a given diagram container.
 * The currently configured {@link ViewerOptions} will be overridden so that {@link ViewerOptions.baseDiv}
 * matches the given {@link GLSPDiagramOptions.widgetId}.
 * If a required property is undefined in the given (partial) options fallback values will be used.
 * Fallback:
 *  - widgetId: "sprotty"
 *  - clientId: value of widgetId
 *  */
export function configureDiagramContainer(context: Omit<BindingContext, 'unbind'>, options: PartialGLSPDiagramOptions): void {
    const widgetId = options.widgetId ?? defaultWidgetId;
    const clientId = options.clientId ?? widgetId;
    const resolvedOptions: GLSPDiagramOptions = {
        widgetId,
        clientId,
        ...options
    };
    bindOrRebind(context, TYPES.GLSPDiagramOptions).toConstantValue(resolvedOptions);
    configureViewerOptions(context, { baseDiv: resolvedOptions.widgetId, hiddenDiv: `${resolvedOptions.widgetId}_hidden` });
}
