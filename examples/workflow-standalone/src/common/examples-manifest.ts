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

/**
 * A selectable example diagram, bundled with the standalone app. Each entry maps a
 * source file to the GLSP diagram type (i.e. language) that renders it. The selector
 * panel lists the entries grouped by {@link ExampleEntry.group}.
 */
export interface ExampleEntry {
    /** Stable id, used as the `?source=` URL parameter value. */
    readonly id: string;
    /** File name shown in the selector, relative to the app directory. */
    readonly file: string;
    /** Language group the example is listed under. */
    readonly group: string;
    /** GLSP diagram type that renders this example. */
    readonly diagramType: string;
}

/**
 * The bundled examples. One server hosts both languages, so a single endpoint serves
 * every entry — only the `diagramType` and source file differ.
 */
export const EXAMPLES: ExampleEntry[] = [
    { id: 'workflow-example1', file: 'example1.wf', group: 'Workflow', diagramType: 'workflow-diagram' },
    { id: 'gmodel-simple', file: 'simple.gm', group: 'GModel Demo', diagramType: 'gmodel-demo' }
];

/** Resolves the example for the given id, falling back to the first entry. */
export function resolveExample(id?: string | null): ExampleEntry {
    return EXAMPLES.find(entry => entry.id === id) ?? EXAMPLES[0];
}
