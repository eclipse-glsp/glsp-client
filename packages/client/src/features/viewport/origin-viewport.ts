/********************************************************************************
 * Copyright (c) 2024-2025 Axon Ivy AG and others.
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

import { Action, Bounds, BoundsAwareViewportCommand, GModelRoot, TYPES, Viewport, limitViewport } from '@eclipse-glsp/sprotty';
import { inject, injectable } from 'inversify';
import { EditorContextService } from '../../base/editor-context-service';

export interface OriginViewportAction extends Action {
    kind: typeof OriginViewportAction.KIND;
    animate: boolean;
}

export namespace OriginViewportAction {
    export const KIND = 'originViewport';

    export function is(object: any): object is OriginViewportAction {
        return Action.hasKind(object, KIND);
    }

    export function create(options: { animate?: boolean } = {}): OriginViewportAction {
        return {
            kind: KIND,
            animate: true,
            ...options
        };
    }
}

@injectable()
export class OriginViewportCommand extends BoundsAwareViewportCommand {
    static readonly KIND = OriginViewportAction.KIND;

    @inject(EditorContextService) protected readonly editorContext: EditorContextService;

    constructor(@inject(TYPES.Action) protected action: OriginViewportAction) {
        super(action.animate);
    }

    getElementIds(): string[] {
        return [];
    }

    protected override initialize(model: GModelRoot): void {
        const viewport = this.editorContext.viewport;
        if (!viewport) {
            return;
        }
        this.oldViewport = { scroll: viewport.scroll, zoom: viewport.zoom };
        const newViewport = this.getNewViewport(Bounds.EMPTY, viewport);
        if (newViewport) {
            const { zoomLimits, horizontalScrollLimits, verticalScrollLimits } = this.viewerOptions;
            this.newViewport = limitViewport(newViewport, viewport.canvasBounds, horizontalScrollLimits, verticalScrollLimits, zoomLimits);
        }
    }

    getNewViewport(_bounds: Bounds, _model: GModelRoot): Viewport | undefined {
        return { zoom: 1, scroll: { x: 0, y: 0 } };
    }
}
