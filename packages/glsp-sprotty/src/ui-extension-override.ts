/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import '../css/ui-extension.css';

import { injectable } from 'inversify';
import {
    AbstractUIExtension as SprottyAbstractUIExtension,
    CommandPalette as SprottyCommandPalette,
    EditLabelUI as SprottyEditLabelUI
} from 'sprotty';

export const CSS_UI_EXTENSION_CLASS = 'ui-extension';
export const CSS_HIDDEN_EXTENSION_CLASS = 'hidden';

// An override to enables more fine-grained control of the container structure for the UI extension.

@injectable()
export abstract class AbstractUIExtension extends SprottyAbstractUIExtension {
    protected get diagramContainerId(): string {
        return this.options.baseDiv;
    }

    protected get parentContainerSelector(): string {
        return '#' + this.diagramContainerId;
    }

    protected get containerSelector(): string {
        return '#' + this.id();
    }

    protected get initialized(): boolean {
        return !!this.containerElement;
    }

    protected override initialize(): boolean {
        if (this.initialized) {
            return true;
        }
        try {
            this.containerElement = this.getOrCreateContainer();
            this.initializeContainer(this.containerElement);
            this.initializeContents(this.containerElement);
        } catch (error) {
            const msg = error instanceof Error ? error.message : `Could not retrieve container element for UI extension ${this.id}`;
            this.logger.error(this, msg);
            return false;
        }
        return true;
    }

    protected override getOrCreateContainer(): HTMLElement {
        if (this.containerElement) {
            return this.containerElement;
        }
        // check if the container already exists, independent from any potential parent container
        // this allows us to use existing elements defined anywhere in the document
        const existingContainer = this.getContainer();
        if (existingContainer) {
            return existingContainer;
        }
        // to create a container the parent container
        const parent = this.getParentContainer();
        if (!parent || !parent.isConnected) {
            throw new Error(`Could not obtain attached parent for initializing UI extension ${this.id}`);
        }
        const container = this.createContainer(parent);
        this.insertContainerIntoParent(container, parent);
        return container;
    }

    protected getContainer(): HTMLElement | null {
        return document.querySelector<HTMLElement>(this.containerSelector);
    }

    protected createContainer(parent: HTMLElement): HTMLElement {
        const container = document.createElement('div');
        container.id = parent.id + '_' + this.id();
        return container;
    }

    protected initializeContainer(container: HTMLElement): void {
        container.classList.add(CSS_UI_EXTENSION_CLASS, this.containerClass());
    }

    protected getParentContainer(): HTMLElement {
        return document.querySelector<HTMLElement>(this.parentContainerSelector)!;
    }

    protected insertContainerIntoParent(container: HTMLElement, parent: HTMLElement): void {
        parent.insertBefore(container, parent.firstChild);
    }

    protected override setContainerVisible(visible: boolean): void {
        // the parent class simply sets the style directly, however classes provide more fine-grained control
        if (visible) {
            this.containerElement?.classList.remove(CSS_HIDDEN_EXTENSION_CLASS);
        } else {
            this.containerElement?.classList.add(CSS_HIDDEN_EXTENSION_CLASS);
        }
    }

    protected isContainerVisible(): boolean {
        return this.containerElement && !this.containerElement.classList.contains(CSS_HIDDEN_EXTENSION_CLASS);
    }

    protected toggleContainerVisible(): void {
        this.setContainerVisible(!this.isContainerVisible());
    }
}

@injectable()
export class EditLabelUI extends SprottyEditLabelUI {
    protected override initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);
        containerElement.classList.add(CSS_UI_EXTENSION_CLASS);
    }

    protected override setContainerVisible(visible: boolean): void {
        if (visible) {
            this.containerElement?.classList.remove(CSS_HIDDEN_EXTENSION_CLASS);
        } else {
            this.containerElement?.classList.add(CSS_HIDDEN_EXTENSION_CLASS);
        }
    }
}

@injectable()
export class CommandPalette extends SprottyCommandPalette {
    protected override initializeContents(containerElement: HTMLElement): void {
        super.initializeContents(containerElement);
        containerElement.classList.add(CSS_UI_EXTENSION_CLASS);
    }

    protected override setContainerVisible(visible: boolean): void {
        if (visible) {
            this.containerElement?.classList.remove(CSS_HIDDEN_EXTENSION_CLASS);
        } else {
            this.containerElement?.classList.add(CSS_HIDDEN_EXTENSION_CLASS);
        }
    }
}
