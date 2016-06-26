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

    ArkeoGIS.controller('ProjectCtrl', ['$scope', '$q', '$http', '$timeout', 'arkeoService', 'mapService', 'layerService', 'arkeoDatabase', 'leafletData',
        function($scope, $q, $http, $timeout, arkeoService, mapService, layerService, arkeoDatabase, leafletData) {
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
            };

            $scope.outOfBounds = {
                chronologies: [],
                layers: [],
                databases: [],
            };

            var promises = [];

            $scope.$watch('start_date', _.debounce(function() {self.refreshAll();}, 200));
            $scope.$watch('end_date', _.debounce(function() {self.refreshAll();}, 200));

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
                                color: '#777',
                                dashArray: '5',
                                fillOpacity: 0.3
                            }
                        }
                    } else {
                        $scope.geojson = {};
                    }
                    self.refreshAll();
                });
            });

            this._compare = function() {
                $scope.outOfBounds = {
                    hasError: false
                };
                $scope.outOfBounds.chronologies = _.differenceBy($scope.project.chronologies, $scope.chronologies, '$$hashKey');
                if ($scope.outOfBounds.chronologies.length) {
                    $scope.outOfBounds.hasError = true;
                }
                $scope.outOfBounds.layers = _.differenceBy($scope.project.layers, $scope.layerList, '$$hashKey');
                if ($scope.outOfBounds.layers.length) {
                    $scope.outOfBounds.hasError = true;
                }
                $scope.outOfBounds.databases = _.differenceBy($scope.project.databases, $scope.databases, '$$hashKey');
                if ($scope.outOfBounds.databases.length) {
                    $scope.outOfBounds.hasError = true;
                }
            }

            $scope.checkItem = function(item, type) {
                return _.includes($scope.outOfBounds[type], item);
            }

            this._filterParams = function() {
                self.params = {
                    bounding_box: $scope.bounds
                }
                if (angular.isDefined($scope.start_date)) {
                    if (!angular.isDefined($scope.end_date)) {
                        arkeoService.showMessage('PROJECT.FIELD_START_DATE.END_DATE_NOT_DEFINED_BUT_END_DATE_IS', 'error');
                        return
                    }
                    self.params.start_date = parseInt($scope.start_date)
                } else {
                    self.params.start_date = null;
                }
                if (angular.isDefined($scope.end_date)) {
                    if (!angular.isDefined($scope.start_date)) {
                        arkeoService.showMessage('PROJECT.FIELD_END_DATE.START_DATE_NOT_DEFINED_BUT_END_DATE_IS', 'error');
                        return
                    }
                    self.params.end_date = parseInt($scope.end_date)
                } else {
                    self.params.end_date = null;
                }
                if (self.params.start_date) {
                    self.params.check_dates = true;
                } else {
                    self.params.check_dates = false;
                }
            }

            this.refresh = function() {
                promises = [];
                self._filterParams();
                self.httpGetFuncs[self.activeTab]();
                self._compare();
                $q.all(promises).then(function() {
                    self._compare();
                });
            }

            this.refreshAll = function() {
                promises = [];
                self._filterParams();
                angular.forEach(self.httpGetFuncs, function(f) {
                    f();
                });
                $q.all(promises).then(function() {
                    self._compare();
                });
            }

            this.httpGetFuncs = {
                chronologies: function() {
                    promises.push($http.get('/api/chronologies', {
                        silent: true,
                        params: self.params
                    }).then(function(response) {
                        $scope.chronologies = response.data;
                    }));
                },
                layers: function() {
                    promises.push(layerService.getLayers({
                        silent: true,
                        params: self.params
                    }).then(function(layers) {
                        $scope.layerList = layers;
                    }));
                },
                databases: function() {
                    promises.push($http.get('/api/database', {
                        silent: true,
                        params: self.params
                    }).then(function(response) {
                        $scope.databases = response.data;
                    }));
                },
                characs: function() {
                    promises.push($http.get('/api/characs', {
                        silent: true,
                    }).then(function(response) {
                        $scope.characs = response.data;
                    }));
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
                if (geojson == '') {
                    return;
                }
                if (geojson == null) {
                    $scope.geojson = {};
                }
                $scope.geojson = {
                    data: angular.fromJson(geojson),
                    style: {
                        fillColor: '#ff00ff',
                        weight: 2,
                        opacity: 1,
                        color: '#777',
                        dashArray: '5',
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
