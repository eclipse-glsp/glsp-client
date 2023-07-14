/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
/**
 * Sprotty still keeps the old class based action definitions as deprecated API.
 * This causes name clashes with the GLSP protocol actions when reexport sprotty.
 * The deprecated definitions are planned to be removed with Sprotty 1.0.0.
 * Until then we have to manually reexport the sprotty main index and exclude the clashing types.
 */
/* eslint-disable no-restricted-imports */

/**
 * @eclipse-glsp/protocol
 */
export * from '@eclipse-glsp/protocol';
/*
 * sprotty-protocol
 */
export {
    BringToFrontAction,
    CollapseExpandAction,
    CollapseExpandAllAction,
    ElementAndAlignment,
    GetSelectionAction,
    GetViewportAction,
    HoverFeedbackAction,
    MoveAction,
    SelectionResult,
    SetBoundsAction,
    ViewportResult
} from 'sprotty-protocol/lib/actions';
export { Viewport } from 'sprotty-protocol/lib/model';
/*
 * sprotty
 */
// ------------------ Base ------------------
export * from 'sprotty/lib/base/actions/action-dispatcher';
export * from 'sprotty/lib/base/actions/action-handler';
export * from 'sprotty/lib/base/actions/diagram-locker';
export * from 'sprotty/lib/base/animations/animation';
export * from 'sprotty/lib/base/animations/animation-frame-syncer';
export * from 'sprotty/lib/base/animations/easing';
export * from 'sprotty/lib/base/commands/command';
export * from 'sprotty/lib/base/commands/command-registration';
export * from 'sprotty/lib/base/commands/command-stack';
export * from 'sprotty/lib/base/commands/command-stack-options';
export * from 'sprotty/lib/base/features/initialize-canvas';
export { SetModelCommand } from 'sprotty/lib/base/features/set-model';
export {
    FeatureSet,
    IModelIndex,
    ModelIndexImpl,
    SChildElementImpl as SChildElement,
    SModelElementImpl as SModelElement,
    SModelRootImpl as SModelRoot,
    SParentElementImpl as SParentElement,
    createRandomId,
    isParent
} from 'sprotty/lib/base/model/smodel';
export * from 'sprotty/lib/base/model/smodel-extension';
export * from 'sprotty/lib/base/model/smodel-factory';
export {
    containsSome,
    findParent,
    findParentByFeature,
    registerModelElement,
    translateBounds,
    translatePoint
} from 'sprotty/lib/base/model/smodel-utils';
export * from 'sprotty/lib/base/tool-manager/tool';
export * from 'sprotty/lib/base/tool-manager/tool-manager';
export * from 'sprotty/lib/base/ui-extensions/ui-extension';
export * from 'sprotty/lib/base/ui-extensions/ui-extension-registry';
export * from 'sprotty/lib/base/views/dom-helper';
export * from 'sprotty/lib/base/views/key-tool';
export * from 'sprotty/lib/base/views/mouse-tool';
export * from 'sprotty/lib/base/views/thunk-view';
export * from 'sprotty/lib/base/views/view';
export * from 'sprotty/lib/base/views/viewer';
export * from 'sprotty/lib/base/views/viewer-cache';
export * from 'sprotty/lib/base/views/viewer-options';
export * from 'sprotty/lib/base/views/vnode-postprocessor';
export * from 'sprotty/lib/base/views/vnode-utils';
export * from 'sprotty/lib/features/bounds/abstract-layout';
// ------------------ Features ------------------
export {
    RequestBoundsCommand,
    ResolvedElementAndAlignment,
    ResolvedElementAndBounds,
    SetBoundsCommand
} from 'sprotty/lib/features/bounds/bounds-manipulation';
export * from 'sprotty/lib/features/bounds/hbox-layout';
export * from 'sprotty/lib/features/bounds/hidden-bounds-updater';
export * from 'sprotty/lib/features/bounds/layout';
export * from 'sprotty/lib/features/bounds/layout-options';
export {
    Alignable,
    BoundsAware,
    LayoutContainer,
    LayoutableChild,
    ModelLayoutOptions,
    SShapeElementImpl as SShapeElement,
    alignFeature,
    boundsFeature,
    findChildrenAtPosition,
    getAbsoluteBounds,
    getAbsoluteClientBounds,
    isAlignable,
    isBoundsAware,
    isLayoutContainer,
    isLayoutableChild,
    isSizeable,
    layoutContainerFeature,
    layoutableChildFeature
} from 'sprotty/lib/features/bounds/model';
export * from 'sprotty/lib/features/bounds/stack-layout';
export * from 'sprotty/lib/features/bounds/vbox-layout';
export * from 'sprotty/lib/features/bounds/views';
export {
    ButtonHandlerRegistry,
    IButtonHandler,
    IButtonHandlerRegistration,
    configureButtonHandler
} from 'sprotty/lib/features/button/button-handler';
export { SButtonImpl as SButton, SButtonSchema } from 'sprotty/lib/features/button/model';
export * from 'sprotty/lib/features/command-palette/action-providers';
export * from 'sprotty/lib/features/command-palette/command-palette';
export { Anchor, IContextMenuService, IContextMenuServiceProvider } from 'sprotty/lib/features/context-menu/context-menu-service';
export * from 'sprotty/lib/features/context-menu/menu-providers';
export * from 'sprotty/lib/features/context-menu/mouse-listener';
export * from 'sprotty/lib/features/decoration/decoration-placer';
export * from 'sprotty/lib/features/decoration/model';
export * from 'sprotty/lib/features/decoration/views';
export * from 'sprotty/lib/features/edge-intersection/intersection-finder';
export * from 'sprotty/lib/features/edge-intersection/sweepline';
export * from 'sprotty/lib/features/edge-layout/edge-layout';
export * from 'sprotty/lib/features/edge-layout/model';
export * from 'sprotty/lib/features/edit/create';
export * from 'sprotty/lib/features/edit/create-on-drag';
export * from 'sprotty/lib/features/edit/delete';
export * from 'sprotty/lib/features/edit/edit-label';
export * from 'sprotty/lib/features/edit/edit-label-ui';
export * from 'sprotty/lib/features/edit/edit-routing';
export * from 'sprotty/lib/features/edit/model';
export * from 'sprotty/lib/features/edit/reconnect';
export * from 'sprotty/lib/features/expand/expand';
export * from 'sprotty/lib/features/expand/model';
export * from 'sprotty/lib/features/expand/views';
export { ExportSvgCommand, ExportSvgKeyListener, ExportSvgPostprocessor, RequestExportSvgAction } from 'sprotty/lib/features/export/export';
export * from 'sprotty/lib/features/export/model';
export { ExportSvgAction, SvgExporter } from 'sprotty/lib/features/export/svg-exporter';
export * from 'sprotty/lib/features/fade/fade';
export * from 'sprotty/lib/features/fade/model';
export {
    AbstractHoverMouseListener,
    ClosePopupActionHandler,
    HoverFeedbackCommand,
    HoverKeyListener,
    HoverMouseListener,
    HoverState,
    PopupHoverMouseListener,
    SetPopupModelCommand
} from 'sprotty/lib/features/hover/hover';
export * from 'sprotty/lib/features/hover/model';
export { PopupPositionUpdater } from 'sprotty/lib/features/hover/popup-position-updater';
export * from 'sprotty/lib/features/move/model';
export {
    ElementMove,
    LocationPostprocessor,
    MorphEdgesAnimation,
    MoveAnimation,
    MoveCommand,
    MoveMouseListener,
    ResolvedElementMove,
    ResolvedHandleMove
} from 'sprotty/lib/features/move/move';
export * from 'sprotty/lib/features/move/snap';
export * from 'sprotty/lib/features/nameable/model';
export * from 'sprotty/lib/features/open/model';
export * from 'sprotty/lib/features/open/open';
export * from 'sprotty/lib/features/projection/model';
export * from 'sprotty/lib/features/projection/views';
export * from 'sprotty/lib/features/routing/abstract-edge-router';
export * from 'sprotty/lib/features/routing/anchor';
export * from 'sprotty/lib/features/routing/bezier-anchors';
export * from 'sprotty/lib/features/routing/bezier-edge-router';
export * from 'sprotty/lib/features/routing/manhattan-anchors';
export * from 'sprotty/lib/features/routing/manhattan-edge-router';
export {
    Connectable,
    RoutingHandleKind,
    SConnectableElementImpl as SConnectableElement,
    SDanglingAnchorImpl as SDanglingAnchor,
    SRoutableElementImpl as SRoutableElement,
    SRoutingHandleImpl as SRoutingHandle,
    connectableFeature,
    edgeInProgressID,
    edgeInProgressTargetHandleID,
    getAbsoluteRouteBounds,
    getRouteBounds,
    isConnectable
} from 'sprotty/lib/features/routing/model';
export * from 'sprotty/lib/features/routing/polyline-anchors';
export * from 'sprotty/lib/features/routing/polyline-edge-router';
export * from 'sprotty/lib/features/routing/routing';
export * from 'sprotty/lib/features/routing/views';
export * from 'sprotty/lib/features/select/model';
export {
    GetSelectionCommand,
    SelectKeyboardListener,
    SelectMouseListener,
    SelectAllCommand as SprottySelectAllCommand,
    SelectCommand as SprottySelectCommand
} from 'sprotty/lib/features/select/select';
export { UndoRedoKeyListener } from 'sprotty/lib/features/undo-redo/undo-redo';
export * from 'sprotty/lib/features/update/model-matching';
export { UpdateAnimationData, UpdateModelCommand } from 'sprotty/lib/features/update/update-model';
export {
    BoundsAwareViewportCommand,
    CenterCommand,
    CenterKeyboardListener,
    FitToScreenCommand
} from 'sprotty/lib/features/viewport/center-fit';
export * from 'sprotty/lib/features/viewport/model';
export * from 'sprotty/lib/features/viewport/scroll';
export { GetViewportCommand, SetViewportCommand, ViewportAnimation } from 'sprotty/lib/features/viewport/viewport';
export * from 'sprotty/lib/features/viewport/viewport-root';
export * from 'sprotty/lib/features/viewport/zoom';
export { BringToFrontCommand, ZOrderElement } from 'sprotty/lib/features/zorder/zorder';
export {
    SCompartmentImpl as SCompartment,
    SEdgeImpl as SEdge,
    SGraphImpl as SGraph,
    SGraphIndex,
    SLabelImpl as SLabel,
    SNodeImpl as SNode,
    SPortImpl as SPort
} from 'sprotty/lib/graph/sgraph';
export * from 'sprotty/lib/lib/virtualize';
// ------------------ Graph ------------------
export * from 'sprotty/lib/graph/sgraph-factory';
export * from 'sprotty/lib/graph/views';
export * from 'sprotty/lib/lib/generic-views';
export * from 'sprotty/lib/lib/html-views';
export * from 'sprotty/lib/lib/jsx';
export {
    CircularNode,
    CircularPort,
    DiamondNode,
    ForeignObjectElementImpl as ForeignObjectElement,
    HtmlRootImpl as HtmlRoot,
    PreRenderedElementImpl as PreRenderedElement,
    RectangularNode,
    RectangularPort,
    ShapedPreRenderedElementImpl as ShapedPreRenderedElement
} from 'sprotty/lib/lib/model';
// ------------------ Library ------------------
export * from 'sprotty/lib/lib/modules';
export * from 'sprotty/lib/lib/svg-views';
// ------------------ Model Source ------------------
export * from 'sprotty/lib/model-source/commit-model';
export { DiagramServerProxy } from 'sprotty/lib/model-source/diagram-server';
export * from 'sprotty/lib/model-source/local-model-source';
export * from 'sprotty/lib/model-source/logging';
export * from 'sprotty/lib/model-source/model-source';
export * from 'sprotty/lib/model-source/websocket';
// ------------------ Utilities ------------------
export * from 'sprotty/lib/utils/browser';
export * from 'sprotty/lib/utils/codicon';
export * from 'sprotty/lib/utils/color';
export { Diamond, Insets, Line, Orientation, PointToPointLine, intersection } from 'sprotty/lib/utils/geometry';
export * from 'sprotty/lib/utils/inversify';
export * from 'sprotty/lib/utils/iterable';
export * from 'sprotty/lib/utils/keyboard';
export * from 'sprotty/lib/utils/logging';
export * from 'sprotty/lib/utils/registry';
/**
 * Misc glsp adaptions/augmentations
 */
export * from './augmented-actions';
export * from './types';
/**
 * Modules
 */
import defaultModule from 'sprotty/lib/base/di.config';
import boundsModule from 'sprotty/lib/features/bounds/di.config';
import buttonModule from 'sprotty/lib/features/button/di.config';
import commandPaletteModule from 'sprotty/lib/features/command-palette/di.config';
import contextMenuModule from 'sprotty/lib/features/context-menu/di.config';
import decorationModule from 'sprotty/lib/features/decoration/di.config';
import edgeIntersectionModule from 'sprotty/lib/features/edge-intersection/di.config';
import edgeLayoutModule from 'sprotty/lib/features/edge-layout/di.config';
import { edgeEditModule, labelEditModule, labelEditUiModule } from 'sprotty/lib/features/edit/di.config';
import expandModule from 'sprotty/lib/features/expand/di.config';
import exportModule from 'sprotty/lib/features/export/di.config';
import fadeModule from 'sprotty/lib/features/fade/di.config';
import hoverModule from 'sprotty/lib/features/hover/di.config';
import moveModule from 'sprotty/lib/features/move/di.config';
import openModule from 'sprotty/lib/features/open/di.config';
import routingModule from 'sprotty/lib/features/routing/di.config';
import selectModule from 'sprotty/lib/features/select/di.config';
import undoRedoModule from 'sprotty/lib/features/undo-redo/di.config';
import updateModule from 'sprotty/lib/features/update/di.config';
import viewportModule from 'sprotty/lib/features/viewport/di.config';
import zorderModule from 'sprotty/lib/features/zorder/di.config';
import graphModule from 'sprotty/lib/graph/di.config';
import modelSourceModule from 'sprotty/lib/model-source/di.config';

export {
    buttonModule,
    defaultModule,
    edgeEditModule,
    edgeIntersectionModule,
    edgeLayoutModule,
    expandModule,
    fadeModule,
    viewportModule as glspViewportModule,
    graphModule,
    labelEditUiModule,
    modelSourceModule,
    moveModule,
    openModule,
    boundsModule as sprottyBoundsModule,
    commandPaletteModule as sprottyCommandModule,
    contextMenuModule as sprottyContextMenuModule,
    decorationModule as sprottyDecorationModule,
    exportModule as sprottyExportModule,
    hoverModule as sprottyHoverModule,
    labelEditModule as sprottyLabelEditModule,
    routingModule as sprottyRoutingModule,
    selectModule as sprottySelectModule,
    undoRedoModule,
    updateModule,
    zorderModule
};
