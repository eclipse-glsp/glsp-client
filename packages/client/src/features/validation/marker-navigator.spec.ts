/********************************************************************************
 * Copyright (c) 2020-2023 EclipseSource and others.
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
import { BoundsAware, GChildElement, GIssue, GModelElement, GModelRoot, GNode, GParentElement } from '@eclipse-glsp/sprotty';
import { expect } from 'chai';
import { Container } from 'inversify';
import 'mocha';
import 'reflect-metadata';
import { defaultModule } from '../../base/default.module';
import { GGraph } from '../../model';
import { decorationModule } from '../decoration/decoration-module';
import { GIssueMarker } from './issue-marker';
import { MarkerNavigator } from './marker-navigator';
import { markerNavigatorModule } from './validation-modules';

describe('MarkerNavigator', () => {
    const container = new Container();
    container.load(defaultModule, decorationModule, markerNavigatorModule);
    const markerNavigator = container.get<MarkerNavigator>(MarkerNavigator);
    function createRoot(...nodeIds: string[]): GModelRoot {
        const root = new GGraph();
        root.features = new Set<symbol>(GGraph.DEFAULT_FEATURES);
        root.id = 'root';
        root.type = 'graph';
        nodeIds.forEach(id => {
            const node = new GNode();
            node.id = id;
            node.type = 'node';
            node.features = new Set<symbol>(GNode.DEFAULT_FEATURES);
            root.add(node);
        });
        return root;
    }

    const rootWithoutAnyMarkers = createRoot('1');

    const rootWithMarkers = createRoot('bottom-right', 'top-right', 'top-left', 'bottom-left');

    const elementTopLeft = rootWithMarkers.children[2] as BoundsAware & GChildElement;
    elementTopLeft.bounds = { width: 10, height: 10, x: 100, y: 100 };
    const elementTopRight = rootWithMarkers.children[1] as BoundsAware & GChildElement;
    elementTopRight.bounds = { width: 10, height: 10, x: 200, y: 100 };
    const elementBottomLeft = rootWithMarkers.children[3] as BoundsAware & GChildElement;
    elementBottomLeft.bounds = { width: 10, height: 10, x: 100, y: 200 };
    const elementBottomRight = rootWithMarkers.children[0] as BoundsAware & GChildElement;
    elementBottomRight.bounds = { width: 10, height: 10, x: 200, y: 200 };

    beforeEach('clear issue marker', () => {
        [elementTopLeft, elementTopRight, elementBottomLeft, elementBottomRight].forEach(clearMarker);
    });

    it('next(undefined) without any markers returns undefined', () => {
        expect(markerNavigator.next(rootWithoutAnyMarkers)).to.be.undefined;
    });

    it('previous(undefined) without any markers returns undefined', () => {
        expect(markerNavigator.previous(rootWithoutAnyMarkers)).to.be.undefined;
    });

    it('next(undefined) with one marker returns the one marker', () => {
        const marker = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const next = markerNavigator.next(rootWithMarkers);
        expect(next).to.eql(marker);
    });

    it('next(firstMarker) with only one marker returns again the first marker', () => {
        const marker = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const next = markerNavigator.next(rootWithMarkers, marker);
        expect(next).to.eql(marker);
        // and again and again
        const nextNext = markerNavigator.next(rootWithMarkers, next);
        expect(nextNext).to.eql(marker);
    });

    it('previous(firstMarker) with only one marker returns again the first marker', () => {
        const marker = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const previous = markerNavigator.previous(rootWithMarkers, marker);
        expect(previous).to.eql(marker);
        // and again and again
        const previousPrevious = markerNavigator.previous(rootWithMarkers, previous);
        expect(previousPrevious).to.eql(marker);
    });

    it('next(firstMarker) with two marker returns second marker then again first marker', () => {
        const marker1 = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const marker2 = setIssues(elementTopRight, [{ message: 'msg', severity: 'error' }]);
        const next = markerNavigator.next(rootWithMarkers, marker1);
        expect(next).to.eql(marker2);
        // and again and again
        const nextNext = markerNavigator.next(rootWithMarkers, next);
        expect(nextNext).to.eql(marker1);
    });

    it('previous(firstMarker) with two marker returns second marker then again first marker', () => {
        const marker1 = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const marker2 = setIssues(elementTopRight, [{ message: 'msg', severity: 'error' }]);
        const next = markerNavigator.previous(rootWithMarkers, marker1);
        expect(next).to.eql(marker2);
        // and again and again
        const nextNext = markerNavigator.previous(rootWithMarkers, next);
        expect(nextNext).to.eql(marker1);
    });

    it('returns markers in the order left-to-right, top-to-bottom with next()', () => {
        const marker1 = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const marker2 = setIssues(elementTopRight, [{ message: 'msg', severity: 'error' }]);
        const marker3 = setIssues(elementBottomLeft, [{ message: 'msg', severity: 'error' }]);
        const marker4 = setIssues(elementBottomRight, [{ message: 'msg', severity: 'error' }]);
        const found1 = markerNavigator.next(rootWithMarkers);
        const found2 = markerNavigator.next(rootWithMarkers, found1);
        const found3 = markerNavigator.next(rootWithMarkers, found2);
        const found4 = markerNavigator.next(rootWithMarkers, found3);
        const found5 = markerNavigator.next(rootWithMarkers, found4);
        expect(found1).to.eql(marker1);
        expect(found2).to.eql(marker2);
        expect(found3).to.eql(marker3);
        expect(found4).to.eql(marker4);
        expect(found5).to.eql(marker1);
    });

    it('returns markers in the order left-to-right, top-to-bottom with previous()', () => {
        const marker1 = setIssues(elementTopLeft, [{ message: 'msg', severity: 'error' }]);
        const marker2 = setIssues(elementTopRight, [{ message: 'msg', severity: 'error' }]);
        const marker3 = setIssues(elementBottomLeft, [{ message: 'msg', severity: 'error' }]);
        const marker4 = setIssues(elementBottomRight, [{ message: 'msg', severity: 'error' }]);
        const found1 = markerNavigator.previous(rootWithMarkers);
        const found2 = markerNavigator.previous(rootWithMarkers, found1);
        const found3 = markerNavigator.previous(rootWithMarkers, found2);
        const found4 = markerNavigator.previous(rootWithMarkers, found3);
        const found5 = markerNavigator.previous(rootWithMarkers, found4);
        expect(found1).to.eql(marker1);
        expect(found2).to.eql(marker4);
        expect(found3).to.eql(marker3);
        expect(found4).to.eql(marker2);
        expect(found5).to.eql(marker1);
    });
});

function clearMarker(elem: GParentElement): void {
    elem.children.filter(isMarker).forEach(marker => elem.remove(marker));
}

function setIssues(elem: GParentElement, issues: GIssue[]): GIssueMarker {
    const marker = getOrCreateMarker(elem);
    marker.issues = issues;
    return marker;
}

function getOrCreateMarker(elem: GParentElement): GIssueMarker {
    const marker = findMarker(elem);
    if (marker instanceof GIssueMarker) {
        return marker;
    }
    return createMarker(elem as GParentElement);
}

function findMarker(elem: GParentElement): GIssueMarker | undefined {
    return elem.children.find(isMarker);
}

function isMarker(element: GModelElement): element is GIssueMarker {
    return element instanceof GIssueMarker;
}

function createMarker(elem: GParentElement): GIssueMarker {
    const newMarker = new GIssueMarker();
    newMarker.type = 'marker';
    newMarker.id = `${elem.id}_marker`;
    elem.add(newMarker);
    return newMarker;
}
