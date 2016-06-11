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
    ArkeoGIS.directive('arkYear', function() {

		return {
			restrict: 'A',
            require: 'ngModel',

            link: function(scope, element, attrs, ngModel) {
                if(!ngModel) return; // Don't do anything unless we have a model

                element.bind('blur keyup change', function() {
                    var re = ''+reformat(ngModel.$viewValue);
                    if (re != ''+ngModel.$viewValue) {
                        ngModel.$setViewValue(re);
                        ngModel.$render();
                    }
                });

                function reformat(val) {
                    var v = parseInt(val);
                    return isNaN(v) ? val : (v > 0 ? '+'+v : v);
                }

                ngModel.$parsers.push(function (val) {
                    return parseInt(val);
                });

                ngModel.$formatters.push(function (val) {
                    return reformat(val);
                });
            },
        };
    });

    ArkeoGIS.filter('arkYear', function () {
        return function(val) {
            var v = parseInt(val);
            return isNaN(v) ? val : (v > 0 ? '+'+v : v);
        }
    });
})();
