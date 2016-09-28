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

    ArkeoGIS.controller('ProjectCtrl', ['$scope', '$q', '$http', '$timeout', '$cookies', 'arkeoService', 'arkeoMap', 'layerService', 'arkeoProject', 'arkeoDatabase', 'login', 'leafletData',
        function($scope, $q, $http, $timeout, $cookies, arkeoService, arkeoMap, layerService, arkeoProject, arkeoDatabase, login, leafletData) {
            var self = this, outOfBounds = {};

            angular.extend($scope, angular.extend(arkeoMap.config, {
                center: {
                    zoom: 8
                }
            }));

            $scope.project = arkeoProject.get();

            outOfBounds = {
                chronologies: [],
                layers: [],
                databases: []
            };

            var promises = [];

            $scope.$watch('project.start_date', _.debounce(function() {
                self.refreshAll();
            }, 200));
            $scope.$watch('project.end_date', _.debounce(function() {
                self.refreshAll();
            }, 200));

            this.activeTab = 'chronologies';

            $scope.geojson = {};
            $scope.isValid = false;

            leafletData.getMap().then(function(map) {
                self.refreshAll();
                if ($scope.project.geom != '') {
                    map.fitBounds(L.geoJson($scope.project.geom).getBounds());
                }
                // Center map on project bounds
                map.on('moveend', function() {
                    var bbox = map.getBounds(); var boundingBox = arkeoMap.getValidBoundingBox(bbox._northEast.lat, bbox._northEast.lng, bbox._southWest.lat, bbox._southWest.lng);
                    $scope.bounds = arkeoMap.getBoundsAsGeoJSON(boundingBox);
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

            $scope.checkItem = function(item, type) {
                return _.includes(outOfBounds[type], item);
            }

            this._compare = function() {
                $scope.selectionHasError = false;
                outOfBounds.chronologies = _.differenceBy($scope.project.chronologies, $scope.chronologies, 'id');
                outOfBounds.layers = _.differenceBy($scope.project.layers, $scope.layerList, 'id');
                outOfBounds.databases = _.differenceBy($scope.project.databases, $scope.databases, 'id');
                if (outOfBounds.chronologies.length || outOfBounds.layers.length || outOfBounds.databases.length) {
                    $scope.selectionHasError = true;
                }
            }

            this._filterParams = function() {
                self.params = {
                    bounding_box: $scope.bounds
                }
                if (angular.isDefined($scope.project.start_date)) {
                    if (!angular.isDefined($scope.project.end_date)) {
                        arkeoService.showMessage('PROJECT.FIELD_START_DATE.END_DATE_NOT_DEFINED_BUT_END_DATE_IS', 'error');
                        return
                    }
                    self.params.start_date = parseInt($scope.project.start_date)
                } else {
                    self.params.start_date = null;
                }
                if (angular.isDefined($scope.project.end_date)) {
                    if (!angular.isDefined($scope.project.start_date)) {
                        arkeoService.showMessage('PROJECT.FIELD_END_DATE.START_DATE_NOT_DEFINED_BUT_END_DATE_IS', 'error');
                        return
                    }
                    self.params.end_date = parseInt($scope.project.end_date)
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
                $q.all(promises).then(function() {
                    self._compare();
                }, function() {
                    console.error("Error getting infos");
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
                }, function() {
                    console.error("Error getting infos");
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
                // Specific case for chronoly (not multiple)
                var i = $scope.project[type].indexOf(item);
                if (type == 'chronologies') {
                    if (i != -1) {
                        $scope.project.chronologies = [];
                    } else {
                        $scope.project.chronologies = [
                            item
                        ]
                    }
                    self._compare();
                    return;
                }
                if (i != -1) {
                    $scope.project[type].splice(i, 1);
                } else {
                    $scope.project[type].push(item);
                }
                self._compare();
            }

            $scope.checkCharac = function(id) {
                return _.findKey($scope.project['characs'], function(c) {
                    return (c.id == id);
                });
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

            $scope.editChracacVisibility = function(id) {
                alert('En cours.');
            }

            $scope.savePreferences = function() {
                if ($scope.selectionHasError) {
                    arkeoService.showMessage('PROJECT_EDITOR.FORM_ERROR_OUT_OF_BOUNDS.T_LABEL')
                    return;
                }
                if ($scope.project.chronologies.lengh < 1) {
                    arkeoService.showMessage('PROJECT_EDITOR.FORM_ERROR_NO_CHRONOLOGY_SELECTED.T_LABEL')
                    return false;
                }
                if ($scope.project.databases.lengh < 1) {
                    arkeoService.showMessage('PROJECT_EDITOR.FORM_ERROR_NO_DATABASE_SELECTED.T_LABEL')
                    return false;
                }
                if ($scope.project.characs.lengh < 1) {
                    arkeoService.showMessage('PROJECT_EDITOR.FORM_ERROR_NO_CHARAC_SELECTED.T_LABEL')
                    return false;
                }
                leafletData.getMap().then(function(map) {
                    var bbox = map.getBounds();
                    var boundingBox = arkeoMap.getValidBoundingBox(bbox._northEast.lat, bbox._northEast.lng, bbox._southWest.lat, bbox._southWest.lng);
                    var b = arkeoMap.getBoundsAsGeoJSON(boundingBox);
                    var prefs = {
                        name: "PROJ -- " + login.user.firstname + ' ' + login.user.lastname,
                        geom: b,
                        chronologies: [],
                        layers: [],
                        databases: [],
                        characs: []
                    }
                    if ($scope.project.id && $scope.project.id > 0) {
                        prefs.id = $scope.project.id;
                    }
                    if (angular.isDefined($scope.project.start_date) && $scope.project.start_date != '') {
                        prefs.start_date = $scope.project.start_date;
                    } else {
                        prefs.start_date = 0;
                    }
                    if (angular.isDefined($scope.project.end_date) && $scope.project.end_date != '') {
                        prefs.end_date = $scope.project.end_date;
                    } else {
                        prefs.end_date = 0;
                    }
                    angular.forEach($scope.project.chronologies, function(chrono) {
                        prefs.chronologies.push(chrono.root_chronology_id);
                    });
                    angular.forEach($scope.project.characs, function(charac) {
                        prefs.characs.push(charac.root_charac_id);
                    });
                    angular.forEach($scope.project.layers, function(layer) {
                        prefs.layers.push({
                            id: layer.id,
                            type: layer.type
                        });
                    });
                    angular.forEach($scope.project.databases, function(database) {
                        prefs.databases.push(database.id);
                    });
                    $http({
                        method: 'POST',
                        url: '/api/project',
                        data: prefs
                    }).then(function(result) {
                        arkeoService.showMessage('PROJECT_EDITOR.MESSAGE_SAVE.T_OK');
                        if ($scope.project.id == null || $scope.project.id == 0) {
                            $scope.project.id = result.data.project_id;
                            arkeoProject.set($scope.project);
                        }
                    }, function(err) {
                        arkeoService.showMessage('PROJECT_EDITOR.MESSAGE_SAVE.T_ERROR');
                        console.error(err);
                    })
                });
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

    ArkeoGIS.controller('ProjectCharacsCtrl', ['$scope', '$mdDialog', '$http',
        function($scope, $mdDialog, $http) {

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

            $scope.showCharacChooserDialog = function(charac_id, project_id) {
                $mdDialog.show({
                        controller: function($scope, $mdDialog, arkeoService) {
                            $scope.charac_id = charac_id;
                            $scope.project_id = project_id;

                            $scope.hide = function() {
                                $mdDialog.hide();
                            };

                            $scope.load = function() {
                    			var url = '/api/characs/'+$scope.charac_id+'?project_id='+$scope.project_id;
                    			$http.get(url).then(function(data) {
                    				$scope.arbo = data.data;
                    			}, function(err) {
                    				arkeoService.showMessage("load failed : "+err.status+", "+err.statusText);
                                    $mdDialog.hide();
                    				console.error("loaded", err);
                    			});
                    		};

                            $scope.save = function() {
                                var url = '/api/characs/'+$scope.charac_id+'/hiddens/'+$scope.project_id;
                                function recurseGetHidden(item, res) {
                                    if (item.hidden) res.push(item.id);
                                    if ('content' in item) {
                                        item.content.forEach(function(subitem) {
                                            recurseGetHidden(subitem, res);
                                        });
                                    }
                                }
                                var res = [];
                                recurseGetHidden($scope.arbo, res);
                                $http.post(url,{
                                    hidden_ids: res,
                                }).then(function(data) {
                    				$scope.arbo = data.data;
                                    $mdDialog.hide();
                    			}, function(err) {
                    				arkeoService.showMessage("save failed : "+err.status+", "+err.statusText);
                                    $mdDialog.hide();
                    				console.error("loaded", err);
                    			});
                            }

                            $scope.toggleHidden = function(item) {
                                function recurseSetHidden(item, hidden) {
                                    item.hidden = hidden;
                                    if ('content' in item) {
                                        item.content.forEach(function(subitem) {
                                            recurseSetHidden(subitem, hidden);
                                        });
                                    }
                                }
                                recurseSetHidden(item, !item.hidden);
                            };

                            $scope.load();

                        },
                        templateUrl: 'partials/characchooser.html',
                        parent: angular.element(document.body),
                        clickOutsideToClose: true,
                        fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                    })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };

            // $scope.toggleSiteDetailsDialog()


        }
    ]);
})();
