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
import { TYPES as SprottyTYPES } from 'sprotty';
/**
 * Reexport of the TYPES namespace of sprotty augments with additional GLSP specific service
 * identifiers.
 */
export const TYPES = {
    ...SprottyTYPES,
    IAsyncClipboardService: Symbol('IAsyncClipboardService'),
    IEditorContextServiceProvider: Symbol('IEditorContextProvider'),
    IFeedbackActionDispatcher: Symbol('IFeedbackActionDispatcher'),
    IToolFactory: Symbol('Factory<Tool>'),
    ITypeHintProvider: Symbol('ITypeHintProvider'),
    IMovementRestrictor: Symbol('IMovementRestrictor'),
    SelectionService: Symbol('SelectionService'),
    SelectionListener: Symbol('SelectionListener'),
    SModelRootListener: Symbol('SModelRootListener'),
    MouseTool: Symbol('MouseTool'),
    IContextMenuProvider: Symbol('IContextMenuProvider'),
    ICopyPasteHandler: Symbol('ICopyPasteHandler'),
    ITool: Symbol('ITool'),
    IDefaultTool: Symbol('IDefaultTool'),
    IEditModeListener: Symbol('IEditModeListener'),
    IMarqueeBehavior: Symbol('IMarqueeBehavior')
};

/**
 * Keep a reexport under the old deprecated namespace to avoid hard API breaks.
 * This gives adopters a grace period but all deprecated API will be removed before the 1.0.0 release.
 * @deprecated Please use `TYPES` from `@eclipse-glsp/client` instead
 */
export const GLSP_TYPES = TYPES;
