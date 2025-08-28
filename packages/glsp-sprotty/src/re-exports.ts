/********************************************************************************
 * Copyright (c) 2023-2025 EclipseSource and others.
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
 * @eclipse-glsp/protocol
 */
export * from '@eclipse-glsp/protocol';
export * from '@eclipse-glsp/protocol/lib/di';

/*
 * sprotty
 */
// ------------------ Base ------------------

// Exclude  definition for labeled actions
// export * from 'sprotty/lib/base/actions/action';
// Exclude IActionDispatcher and IActionDispatcherProvider. Exported via api-override module instead
export { ActionDispatcher, PostponedAction } from 'sprotty/lib/base/actions/action-dispatcher';
export {
    ActionHandlerRegistration,
    ActionHandlerRegistry,
    IActionHandlerInitializer,
    configureActionHandler,
    onAction
} from 'sprotty/lib/base/actions/action-handler';
export * from 'sprotty/lib/base/actions/diagram-locker';

export * from 'sprotty/lib/base/animations/animation';
export * from 'sprotty/lib/base/animations/animation-frame-syncer';
export * from 'sprotty/lib/base/animations/easing';

export * from 'sprotty/lib/base/commands/command';
export * from 'sprotty/lib/base/commands/command-registration';
// Exclude ICommandStack and ICommandStackProvider. Exported via api-override module instead
export { CommandStack, CommandStackState } from 'sprotty/lib/base/commands/command-stack';
export * from 'sprotty/lib/base/commands/command-stack-options';

export * from 'sprotty/lib/base/features/initialize-canvas';
export * from 'sprotty/lib/base/features/set-model';
// Exclude SModelElementImpl as it as exported with augmentation module
export {
    FeatureSet,
    SChildElementImpl as GChildElement,
    SModelElementImpl as GModelElement,
    SModelRootImpl as GModelRoot,
    SParentElementImpl as GParentElement,
    IModelIndex,
    ModelIndexImpl,
    createRandomId,
    isParent
} from 'sprotty/lib/base/model/smodel';

export {
    CustomFeatures,
    EMPTY_ROOT,
    SModelElementConstructor as GModelElementConstructor,
    SModelElementRegistration as GModelElementRegistration,
    SModelFactory as GModelFactory,
    IModelFactory,
    // exported without alias we extend it in glsp-client to `GModelRegistry`
    SModelRegistry,
    createFeatureSet
} from 'sprotty/lib/base/model/smodel-factory';
export * from 'sprotty/lib/base/model/smodel-utils';

export * from 'sprotty/lib/base/ui-extensions/ui-extension';
export * from 'sprotty/lib/base/ui-extensions/ui-extension-registry';

export * from 'sprotty/lib/base/views/dom-helper';
export { KeyTool } from 'sprotty/lib/base/views/key-tool';
export { MouseEventKind, MousePositionTracker, MouseTool, PopupMouseTool } from 'sprotty/lib/base/views/mouse-tool';
export * from 'sprotty/lib/base/views/thunk-view';
export * from 'sprotty/lib/base/views/view';
export * from 'sprotty/lib/base/views/viewer';
export * from 'sprotty/lib/base/views/viewer-cache';
export * from 'sprotty/lib/base/views/viewer-options';
// Exclude IVnodePostprocessor. Exported via api-override module instead
export { FocusFixPostprocessor } from 'sprotty/lib/base/views/vnode-postprocessor';
export * from 'sprotty/lib/base/views/vnode-utils';

// Exclude sprotty types and export augmented GLSP types instead
// export * from 'sprotty/lib/base/types';

// ------------------ Features ------------------
export * from 'sprotty/lib/features/bounds/bounds-manipulation';
export { HBoxLayoutOptions } from 'sprotty/lib/features/bounds/hbox-layout';
export * from 'sprotty/lib/features/bounds/hidden-bounds-updater';
export { Layouter, StatefulLayouter } from 'sprotty/lib/features/bounds/layout';
export { AbstractLayoutOptions } from 'sprotty/lib/features/bounds/layout-options';
export {
    InternalBoundsAware as BoundsAware,
    SShapeElementImpl as GShapeElement,
    InternalLayoutContainer as LayoutContainer,
    InternalLayoutableChild as LayoutableChild,
    ModelLayoutOptions,
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
// exclude stack layout as its not supported in GLSP
// export * from 'sprotty/lib/features/bounds/stack-layout';
export { VBoxLayoutOptions } from 'sprotty/lib/features/bounds/vbox-layout';
export * from 'sprotty/lib/features/bounds/views';

export { ButtonHandlerRegistry, IButtonHandlerRegistration, configureButtonHandler } from 'sprotty/lib/features/button/button-handler';
export { SButtonImpl as GButton } from 'sprotty/lib/features/button/model';

export {
    CommandPaletteActionProviderRegistry,
    RevealNamedElementActionProvider
} from 'sprotty/lib/features/command-palette/action-providers';
export * from 'sprotty/lib/features/command-palette/command-palette';

// Exclude menu item. Already provided by glsp-protocol
export { Anchor, IContextMenuService, IContextMenuServiceProvider } from 'sprotty/lib/features/context-menu/context-menu-service';
export { ContextMenuProviderRegistry, DeleteContextMenuItemProvider } from 'sprotty/lib/features/context-menu/menu-providers';
export * from 'sprotty/lib/features/context-menu/mouse-listener';

export * from 'sprotty/lib/features/edge-layout/di.config';
export * from 'sprotty/lib/features/edge-layout/edge-layout';
export { DEFAULT_EDGE_PLACEMENT, checkEdgePlacement, edgeLayoutFeature, isEdgeLayoutable } from 'sprotty/lib/features/edge-layout/model';
// Exclude client-side creation features (not supported in GLSP)
// export * from 'sprotty/lib/features/edit/create';
// export * from 'sprotty/lib/features/edit/create-on-drag';
export * from 'sprotty/lib/features/edit/delete';
export * from 'sprotty/lib/features/edit/edit-label';
export * from 'sprotty/lib/features/edit/edit-label-ui';
export * from 'sprotty/lib/features/edit/edit-routing';
export * from 'sprotty/lib/features/edit/model';
// export * from 'sprotty/lib/features/edit/reconnect';

export * from 'sprotty/lib/features/expand/expand';
export { expandFeature, isExpandable } from 'sprotty/lib/features/expand/model';
export * from 'sprotty/lib/features/expand/views';
// Exclude RequestExportSvgAction. Already provided by glsp-protocol
export { ExportSvgCommand, ExportSvgKeyListener, ExportSvgPostprocessor } from 'sprotty/lib/features/export/export';
export * from 'sprotty/lib/features/export/model';
// Exclude ExportSvgAction. Already provided by glsp-protocol
export { SvgExporter } from 'sprotty/lib/features/export/svg-exporter';

export * from 'sprotty/lib/features/fade/fade';
export { fadeFeature, isFadeable } from 'sprotty/lib/features/fade/model';

export * from 'sprotty/lib/features/hover/hover';
export { hasPopupFeature, hoverFeedbackFeature, isHoverable, popupFeature } from 'sprotty/lib/features/hover/model';
export * from 'sprotty/lib/features/hover/popup-position-updater';

// Alias SModel types
export * from 'sprotty/lib/features/decoration/decoration-placer';
export {
    Decoration,
    SDecoration as GDecoration,
    SIssueMarkerImpl,
    decorationFeature,
    isDecoration
} from 'sprotty/lib/features/decoration/model';
export * from 'sprotty/lib/features/decoration/views';

export * from 'sprotty/lib/features/edge-intersection/intersection-finder';
export * from 'sprotty/lib/features/edge-intersection/sweepline';

export * from 'sprotty/lib/features/edge-junction/junction-finder';

export { isLocateable, isMoveable, moveFeature } from 'sprotty/lib/features/move/model';
export * from 'sprotty/lib/features/move/move';
export * from 'sprotty/lib/features/move/snap';

export * from 'sprotty/lib/features/nameable/model';

export * from 'sprotty/lib/features/open/model';
export * from 'sprotty/lib/features/open/open';

export { ViewProjection, getModelBounds, getProjectedBounds, getProjections, isProjectable } from 'sprotty/lib/features/projection/model';
export * from 'sprotty/lib/features/projection/views';

export * from 'sprotty/lib/features/routing/abstract-edge-router';
export * from 'sprotty/lib/features/routing/anchor';
export * from 'sprotty/lib/features/routing/bezier-anchors';
export * from 'sprotty/lib/features/routing/bezier-edge-router';
export * from 'sprotty/lib/features/routing/manhattan-anchors';
export * from 'sprotty/lib/features/routing/manhattan-edge-router';

// Alias SModel types
export {
    Connectable,
    SConnectableElementImpl as GConnectableElement,
    SDanglingAnchorImpl as GDanglingAnchor,
    SRoutableElementImpl as GRoutableElement,
    SRoutingHandleImpl as GRoutingHandle,
    RoutingHandleKind,
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

export { isSelectable, isSelected, selectFeature } from 'sprotty/lib/features/select/model';
// Alias Select commands with sprotty prefix to avoid clash with glsp-client
export {
    GetSelectionCommand,
    SelectKeyboardListener,
    SelectMouseListener,
    SelectAllCommand as SprottySelectAllCommand,
    SelectCommand as SprottySelectCommand
} from 'sprotty/lib/features/select/select';

// Exclude undo-redo as the client provides its own implementation
// export * from 'sprotty/lib/features/undo-redo/undo-redo';

export * from 'sprotty/lib/features/update/model-matching';
export * from 'sprotty/lib/features/update/update-model';

export * from 'sprotty/lib/features/viewport/center-fit';
export * from 'sprotty/lib/features/viewport/model';
export * from 'sprotty/lib/features/viewport/scroll';
// Alias SModel types
export * from 'sprotty/lib/features/viewport/viewport';
export { ViewportRootElementImpl as GViewportRootElement } from 'sprotty/lib/features/viewport/viewport-root';
export * from 'sprotty/lib/features/viewport/zoom';

export { BringToFrontCommand as SprottyBringToFrontCommand, ZOrderElement } from 'sprotty/lib/features/zorder/zorder';

// ------------------ Graph ------------------
// Alias SModel types
export {
    SCompartmentImpl as GCompartment,
    SGraphIndex as GGraphIndex,
    SLabelImpl as GLabel,
    SNodeImpl as GNode,
    SPortImpl as GPort,
    // Exported as is, we extend it in glsp-client to GEdge
    SEdgeImpl,
    // Exported as is, we extend it in glsp-client to GGraph
    SGraphImpl
} from 'sprotty/lib/graph/sgraph';
// Alias SModel types
export {
    BezierCurveEdgeView,
    SBezierControlHandleView as GBezierControlHandleView,
    SBezierCreateHandleView as GBezierCreateHandleView,
    SCompartmentView as GCompartmentView,
    SLabelView as GLabelView,
    JumpingPolylineEdgeView,
    PolylineEdgeView,
    PolylineEdgeViewWithGapsOnIntersections,
    SGraphView,
    SRoutingHandleView
} from 'sprotty/lib/graph/views';

// ------------------ Library ------------------

export * from 'sprotty/lib/lib/generic-views';
export * from 'sprotty/lib/lib/html-views';
export * from 'sprotty/lib/lib/jsx';
// Alias SModel types
export {
    CircularNode,
    CircularPort,
    DiamondNode,
    ForeignObjectElementImpl as GForeignObjectElement,
    HtmlRootImpl as GHtmlRoot,
    PreRenderedElementImpl as GPreRenderedElement,
    ShapedPreRenderedElementImpl as GShapedPreRenderedElement,
    RectangularNode,
    RectangularPort
} from 'sprotty/lib/lib/model';
export * from 'sprotty/lib/lib/modules';
export { EmptyGroupView, RectangularNodeView, SvgViewportView } from 'sprotty/lib/lib/svg-views';

// ------------------ Model Source ------------------
export * from 'sprotty/lib/model-source/commit-model';
// Exclude as not supported in GLSP
// export * from 'sprotty/lib/model-source/diagram-server';
// export * from 'sprotty/lib/model-source/local-model-source';
export * from 'sprotty/lib/model-source/logging';
export * from 'sprotty/lib/model-source/model-source';
// export * from 'sprotty/lib/model-source/websocket';

// ------------------ Utilities ------------------
export * from 'sprotty/lib/utils/browser';
export * from 'sprotty/lib/utils/codicon';
export * from 'sprotty/lib/utils/color';
export * from 'sprotty/lib/utils/geometry';
export * from 'sprotty/lib/utils/inversify';
export * from 'sprotty/lib/utils/iterable';
export * from 'sprotty/lib/utils/keyboard';
export * from 'sprotty/lib/utils/logging';
export * from 'sprotty/lib/utils/registry';
