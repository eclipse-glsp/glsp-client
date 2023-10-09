/********************************************************************************
 * Copyright (c) 2021-2023 EclipseSource and others.
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
    Action,
    BoundsAware,
    DOMHelper,
    GModelElement,
    GModelRoot,
    GNode,
    KeyListener,
    SelectAction,
    TYPES,
    isSelectable,
    isSelected
} from '@eclipse-glsp/sprotty';
import { inject, injectable, optional } from 'inversify';
import { DragAwareMouseListener } from '../../../base/drag-aware-mouse-listener';
import { CursorCSS, cursorFeedbackAction } from '../../../base/feedback/css-feedback';
import { EnableDefaultToolsAction } from '../../../base/tool-manager/tool';
import { getAbsolutePosition, toAbsoluteBounds } from '../../../utils/viewpoint-util';
import { BaseEditTool } from '../base-tools';
import { IMarqueeBehavior, MarqueeUtil } from './marquee-behavior';
import { RemoveMarqueeAction } from './marquee-tool-feedback';
import { GEdge } from '../../../model';

@injectable()
export class MarqueeMouseTool extends BaseEditTool {
    static ID = 'glsp.marquee-mouse-tool';

    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;
    @inject(TYPES.IMarqueeBehavior) @optional() protected marqueeBehavior: IMarqueeBehavior;

    protected shiftKeyListener: ShiftKeyListener = new ShiftKeyListener();

    get id(): string {
        return MarqueeMouseTool.ID;
    }

    enable(): void {
        this.toDisposeOnDisable.push(
            this.mouseTool.registerListener(new MarqueeMouseListener(this.domHelper, this.editorContext.modelRoot, this.marqueeBehavior)),
            this.keyTool.registerListener(this.shiftKeyListener),
            this.registerFeedback([cursorFeedbackAction(CursorCSS.MARQUEE)], this, [cursorFeedbackAction()])
        );
    }
}

export class MarqueeMouseListener extends DragAwareMouseListener {
    protected domHelper: DOMHelper;
    protected marqueeUtil: MarqueeUtil;
    protected nodes: (GModelElement & BoundsAware)[];
    protected edges: SVGGElement[];
    protected previouslySelected: string[];
    protected isActive = false;

    constructor(domHelper: DOMHelper, root: GModelRoot, marqueeBehavior: IMarqueeBehavior | undefined) {
        super();
        this.domHelper = domHelper;
        this.marqueeUtil = new MarqueeUtil(marqueeBehavior);
        this.nodes = Array.from(
            root.index
                .all()
                .map(e => e as GModelElement & BoundsAware)
                .filter(e => isSelectable(e))
                .filter(e => e instanceof GNode)
        );
        const sEdges = Array.from(
            root.index
                .all()
                .filter(e => e instanceof GEdge)
                .filter(e => isSelectable(e))
                .map(e => e.id)
        );
        this.edges = Array.from(document.querySelectorAll('g')).filter(e => sEdges.includes(this.domHelper.findSModelIdByDOMElement(e)));
    }

    override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
        this.isActive = true;
        this.marqueeUtil.updateStartPoint(getAbsolutePosition(target, event));
        if (event.ctrlKey) {
            this.previouslySelected = Array.from(
                target.root.index
                    .all()
                    .map(e => e as GModelElement & BoundsAware)
                    .filter(e => isSelected(e))
                    .map(e => e.id)
            );
        }
        return [];
    }

    override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
        this.marqueeUtil.updateCurrentPoint(getAbsolutePosition(target, event));
        if (this.isActive) {
            const nodeIdsSelected = this.nodes.filter(e => this.marqueeUtil.isNodeMarked(toAbsoluteBounds(e))).map(e => e.id);
            const edgeIdsSelected = this.edges.filter(e => this.isEdgeMarked(e)).map(e => this.domHelper.findSModelIdByDOMElement(e));
            const selected = nodeIdsSelected.concat(edgeIdsSelected);
            return [SelectAction.setSelection(selected.concat(this.previouslySelected)), this.marqueeUtil.drawMarqueeAction()];
        }
        return [];
    }

    override mouseUp(_target: GModelElement, event: MouseEvent): Action[] {
        this.isActive = false;
        if (event.shiftKey) {
            return [RemoveMarqueeAction.create()];
        }
        return [RemoveMarqueeAction.create(), EnableDefaultToolsAction.create()];
    }

    isEdgeMarked(element: SVGElement): boolean {
        if (!element.getAttribute('transform')) {
            if (element.children[0]) {
                const path = element.children[0].getAttribute('d');
                return this.marqueeUtil.isEdgePathMarked(path);
            }
        }
        return false;
    }
}

@injectable()
export class ShiftKeyListener extends KeyListener {
    override keyUp(element: GModelElement, event: KeyboardEvent): Action[] {
        if (event.shiftKey) {
            return [];
        }
        return [RemoveMarqueeAction.create(), EnableDefaultToolsAction.create()];
    }
}
