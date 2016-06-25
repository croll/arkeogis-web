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

    ArkeoGIS.controller('UserPreferencesCtrl', ['$scope', '$http', 'mapService', 'layerService', 'arkeoDatabase', 'leafletData',
        function($scope, $http, mapService, layerService, arkeoDatabase, leafletData) {
            var self = this;
            //        console.log(mapService.config);


            angular.extend($scope, angular.extend(mapService.config, {
                center: {
                    zoom: 8
                }
            }));

            $scope.project = {
                chronologies: [],
                layers: [],
                databases: [],
                characs: []
            }

            $scope.outOfBounds = {
                chronologies: [],
                layers: [],
                databases: [],
            }

            this.activeTab = 'chronologies';

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
                    self.refreshAll();
                });
            });

            this.compare = function() {
                var isOut = false;
                $scope.outOfBounds.chronologies = _.differenceBy($scope.project.chronologies, $scope.chronologies, '$$hashKey');
                if ($scope.outOfBounds.chronologies.length) {
                    isOut = true;
                }
                $scope.outOfBounds.layers = _.differenceBy($scope.project.layers, $scope.layerList, '$$hashKey');
                if ($scope.outOfBounds.layers.length) {
                    isOut = true;
                }
                $scope.outOfBounds.databases = _.differenceBy($scope.project.databases, $scope.databases, '$$hashKey');
                if ($scope.outOfBounds.databases.length) {
                    isOut = true;
                }
                if (isOut) {
                    console.log($scope.outOfBounds);
                }
            }

            this.refresh = function() {
                self.params = {
                    bounding_box: $scope.bounds
                }
                if ($scope.start_date) {
                    self.params.start_date = parseInt($scope.start_date)
                }
                if ($scope.end_date) {
                    self.params.end_date = parseInt($scope.end_date)
                }
                self.httpGetFuncs[self.activeTab]();
                self.compare();
            }

            this.refreshAll = function() {
                self.params = {
                    bounding_box: $scope.bounds
                }
                if ($scope.start_date) {
                    self.params.start_date = parseInt($scope.start_date)
                }
                if ($scope.end_date) {
                    self.params.end_date = parseInt($scope.end_date)
                }
                console.log(self.params);
                angular.forEach(self.httpGetFuncs, function(f) {
                    f();
                });
                self.compare();
            }

            this.httpGetFuncs = {
                chronologies: function() {
                    $http.get('/api/chronologies', {
                        silent: true,
                        params: self.params
                    }).then(function(response) {
                        $scope.chronologies = response.data;
                    });
                },
                layers: function() {
                    layerService.getLayers({
                        silent: true,
                        params: self.params
                    }).then(function(layers) {
                        $scope.layerList = layers;
                    });
                },
                databases: function() {
                    $http.get('/api/database', {
                        silent: true,
                        params: self.params
                    }).then(function(response) {
                        $scope.databases = response.data;
                    });
                },
                characs: function() {
                    $http.get('/api/characs', {
                        silent: true,
                    }).then(function(response) {
                        $scope.characs = response.data;
                    });
                },
            }

            $scope.refreshTab = function(tabName) {
                self.activeTab = tabName;
                self.refresh();
            }

            $scope.toggleItem = function(item, type) {
                var i = $scope.project[type].indexOf(item);
                if (i != -1) {
                    $scope.project[type].splice(i, 1);
                } else {
                    $scope.project[type].push(item);
                }
            }

            $scope.preview = function(geojson) {
                console.log(geojson);
                if (geojson == '') {
                    return;
                }
                if (geojson == null) {
                    console.log('delete');
                    $scope.geojson = {};
                }
                $scope.geojson = {
                    data: angular.fromJson(geojson),
                    style: {
                        fillColor: '#ff00ff',
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.3
                    }
                }
            }

        }
    ]);

    ArkeoGIS.controller('ProjectLayersCtrl', ['$scope', 'layerService', 'leafletData',
        function($scope, layerService, leafletData) {

            $scope.filter = {
                show: false,
                options: {}
            };

            $scope.query = {
                filter: '',
                order: 'line',
                limit: 20,
                page: 1,
                numRows: ['All', 10, 20, 30]
            };

            $scope.onOrderChange = function(order) {
                $scope.order = order;
            };

            $scope.removeFilter = function() {
                $scope.filter.show = false;
                $scope.query.filter = '';

                if ($scope.filter.form.$dirty) {
                    $scope.filter.form.$setPristine();
                }
            };
        }

    ]);

    ArkeoGIS.controller('ProjectChronosCtrl', ['$scope',
        function($scope) {

            $scope.filter = {
                show: false,
                options: {}
            };

            $scope.query = {
                filter: '',
                order: 'line',
                limit: 20,
                page: 1,
                numRows: ['All', 10, 20, 30]
            };

            $scope.onOrderChange = function(order) {
                $scope.order = order;
            };

            $scope.removeFilter = function() {
                $scope.filter.show = false;
                $scope.query.filter = '';

                if ($scope.filter.form.$dirty) {
                    $scope.filter.form.$setPristine();
                }
            };
        }
    ]);

    ArkeoGIS.controller('ProjectDatabasesCtrl', ['$scope',
        function($scope) {

            $scope.filter = {
                show: false,
                options: {}
            };

            $scope.query = {
                filter: '',
                order: 'line',
                limit: 20,
                page: 1,
                numRows: ['All', 10, 20, 30]
            };

            $scope.onOrderChange = function(order) {
                $scope.order = order;
            };

            $scope.removeFilter = function() {
                $scope.filter.show = false;
                $scope.query.filter = '';

                if ($scope.filter.form.$dirty) {
                    $scope.filter.form.$setPristine();
                }
            };
        }
    ]);

    ArkeoGIS.controller('ProjectCharacsCtrl', ['$scope',
        function($scope) {

            $scope.filter = {
                show: false,
                options: {}
            };

            $scope.query = {
                filter: '',
                order: 'line',
                limit: 20,
                page: 1,
                numRows: ['All', 10, 20, 30]
            };

            $scope.onOrderChange = function(order) {
                $scope.order = order;
            };

            $scope.removeFilter = function() {
                $scope.filter.show = false;
                $scope.query.filter = '';

                if ($scope.filter.form.$dirty) {
                    $scope.filter.form.$setPristine();
                }
            };
        }
    ]);
})();
