/* ArkeoGIS - The Geographic Information System for Archaeologists
 * Copyright (C) 2015-2016 CROLL SAS
 *
 * Authors :
 *  Christophe Beveraggi <beve@croll.fr>
 *  Nicolas Dimitrijevic <nicolas@croll.fr>
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
    ArkeoGIS.directive('arkLeaflet', ['arkeoMap', function(arkeoMap) {
        return {
            replace: true,
            template: '<div height="mapHeight"></div>',
            scope: {
                height: '='
            },
            link: function(scope, element, attributes) {

                arkeoMap.initLeaflet(element[0]);

                scope.$watch('height', function(newVal, oldVal) {
                    if (!newVal) return;
                    element.css('height', newVal);
                });

                element.css('height', $(window).height() - $("#arkeo-main-toolbar").height() -20 + "px");

            }
        };
    }]);
})();
