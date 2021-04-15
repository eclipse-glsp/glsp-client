/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
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
/* eslint-disable max-len */
import { injectable } from 'inversify';
import * as snabbdom from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';
import { IssueMarkerView, RenderingContext, setClass, SIssueMarker, SIssueSeverity } from 'sprotty';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: snabbdom.svg };

@injectable()
export class GIssueMarkerView extends IssueMarkerView {

    render(marker: SIssueMarker, _context: RenderingContext): VNode {
        const maxSeverity = super.getMaxSeverity(marker);
        const group = <g class-sprotty-issue={true} >
            <g>
                <circle class-sprotty-issue-background={true} r={this.radius} cx={this.radius} cy={this.radius} />
                <path d={this.getGlspIssueMarkerPath(maxSeverity)} />
            </g>
        </g>;
        setClass(group, 'sprotty-' + maxSeverity, true);
        return group;
    }

    protected get radius(): number {
        return 8; // var(--theia-icon-size)=16px => 16/2=8
    }

    protected getGlspIssueMarkerPath(severity: SIssueSeverity): string {
        switch (severity) {
            // paths used here are svg versions of FontAwesome icons, resized to var(--theia-icon-size) 16px
            case 'error': // 'fa-times-circle'
                return 'M 8,0 C 3.5806452,0 0,3.58065 0,8 c 0,4.41935 3.5806452,8 8,8 4.419355,0 8,-3.58065 8,-8 C 16,3.58065 12.419355,0 8,0 Z m 3.922581,10.1 c 0.151613,0.15161 0.151613,0.39677 0,0.54839 l -1.27742,1.27419 c -0.151613,0.15161 -0.396774,0.15161 -0.548387,0 L 8,9.80645 5.9,11.92258 c -0.1516129,0.15161 -0.3967742,0.15161 -0.5483871,0 L 4.0774194,10.64516 c -0.1516129,-0.15161 -0.1516129,-0.39677 0,-0.54839 L 6.1935484,8 4.0774194,5.9 c -0.1516129,-0.15161 -0.1516129,-0.39677 0,-0.54839 L 5.3548387,4.07419 c 0.1516129,-0.15161 0.3967742,-0.15161 0.5483871,0 L 8,6.19355 10.1,4.07742 c 0.151613,-0.15161 0.396774,-0.15161 0.548387,0 l 1.277419,1.27742 c 0.151613,0.15161 0.151613,0.39677 0,0.54839 L 9.8064516,8 Z';
            case 'warning': // 'fa-exclamation-circle'
                return 'm 16,8 c 0,4.41926 -3.582032,8 -8,8 C 3.5820323,16 0,12.41926 0,8 0,3.58332 3.5820323,0 8,0 c 4.417968,0 8,3.58332 8,8 z M 8,9.6129 c -0.8195161,0 -1.483871,0.66436 -1.483871,1.48387 0,0.81952 0.6643549,1.48388 1.483871,1.48388 0.8195161,0 1.483871,-0.66436 1.483871,-1.48388 C 9.483871,10.27726 8.8195161,9.6129 8,9.6129 Z M 6.5911935,4.27916 6.8304839,8.66626 c 0.011194,0.20529 0.1809355,0.366 0.3865161,0.366 h 1.566 c 0.2055806,0 0.3753226,-0.16071 0.3865161,-0.366 L 9.4088065,4.27916 C 9.4209035,4.05742 9.2443548,3.87097 9.0222903,3.87097 H 6.9776774 c -0.2220645,0 -0.3985806,0.18645 -0.3864839,0.40819 z';
            case 'info': // 'fa-info-circle information'
                return 'M 8.0000004,0 C 3.5820324,0 0,3.58332 0,8 0,12.41926 3.5820324,16 8.0000004,16 12.417968,16 16,12.41926 16,8 16,3.58332 12.417968,0 8.0000004,0 Z m 0,3.54839 c 0.748258,0 1.354839,0.60658 1.354839,1.35484 0,0.74825 -0.606581,1.35483 -1.354839,1.35483 -0.748258,0 -1.354839,-0.60658 -1.354839,-1.35483 0,-0.74826 0.606581,-1.35484 1.354839,-1.35484 z m 1.806452,8.19355 c 0,0.21377 -0.173323,0.38709 -0.387097,0.38709 h -2.83871 c -0.213774,0 -0.387097,-0.17332 -0.387097,-0.38709 v -0.7742 c 0,-0.21377 0.173323,-0.38709 0.387097,-0.38709 h 0.387097 V 8.51613 h -0.387097 c -0.213774,0 -0.387097,-0.17332 -0.387097,-0.3871 V 7.35484 c 0,-0.21378 0.173323,-0.3871 0.387097,-0.3871 h 2.064516 c 0.213774,0 0.387097,0.17332 0.387097,0.3871 v 3.22581 h 0.387097 c 0.213774,0 0.387097,0.17332 0.387097,0.38709 z';
        }
    }

}
