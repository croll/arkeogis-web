/* ArkeoGIS - The Arkeolog Geographical Information Server Program
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
	ArkeoGIS.controller('MapCtrl', ['$scope', function($scope) {
		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $(".md-default-theme .md-toolbar-tools").height() - 65 +"px";
		};
		$(window).on('resize', resize);
		resize();
		// Leaflet init
		angular.extend($scope, {
			defaults: {
				zoomControlPosition: 'topright'
			},
			center: {
				lat: 48.58476,
				lng: 7.750576,
				zoom: 8
			},
			controls: {
				scale: {
					imperial: false,
					position: 'bottomright'
				},
				fullscreen: {
					position: 'topright'
				}
			}
	});
	}]);
})();
