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
	ArkeoGIS.controller('MapLeafletCtrl', ['$scope', '$http', '$location', '$mdSidenav', '$mdComponentRegistry', '$q', 'arkeoService', 'leafletData', 'mapService',
	function($scope, $http, $location, $mdSidenav, $mdComponentRegistry, $q, arkeoService, leafletData, mapService) {

		/*
		 * Leaflet Map
		 */


		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $("#arkeo-main-toolbar").height() +"px";
		};
		resize();

		$(window).on('resize', resize);

		var urlParams = $location.search();

		var dbToGet =  (angular.isDefined(urlParams.id) && urlParams.id) ? urlParams.id : 12;

		// Leaflet init

		angular.extend($scope, mapService.config);

		// function to display a map

		var generateIcon = function(feature) {
			var iconClasses = "icon icon-site";
			if (feature.centroid) {
				iconClasses += " centroid";
			}

			var characInfos = analyzeCharacs(feature);

			iconClasses += " "+characInfos.iconSize;

			if (characInfos.exceptional) {
				iconClasses += " exceptional"
			}

			/*
			return L.divIcon({
				className: 'arkeo-marker-container',
				html: '<svg class="arkeo-marker arkeo-marker-drop'+iconClasses+'"><use xlink:href="#arkeo-marker-drop"></use></svg><span class="mls"></span>',
				iconAnchor: [12, 0]
			});
			*/
			return L.divIcon({
				className: 'arkeo-marker-container',
				html: '<div>PLOP</div>',
				iconAnchor: [12, 0]
			});
		}

		var analyzeCharacs = function(feature) {
			var ret = {exceptional: false, iconSize: 0};
			angular.forEach(feature.properties.site_ranges, function(site_range) {
				angular.forEach(site_range.characs, function(c) {
					if (c.exceptional) {
						ret.exceptional = true;
					}
					var memorized = 0;
					var current = 0;
					switch (c.knowledge_type) {
						case 'not_documented':
							current = 1;
							break;
						case 'literature':
							current = 2;
							break;
						case 'prospected_aerial':
							current = 3;
							break;
						case 'prospected_pedestrian':
							current = 4;
							break;
						case 'surveyed':
							current = 5;
							break;
						case 'dig':
							current = 6;
							break;
					}
					if (memorized < current) {
						memorized = current;
						ret.iconSize = 'size'+current;
					}
				});
			});
			return ret;
		}

        $scope.letter = 0;

		function displayMapResults(data) {
			var latlngs = [];

            leafletData.getMap().then(function(map) {
				leafletData.getLayers().then(function(layers) {
                    if ('sites' in layers.overlays)
                        map.removeLayer(layers.overlays.sites);
                });
            });


                                angular.extend($scope.layers.overlays, {
                                    sites: {
                                        name:'ArkeoGIS ('+(++$scope.letter)+')',
                                        type: 'geoJSONShape',
                                        data: data,
                                        visible: true,
                                        icon: generateIcon,
                                        layerOptions: {
                                            pointToLayer: function(feature, latlng) {
                                                return L.marker(latlng, { icon: generateIcon(feature) });
                                            },
                                            onEachFeature: function(feature, layer) {
                                                layer.bindPopup(feature.properties.infos.name+" ("+feature.properties.infos.code+")");
                                            }
                                        }
                                    }
                                });

                                angular.forEach(data.features, function(feature) {
                                    latlngs.push([parseFloat(feature.geometry.coordinates[0]), parseFloat(feature.geometry.coordinates[1])]);
                                });

                                resize();
		}

        /*
         * watch on results
         */

         $scope.$parent.$watch("latest_result", function(newval, oldval) {
             console.log("display new results ...", newval);
             displayMapResults(newval);
         });


		function drawSearchZoneRect() {
			leafletData.getMap().then(function(map) {
				leafletData.getLayers().then(function(layers) {
					var drawnItems = layers.overlays.draw;

					if (curlayer) {
					   drawnItems.removeLayer(curlayer);
					   curlayer = null;
				   	}

				   	geom = angular.fromJson(geom);
					curlayer = L.geoJson(geom).addTo(drawnItems);
					curlayer.editing.enable();
				});
			});
		}




	}]);
})();
