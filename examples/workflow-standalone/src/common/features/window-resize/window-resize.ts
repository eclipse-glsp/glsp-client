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

import { GLSPActionDispatcher, IDiagramStartup, InitializeCanvasBoundsAction, TYPES } from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';

/** Smallest size the app card may be dragged down to. */
const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;

/** A resize handle straddles its card edge by this many pixels on each side. */
const HANDLE_THICKNESS = 8;
const CORNER_SIZE = 16;

/** The eight resize directions, keyed by the edges each one moves. */
type Direction = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const CURSORS: Record<Direction, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize'
};

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Makes the standalone app card user-resizable by dragging its borders.
 *
 * Resizing is symmetric about the card's center: dragging any edge or corner grows or shrinks
 * the opposite side equally, so the card — and the diagram it contains — stays centered in the
 * shell. The shell already flex-centers the card, so only its width and height change. Since the
 * diagram only re-measures its canvas on a native `window.resize`, every size change additionally
 * dispatches an {@link InitializeCanvasBoundsAction} so the viewport tracks the new `#sprotty` bounds.
 */
@injectable()
export class WindowResizer implements IDiagramStartup {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    protected shell: HTMLElement;
    protected card: HTMLElement;
    protected layer: HTMLElement;
    protected handles: Partial<Record<Direction, HTMLElement>> = {};

    /** Geometry of an in-progress drag; `undefined` while idle. */
    protected drag?: { direction: Direction; pointerId: number; startX: number; startY: number; startWidth: number; startHeight: number };
    /** Pending `requestAnimationFrame` handle for the throttled bounds dispatch. */
    protected boundsFrame?: number;

    postModelInitialization(): void {
        const shell = document.querySelector<HTMLElement>('.app-shell');
        const card = document.querySelector<HTMLElement>('.app-card');
        if (!shell || !card) {
            return;
        }
        this.shell = shell;
        this.card = card;
        this.createHandles();
        this.layoutHandles();
        window.addEventListener('resize', this.onWindowResize);
    }

    protected createHandles(): void {
        this.layer = document.createElement('div');
        this.layer.className = 'window-resize-layer';
        (Object.keys(CURSORS) as Direction[]).forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `window-resize-handle window-resize-handle--${direction}`;
            handle.style.cursor = CURSORS[direction];
            handle.addEventListener('pointerdown', event => this.onPointerDown(event, direction));
            this.layer.appendChild(handle);
            this.handles[direction] = handle;
        });
        this.shell.appendChild(this.layer);
    }

    /** Position the handle overlay around the card's current bounds (relative to the shell). */
    protected layoutHandles(): void {
        const rect = this.cardRect();
        const place = (direction: Direction, x: number, y: number, width: number, height: number): void => {
            const handle = this.handles[direction];
            if (!handle) {
                return;
            }
            handle.style.left = `${x}px`;
            handle.style.top = `${y}px`;
            handle.style.width = `${width}px`;
            handle.style.height = `${height}px`;
        };
        const right = rect.x + rect.width;
        const bottom = rect.y + rect.height;
        const half = HANDLE_THICKNESS / 2;
        const corner = CORNER_SIZE;

        place('n', rect.x, rect.y - half, rect.width, HANDLE_THICKNESS);
        place('s', rect.x, bottom - half, rect.width, HANDLE_THICKNESS);
        place('w', rect.x - half, rect.y, HANDLE_THICKNESS, rect.height);
        place('e', right - half, rect.y, HANDLE_THICKNESS, rect.height);
        place('nw', rect.x - half, rect.y - half, corner, corner);
        place('ne', right + half - corner, rect.y - half, corner, corner);
        place('sw', rect.x - half, bottom + half - corner, corner, corner);
        place('se', right + half - corner, bottom + half - corner, corner, corner);
    }

    protected onPointerDown(event: PointerEvent, direction: Direction): void {
        event.preventDefault();
        const start = this.cardRect();
        this.drag = {
            direction,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: start.width,
            startHeight: start.height
        };
        const handle = this.handles[direction];
        handle?.setPointerCapture(event.pointerId);
        handle?.addEventListener('pointermove', this.onPointerMove);
        handle?.addEventListener('pointerup', this.onPointerUp);
        this.layer.classList.add('window-resize-layer--active');
    }

    protected onPointerMove = (event: PointerEvent): void => {
        if (!this.drag) {
            return;
        }
        const { direction, startWidth, startHeight, startX, startY } = this.drag;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const bounds = this.shellBounds();

        // symmetric about the center: dragging one edge mirrors the opposite edge, so the size
        // changes by twice the pointer delta and the (flex-centered) card stays centered
        let width = startWidth;
        let height = startHeight;
        if (direction.includes('e') || direction.includes('w')) {
            const growth = direction.includes('e') ? dx : -dx;
            width = clamp(startWidth + 2 * growth, MIN_WIDTH, bounds.width);
        }
        if (direction.includes('s') || direction.includes('n')) {
            const growth = direction.includes('s') ? dy : -dy;
            height = clamp(startHeight + 2 * growth, MIN_HEIGHT, bounds.height);
        }

        this.setCardSize(width, height);
        this.layoutHandles();
        this.scheduleBoundsUpdate();
    };

    protected onPointerUp = (event: PointerEvent): void => {
        if (!this.drag) {
            return;
        }
        const handle = this.handles[this.drag.direction];
        handle?.releasePointerCapture(event.pointerId);
        handle?.removeEventListener('pointermove', this.onPointerMove);
        handle?.removeEventListener('pointerup', this.onPointerUp);
        this.layer.classList.remove('window-resize-layer--active');
        this.drag = undefined;
        this.dispatchCanvasBounds();
    };

    protected onWindowResize = (): void => {
        // the shell keeps the card centered; only re-clamp an explicit size so it still fits
        if (this.card.style.width || this.card.style.height) {
            const bounds = this.shellBounds();
            const rect = this.cardRect();
            this.setCardSize(clamp(rect.width, MIN_WIDTH, bounds.width), clamp(rect.height, MIN_HEIGHT, bounds.height));
        }
        this.layoutHandles();
    };

    /** Apply an explicit card size; the shell's flex centering keeps the card centered. */
    protected setCardSize(width: number, height: number): void {
        // lift the css default cap (max-width/height) so an explicit size can grow past it; the
        // drag is already clamped to the shell bounds, so the cap would only block growing.
        this.card.style.maxWidth = 'none';
        this.card.style.maxHeight = 'none';
        this.card.style.width = `${width}px`;
        this.card.style.height = `${height}px`;
    }

    /** Current card bounds relative to the shell's padding box. */
    protected cardRect(): Rect {
        const card = this.card.getBoundingClientRect();
        const shell = this.shell.getBoundingClientRect();
        return { x: card.left - shell.left, y: card.top - shell.top, width: card.width, height: card.height };
    }

    /** Available area for the card inside the shell's padding box. */
    protected shellBounds(): { width: number; height: number } {
        const shell = this.shell.getBoundingClientRect();
        return { width: shell.width, height: shell.height };
    }

    protected scheduleBoundsUpdate(): void {
        if (this.boundsFrame !== undefined) {
            return;
        }
        this.boundsFrame = requestAnimationFrame(() => {
            this.boundsFrame = undefined;
            this.dispatchCanvasBounds();
        });
    }

    /** Re-measure `#sprotty` and tell the diagram about its new canvas bounds. */
    protected dispatchCanvasBounds(): void {
        const sprotty = document.getElementById('sprotty');
        if (!sprotty) {
            return;
        }
        const rect = sprotty.getBoundingClientRect();
        const newBounds = {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
        this.actionDispatcher.dispatch(InitializeCanvasBoundsAction.create(newBounds));
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}
