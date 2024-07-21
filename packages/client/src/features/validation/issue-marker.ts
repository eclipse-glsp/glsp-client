/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
    Bounds,
    GDecoration,
    GIssue,
    GIssueSeverity,
    GParentElement,
    Marker,
    MarkerKind,
    Projectable,
    SIssueMarkerImpl,
    isBoundsAware
} from '@eclipse-glsp/sprotty';

export class GIssueMarker extends SIssueMarkerImpl implements Projectable {
    constructor() {
        super();
        this.features = new Set<symbol>(GDecoration.DEFAULT_FEATURES);
    }
    projectionCssClasses: string[];
    projectedBounds?: Bounds;
    override issues: GIssue[] = [];
    override type = 'marker';

    computeProjectionCssClasses(): void {
        const severityCss = getSeverity(this);
        this.projectionCssClasses = ['sprotty-issue', 'sprotty-' + severityCss];
    }
}

/**
 * Retrieves the `GIssueMarker` contained by the provided model element as
 * direct child or a newly instantiated `GIssueMarker` if no child
 * `GIssueMarker` exists.
 * @param modelElement for which the `GIssueMarker` should be retrieved or created.
 * @returns the child `GIssueMarker` or a new `GIssueMarker` if no such child exists.
 */
export function getOrCreateGIssueMarker(modelElement: GParentElement): GIssueMarker {
    let issueMarker: GIssueMarker | undefined;

    issueMarker = getGIssueMarker(modelElement);

    if (issueMarker === undefined) {
        issueMarker = new GIssueMarker();
        if (isBoundsAware(modelElement)) {
            issueMarker.projectedBounds = modelElement.parentToLocal(modelElement.bounds);
        }
        modelElement.add(issueMarker);
    }

    return issueMarker;
}

/**
 * Retrieves the `GIssueMarker` contained by the provided model element as
 * direct child or `undefined` if such an `GIssueMarker` does not exist.
 * @param modelElement for which the `GIssueMarker` should be retrieved.
 * @returns the child `GIssueMarker` or `undefined` if no such child exists.
 */
export function getGIssueMarker(modelElement: GParentElement): GIssueMarker | undefined {
    let issueMarker: GIssueMarker | undefined;

    for (const child of modelElement.children) {
        if (child instanceof GIssueMarker) {
            issueMarker = child;
        }
    }

    return issueMarker;
}

/**
 * Creates an `GIssue` with `severity` and `message` set according to
 * the `kind` and `description` of the provided `Marker`.
 * @param marker `Marker` for that an `GIssue` should be created.
 * @returns the created `GIssue`.
 */
export function createGIssue(marker: Marker, parent?: GParentElement): GIssue {
    const issue: GIssue = {
        message: marker.description,
        severity: 'info'
    };
    switch (marker.kind) {
        case MarkerKind.ERROR: {
            issue.severity = 'error';
            break;
        }
        case MarkerKind.INFO: {
            issue.severity = 'info';
            break;
        }
        case MarkerKind.WARNING: {
            issue.severity = 'warning';
            break;
        }
    }
    return issue;
}

export function getSeverity(marker: GIssueMarker): GIssueSeverity {
    let currentSeverity: GIssueSeverity = 'info';
    for (const severity of marker.issues.map(s => s.severity)) {
        if (severity === 'error') {
            return severity;
        }
        if (severity === 'warning' && currentSeverity === 'info') {
            currentSeverity = severity;
        }
    }
    return currentSeverity;
}
