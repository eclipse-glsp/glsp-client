/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { SIssueMarker, SParentElement } from "sprotty";

export namespace MarkerKind {
    export const INFO = "info";
    export const WARNING = "warning";
    export const ERROR = "error";
}

export namespace MarkerPredicates {
    export const ALL = () => true;
    export const ERRORS = (marker: SIssueMarker) => hasIssueWithSeverity(marker, MarkerKind.ERROR);
    export const WARNINGS = (marker: SIssueMarker) => hasIssueWithSeverity(marker, MarkerKind.WARNING);
    export const INFOS = (marker: SIssueMarker) => hasIssueWithSeverity(marker, MarkerKind.INFO);

    export function hasIssueWithSeverity(marker: SIssueMarker, severity: 'info' | 'warning' | 'error') {
        return marker.issues.find(issue => issue.severity === severity) !== undefined;
    }
}

export function collectIssueMarkers(root: SParentElement): SIssueMarker[] {
    const markers = [];
    for (const child of root.children) {
        if (child instanceof SIssueMarker) {
            markers.push(child);
        }
        markers.push(...collectIssueMarkers(child));
    }
    return markers;
}

export interface Marker {
    /**
     * Short label describing this marker message, e.g., short validation message
     */
    readonly label: string;
    /**
     * Full description of this marker, e.g., full validation message
     */
    readonly description: string;
    /**
     * Id of the model element this marker refers to
     */
    readonly elementId: string;
    /**
     * Marker kind, e.g., info, warning, error or custom kind
     */
    readonly kind: string;
}
