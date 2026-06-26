/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import {
    AlignElementsAction,
    Alignment,
    CenterAction,
    ClientMenuItem,
    EditorContextService,
    FitToScreenAction,
    ReduceFunctionType,
    RequestExportAction,
    ResizeDimension,
    ResizeElementsAction,
    SelectAllAction,
    SelectFunctionType,
    TriggerLayoutAction
} from '@eclipse-glsp/client';

interface ResizeEntry {
    id: string;
    label: string;
    group: string;
    dimension: ResizeDimension;
    reduceFunction: ReduceFunctionType;
}

interface AlignEntry {
    id: string;
    label: string;
    group: string;
    alignment: Alignment;
    selectionFunction: SelectFunctionType;
}

const RESIZE_ENTRIES: ResizeEntry[] = [
    { id: 'resize-width-min', label: 'Minimal Width', group: 'width', dimension: ResizeDimension.Width, reduceFunction: 'min' },
    { id: 'resize-width-max', label: 'Maximal Width', group: 'width', dimension: ResizeDimension.Width, reduceFunction: 'max' },
    { id: 'resize-width-avg', label: 'Average Width', group: 'width', dimension: ResizeDimension.Width, reduceFunction: 'avg' },
    { id: 'resize-height-min', label: 'Minimal Height', group: 'height', dimension: ResizeDimension.Height, reduceFunction: 'min' },
    { id: 'resize-height-max', label: 'Maximal Height', group: 'height', dimension: ResizeDimension.Height, reduceFunction: 'max' },
    { id: 'resize-height-avg', label: 'Average Height', group: 'height', dimension: ResizeDimension.Height, reduceFunction: 'avg' },
    {
        id: 'resize-both-min',
        label: 'Minimal Width and Height',
        group: 'both',
        dimension: ResizeDimension.Width_And_Height,
        reduceFunction: 'min'
    },
    {
        id: 'resize-both-max',
        label: 'Maximal Width and Height',
        group: 'both',
        dimension: ResizeDimension.Width_And_Height,
        reduceFunction: 'max'
    },
    {
        id: 'resize-both-avg',
        label: 'Average Width and Height',
        group: 'both',
        dimension: ResizeDimension.Width_And_Height,
        reduceFunction: 'avg'
    }
];

const ALIGN_ENTRIES: AlignEntry[] = [
    { id: 'align-left', label: 'Left', group: 'horizontal', alignment: Alignment.Left, selectionFunction: 'all' },
    { id: 'align-center', label: 'Center', group: 'horizontal', alignment: Alignment.Center, selectionFunction: 'all' },
    { id: 'align-right', label: 'Right', group: 'horizontal', alignment: Alignment.Right, selectionFunction: 'all' },
    { id: 'align-top', label: 'Top', group: 'vertical', alignment: Alignment.Top, selectionFunction: 'all' },
    { id: 'align-middle', label: 'Middle', group: 'vertical', alignment: Alignment.Middle, selectionFunction: 'all' },
    { id: 'align-bottom', label: 'Bottom', group: 'vertical', alignment: Alignment.Bottom, selectionFunction: 'all' }
];

/**
 * Builds the `Diagram` menu, mirroring the diagram and layout menus of the GLSP Theia integration
 * (`Center`, `Fit to Screen`, `Export`, `Layout`, `Select All` plus the `Resize` and `Align` submenus).
 * The layout submenus are only enabled when more than one element is selected in an editable diagram.
 *
 * @param editorContext Used to derive the enablement of the layout commands.
 * @returns The children of the diagram menu.
 */
export function createDiagramMenu(editorContext: EditorContextService): ClientMenuItem[] {
    const layoutEnabled = (): boolean => !editorContext.isReadonly && editorContext.selectedElements.length > 1;

    const resize: ClientMenuItem = {
        id: 'resize',
        label: 'Resize',
        group: 'layout',
        actions: [],
        isEnabled: layoutEnabled,
        children: RESIZE_ENTRIES.map(entry => ({
            id: entry.id,
            label: entry.label,
            group: entry.group,
            actions: [ResizeElementsAction.create({ dimension: entry.dimension, reduceFunction: entry.reduceFunction })]
        }))
    };

    const align: ClientMenuItem = {
        id: 'align',
        label: 'Align',
        group: 'layout',
        actions: [],
        isEnabled: layoutEnabled,
        children: ALIGN_ENTRIES.map(entry => ({
            id: entry.id,
            label: entry.label,
            group: entry.group,
            actions: [AlignElementsAction.create({ alignment: entry.alignment, selectionFunction: entry.selectionFunction })]
        }))
    };

    return [
        { id: 'center', label: 'Center', group: 'view', actions: [CenterAction.create([])] },
        { id: 'fit', label: 'Fit to Screen', group: 'view', actions: [FitToScreenAction.create([])] },
        { id: 'export', label: 'Export', group: 'view', actions: [RequestExportAction.create('svg')] },
        { id: 'layout', label: 'Layout', group: 'edit', actions: [TriggerLayoutAction.create()] },
        { id: 'select-all', label: 'Select All', group: 'edit', actions: [SelectAllAction.create(true)] },
        resize,
        align
    ];
}
