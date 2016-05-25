/* ArkeoGIS - The Geographic Information System for Archaeologists
 * Copyright (C) 2015-2016 CROLL SAS
 *
 * Authors :
 *  Nicolas Dimitrijevic <nicolas@croll.fr>
 *  Christophe Beveraggi <beve@croll.fr>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
    'use strict';
    ArkeoGIS.directive('arkTriButton', function() {

		return {
			restrict: 'E',
			template: '<md-icon class="ark-tri-button">{{state.icon}}</md-icon>',
            replace: true,
            scope: {
                states: '=?',
                ngModel: '=?',
            },

            link: function(scope, element, attrs) {
                if (scope.states === undefined) {
                    scope.states=[
                        {
                            value: '0',
                            icon: 'brightness_1'
                        },
                        {
                            value: '+',
                            icon: 'add_circle'
                        },
                        {
                            value: '-',
                            icon: 'remove_circle'
                        },
                    ];
                }

                scope.state=scope.states[0]; // init
                scope.ngModel = scope.state.value;

                element.on('mousedown', function(event) {
                    //console.log("scope.states", scope.states);
                    event.preventDefault();

                    for (var i=0; i<scope.states.length; i++) {
                        var state=scope.states[i];
                        if (state.value == scope.state.value) {
                            if (++i == scope.states.length) i=0;
                            scope.state = scope.states[i];
                            break;
                        }
                    }

                    element.html(scope.state.icon);
                    scope.ngModel = scope.state.value;

                    // update ngModel
                    scope.$apply();

                    //console.log("click : ", scope.state);
                });
            },
        };

    });
})();
