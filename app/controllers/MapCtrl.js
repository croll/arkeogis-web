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
	ArkeoGIS.controller('MapCtrl', ['$scope', '$http', 'leafletData', function($scope, $http, leafletData) {

		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $(".md-default-theme .md-toolbar-tools").height() - 65 +"px";
		};

		$(window).on('resize', resize);

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
	// Get the countries geojson data from a JSON
        $http.get("/api/search/sites").success(function(data, status) {

		resize();

			var latlngs = [];
            angular.extend($scope, {
                geojson: {
                    data: data,
                    style: {
                        fillColor: "green",
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    }
                }
            });

			angular.forEach(data.features, function(feature) {
				latlngs.push([parseFloat(feature.geometry.coordinates[0]), parseFloat(feature.geometry.coordinates[1])]);
			});
			leafletData.getMap().then(function(map) {
				map.fitBounds(latlngs);
			});
        });
	}]);
})();
