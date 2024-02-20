/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
import { expect } from 'chai';
import 'mocha';
import 'reflect-metadata';
import { BoundsData, ConsoleLogger, GModelElement } from '@eclipse-glsp/sprotty';
import { createCompartment, createGraph, createLabel, createNode, layout, setupLayoutRegistry } from './layouter-test-util.spec';

describe('FreeFormLayouter', () => {
    const layoutRegistry = setupLayoutRegistry();
    const log = new ConsoleLogger();
    const map = new Map<GModelElement, BoundsData>();

    describe('issue-610', () => {
        it('recursive hGrab/vGrab', () => {
            /**
             *  _________________________
             * |       Category 1        |
             * | _______________________ |
             * ||                       ||
             * ||                       ||
             * ||                       ||
             * ||                       ||
             * ||_______________________||
             * | _______________________ |
             * ||_left____________right_||
             * |_________________________|
             *
             * This test case checks recursive hGrab/vGrab functionality of nested compartments
             * See also issue 610 for details and an example model https://github.com/eclipse-glsp/glsp/issues/610.
             */
            const model = createGraph();
            const category = createNode('category', 'vbox', { width: 410.0, height: 215.0 }, undefined, {
                vGrab: false,
                hGrab: false,
                hAlign: 'center',
                prefWidth: 410.0,
                prefHeight: 215.0
            });
            const headerComp = createCompartment('comp:header', 'hbox');
            headerComp.children = [createLabel('Category 1')];
            const childContainer = createCompartment('struct', 'freeform', { hGrab: true, vGrab: true });
            const labelContainer = createCompartment('struct', 'hbox', { hGrab: true });
            labelContainer.children = [createLabel('left text', { hGrab: true }), createLabel('right text')];
            category.children = [headerComp, childContainer, labelContainer];

            model.add(category);
            layout(layoutRegistry, log, map, model);
            // check category
            expect(map.get(category)!.bounds).to.deep.equal({ x: 0, y: 0, width: 410.0, height: 215.0 });
            // check header compartment
            expect(map.get(category.children[0])!.bounds).to.deep.equal({ x: 0, y: 0, width: -1, height: -1 });
            // check child freeform compartment
            expect(map.get(category.children[1])!.bounds).to.deep.equal({ x: 5, y: 5, width: 400.0, height: 205.0 });
            // check label compartment
            expect(map.get(category.children[2])!.bounds).to.deep.equal({ x: 0, y: 0, width: -1, height: -1 });
        });
    });

    describe('issue-694', () => {
        it('Structure compartment (hGrab=true, vGrab=true), Left-aligned label (hGrab=true), right-aligned label (hGrab=false)', () => {
            /**
             *  _________________________
             * |       Category 2        |
             * | _______________________ |
             * ||                       ||
             * ||                       ||
             * ||           Task node   ||
             * ||                       ||
             * ||_______________________||
             * | _______________________ |
             * ||_left____________right_||
             * |_________________________|
             */
            const model = createGraph();
            const category = createNode('category', 'vbox', { width: 500.0, height: 375.0 }, undefined, {
                vGrab: false,
                hGrab: false,
                hAlign: 'center',
                prefWidth: 500.0,
                prefHeight: 375.0
            });
            const headerComp = createCompartment('comp:header', 'hbox');
            headerComp.children = [createLabel('Category 2')];
            const childContainer = createCompartment('struct', 'freeform', { hGrab: true, vGrab: true });
            const childNode = createNode('task', 'hbox', undefined, { x: 170, y: 190 });
            childNode.children = [createLabel('Task node', undefined, { x: 5.0, y: 5.0 }, { width: 25.0, height: 20.0 })];
            childContainer.children = [childNode];
            const labelContainer = createCompartment('struct', 'hbox', { hGrab: true });
            labelContainer.children = [createLabel('left text', { hGrab: true }), createLabel('right text')];
            category.children = [headerComp, childContainer, labelContainer];

            model.add(category);

            // layout graph
            layout(layoutRegistry, log, map, model);
            // check category
            expect(map.get(category)!.bounds).to.deep.equal({ x: 0, y: 0, width: 500.0, height: 375.0 });
            // check header compartment
            expect(map.get(category.children[0])!.bounds).to.deep.equal({ x: 0, y: 0, width: -1, height: -1 });
            // check child freeform compartment
            expect(map.get(category.children[1])!.bounds).to.deep.equal({ x: 5.0, y: 5.0, width: 490.0, height: 365.0 });
            // check child task node
            expect(map.get(category.children[1].children[0])!.bounds).to.deep.equal({ x: 170.0, y: 190.0, width: 35.0, height: 30.0 });
            // check label compartment
            expect(map.get(category.children[2])!.bounds).to.deep.equal({ x: 0, y: 0, width: -1, height: -1 });
        });

        it('Structure compartment (hGrab=true, vGrab=true)', () => {
            /**
             *  _________________________
             * |       Category 2        |
             * | _______________________ |
             * ||                       ||
             * ||  Task node            ||
             * ||                       ||
             * ||                       ||
             * ||_______________________||
             * |_________________________|
             */
            const model = createGraph();
            const category = createNode('category', 'vbox', { width: 500.0, height: 375.0 }, undefined, {
                vGrab: false,
                hGrab: false,
                hAlign: 'center',
                prefWidth: 500.0,
                prefHeight: 375.0
            });
            const headerComp = createCompartment('comp:header', 'hbox');
            headerComp.children = [createLabel('Category 2')];
            const childContainer = createCompartment('struct', 'freeform', { hGrab: true, vGrab: true });
            const childNode = createNode('task', 'hbox', undefined, { x: 55, y: 15 });
            childNode.children = [createLabel('Task node', undefined, undefined, { width: 50.0, height: 35.0 })];
            childContainer.children = [childNode];
            category.children = [headerComp, childContainer];

            model.add(category);

            // layout graph
            layout(layoutRegistry, log, map, model);
            // check category
            expect(map.get(category)!.bounds).to.deep.equal({ x: 0, y: 0, width: 500.0, height: 375.0 });
            // check header compartment
            expect(map.get(category.children[0])!.bounds).to.deep.equal({ x: 0, y: 0, width: -1, height: -1 });
            // check child freeform compartment
            expect(map.get(category.children[1])!.bounds).to.deep.equal({ x: 5.0, y: 5.0, width: 490.0, height: 365.0 });
            // check child task node
            expect(map.get(category.children[1].children[0])!.bounds).to.deep.equal({ x: 55.0, y: 15.0, width: 60.0, height: 45.0 });
        });

        it('Structure compartment (hGrab=true, vGrab=true, padding*=10)', () => {
            /**
             *  _________________________
             * |       Category 2        |
             * | _______________________ |
             * ||                       ||
             * ||  Task node            ||
             * ||                       ||
             * ||                       ||
             * ||_______________________||
             * |_________________________|
             */
            const model = createGraph();
            const category = createNode('category', 'vbox', { width: 500.0, height: 375.0 }, undefined, {
                vGrab: false,
                hGrab: false,
                hAlign: 'center',
                prefWidth: 500.0,
                prefHeight: 375.0,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 10,
                paddingBottom: 10
            });
            const headerComp = createCompartment('comp:header', 'hbox');
            headerComp.children = [createLabel('Category 2')];
            const childContainer = createCompartment('struct', 'freeform', { hGrab: true, vGrab: true });
            const childNode = createNode(
                'task',
                'hbox',
                undefined,
                { x: 55, y: 15 },
                { paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }
            );
            childNode.children = [createLabel('Task node', undefined, undefined, { width: 50.0, height: 35.0 })];
            childContainer.children = [childNode];
            category.children = [headerComp, childContainer];

            model.add(category);

            // layout graph
            layout(layoutRegistry, log, map, model);
            // check category
            expect(map.get(category)!.bounds).to.deep.equal({ x: 0, y: 0, width: 500.0, height: 375.0 });
            // check header compartment
            expect(map.get(category.children[0])!.bounds).to.deep.equal({ x: 0, y: 0, width: -1, height: -1 });
            // check child freeform compartment
            expect(map.get(category.children[1])!.bounds).to.deep.equal({ x: 10.0, y: 10.0, width: 480.0, height: 355.0 });
            // check child task node
            expect(map.get(category.children[1].children[0])!.bounds).to.deep.equal({ x: 55.0, y: 15.0, width: 70.0, height: 55.0 });
        });
    });
});
