/********************************************************************************
 * Copyright (c) 2019-2025 EclipseSource and others.
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
/* eslint-disable deprecation/deprecation */
import { TYPES as SprottyTYPES } from 'sprotty';

/**
 * Reexport of the TYPES namespace of sprotty augments with additional GLSP specific service
 * identifiers.
 */

const IGModelRootListener = Symbol('IGModelRootListener');
export const TYPES = {
    ...SprottyTYPES,
    // GLSP extends certain sprotty base classes and replaces constructor injection with lazy injection to avoid circular dependencies
    // To pass inversify base class checks an empty array has to be injected.
    // This is the purpose of this service identifier. Typically adopters should not have to  use this identifier.
    EmptyArray: Symbol('EmptyArray'),
    /** @deprecated Using async providers for container service retrieval is discouraged. Use the `LazyInjector` instead */
    ActionHandlerRegistryProvider: SprottyTYPES.ActionHandlerRegistryProvider,
    IAsyncClipboardService: Symbol('IAsyncClipboardService'),
    /** @deprecated Async provider is no longer necessary. Either directly inject or use `LazyInjector`*/
    IEditorContextServiceProvider: Symbol('IEditorContextProvider'),
    IFeedbackActionDispatcher: Symbol('IFeedbackActionDispatcher'),
    IToolFactory: Symbol('Factory<Tool>'),
    ITypeHintProvider: Symbol('ITypeHintProvider'),
    IMovementRestrictor: Symbol('IMovementRestrictor'),
    IMovementOptions: Symbol('IMovementOptions'),
    ISelectionListener: Symbol('ISelectionListener'),
    /** @deprecated Use {@link TYPES.IGModelRootListener} instead */
    ISModelRootListener: IGModelRootListener,
    IGModelRootListener: IGModelRootListener,
    IContextMenuProvider: Symbol('IContextMenuProvider'),
    ICopyPasteHandler: Symbol('ICopyPasteHandler'),
    ITool: Symbol('ITool'),
    IDefaultTool: Symbol('IDefaultTool'),
    IEditModeListener: Symbol('IEditModeListener'),
    IMarqueeBehavior: Symbol('IMarqueeBehavior'),
    IHelperLineManager: Symbol('IHelperLineManager'),
    IHelperLineOptions: Symbol('IHelperLineOptions'),
    IElementNavigator: Symbol('IElementNavigator'),
    ILocalElementNavigator: Symbol('ILocalElementNavigator'),
    IDiagramOptions: Symbol('IDiagramOptions'),
    IDiagramStartup: Symbol('IDiagramStartup'),
    IToolManager: Symbol('IToolManager'),
    IContainerManager: Symbol('IContainerManager'),
    IChangeBoundsManager: Symbol('IChangeBoundsManager'),
    IGridManager: Symbol('IGridManager'),
    IDebugManager: Symbol('IDebugManager'),
    Grid: Symbol('Grid'),
    ZoomFactors: Symbol('ZoomFactors'),
    IModelChangeService: Symbol('IModelChangeService'),
    /**
     * Experimental shortcut manager.
     * The API is not stable yet.
     */
    IShortcutManager: Symbol('IShortcutManager')
};
