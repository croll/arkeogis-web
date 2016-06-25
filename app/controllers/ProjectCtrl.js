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

    ArkeoGIS.controller('UserPreferencesCtrl', ['$scope', '$http', 'mapService', 'layerService', 'leafletData',
        function($scope, $http, mapService, layerService, leafletData) {
            var self = this;
            //        console.log(mapService.config);
            angular.extend($scope, angular.extend(mapService.config, {
                center: {
                    zoom: 8
                }
            }));

            $scope.geojson = {};

            leafletData.getMap().then(function(map) {
                map.on('moveend', function() {
                    var bbox = map.getBounds();
                    var boundingBox = mapService.getValidBoundingBox(bbox._northEast.lat, bbox._northEast.lng, bbox._southWest.lat, bbox._southWest.lng);
                    $scope.bounds = mapService.getBoundsAsGeoJSON(boundingBox);
                    if (map.getZoom() < 2) {
                        $scope.geojson = {
                            data: L.rectangle(boundingBox).toGeoJSON(),
                            style: {
                                fillColor: '#ff00ff',
                                weight: 2,
                                opacity: 1,
                                color: 'white',
                                dashArray: '3',
                                fillOpacity: 0.3
                            }
                        }
                    } else {
                        $scope.geojson = {};
                    }
                    self.refresh();
                });
            });

            this.activeTab = 'chronologies';

            this.refresh = function() {
                self.httpGetFuncs[self.activeTab]();
            }

            this.httpGetFuncs = {
                chronologies: function() {
                    $http.get('/api/chronologies', {
                        silent: true,
                        params: {
                            bounding_box: $scope.bounds
                        }
                    }).then(function(response) {
                        $scope.chronologies = response.data;
                    });
                },
                layers: function() {
                    layerService.getLayers({silent: true, params: {bounding_box: $scope.bounds}}).then(function(layers) {
                        $scope.layerList = layers;
                        console.log(layers);
                    });
                }
            }

            $scope.refreshTab = function(tabName) {
                self.activeTab = tabName;
                self.refresh();
            }

        }
    ]);

    ArkeoGIS.controller('ProjectLayersCtrl', ['$scope', 'layerService', 'leafletData',
        function($scope, layerService, leafletData) {
        }
    ]);

    ArkeoGIS.controller('ProjectChronosCtrl', ['$scope',
        function($scope) {

        }
    ]);

    ArkeoGIS.controller('ProjectDatabasesCtrl', ['$scope',
        function($scope) {

        }
    ]);

    ArkeoGIS.controller('ProjectCharacsCtrl', ['$scope',
        function($scope) {

        }
    ]);
})();
