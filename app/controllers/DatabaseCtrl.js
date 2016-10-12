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
    ArkeoGIS.controller('DatabaseCtrl', ['$scope', '$http', '$state', '$mdDialog', 'database', 'databaseDefinitions', 'arkeoMap', 'arkeoService', 'arkeoLang', 'leafletData',
        function($scope, $http, $state, $mdDialog, database, databaseDefinitions, arkeoMap, arkeoService, arkeoLang, leafletData) {

            $scope.database = database;

            $scope.databaseDefinitions = databaseDefinitions;

            database.lang = arkeoLang.getLangByIsoCode(database.default_language)

            angular.extend($scope, angular.extend(arkeoMap.config, {
                center: {
                    zoom: 8
                }
            }));

            $scope.geojson = {
                data: angular.fromJson(database.geographical_extent_geom),
                style: {
                    fillColor: '#ff00ff',
                    weight: 2,
                    opacity: 1,
                    color: '#777',
                    dashArray: '5',
                    fillOpacity: 0.3
                }
            }

            leafletData.getMap().then(function(map) {
                map.fitBounds(L.geoJson($scope.geojson.data).getBounds());
            });

            $scope.delete = function() {
                if (!database.id) {
                    console.log("No database id specified, unable to delete");
                    return false;
                }
                $http({
                    method: 'POST',
                    url: '/api/database/delete',
                    data: {
                        id: database.id
                    }
                }).then(function(res) {
                    arkeoService.showMessage('DATABASE.MESSAGE.T_DELETE_OK')
                    $state.go('arkeogis.database-list')
                }, function(err) {
                    arkeoService.showMessage('DATABASE.MESSAGE.T_DELETE_FAILED', 'error')
                    console.log(err)
                })
            }

            $scope.downloadCSV = function(id) {
                if (!database.id) {
                    console.error("No database id specified, unable to get csv");
                    return false;
                }
                id = id || '';
                window.open('/api/database/' + database.id + '/csv/' + id);
            }

            $scope.downloadExport = function() {
                window.open('/api/database/' + database.id + '/export');
            }

            $scope.showHandleDialog = function(ev) {
                $mdDialog.show({
                    controller: DialogController,
                    contentElement: '#handleDialog',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true
                });
            };

            $scope.showImportDialog = function(ev) {
                $mdDialog.show({
                    controller: DialogController,
                    contentElement: '#importDialog',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true
                });
            };

            function DialogController($scope, $mdDialog) {
                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
            }

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('DatabaseListCtrl', ['$scope', '$http', '$filter', 'databaseDefinitions', 'translations', 'isAdmin',
        function($scope, $http, $filter, databaseDefinitions, translations, isAdmin) {

            $scope.isAdmin = _.has(isAdmin, 'id');

            $http.get('/api/database').then(function(response) {
                $scope.databaseDefinitions = databaseDefinitions;
                var databases = response.data;
                angular.forEach(databases, function(db) {
                    var co = (db.authors) ? db.authors.join(',') : '';
                    if (co != '') {
                        db.authors = db.author + ' ' + co;
                    } else {
                        db.authors = db.author;
                    }
                    db.default_language = $filter('uppercase')(db.default_language);
                    db.type = databaseDefinitions[db.type];
                    db.scale_resolution = databaseDefinitions[db.scale_resolution];
                    db.state = databaseDefinitions[db.state];
                    db.geographical_extent = databaseDefinitions[db.geographical_extent];
                    db.start_date = $filter('arkYear')(db.start_date);
                    db.end_date = $filter('arkYear')(db.end_date);
                    db.subject = $filter('arkTranslate')(db.subject);
                    db.description = $filter('arkTranslate')(db.description);
                });
                $scope.databases = response.data;
            });

            $scope.downloadCSV = function() {
                var csv = 'LANG;NAME;AUTHORS;SUBJET;TYPE;LINES;SITES;SCALE;START_DATE;END_DATE;STATE;GEOGRAPHICAL_EXTENT;LICENSE;DESCRIPTION\n';
                angular.forEach($scope.databases, function(db) {
                    csv += '' + db.default_language + ';' + db.name + ';' + db.authors + ';' + db.subject + ';' + db.type + ';' + db.number_of_lines + ';' + db.number_of_sites + ';' + db.scale_resolution + ';' + db.start_date + ';' + db.end_date + ';' + db.state + ';' + db.geographical_extent + ';' + db.license + ';' + db.description + '\n'
                });
                var hiddenElement = document.createElement('a');
                hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
                hiddenElement.target = '_blank';
                hiddenElement.download = 'databases.csv';
                hiddenElement.click();
            }

            $scope.filter = {
                show: false,
                options: {}
            };

            $scope.query = {
                filter: '',
                order: null,
                limitOptions: [10, 25, 50, {
                    label: translations['GENERAL.TABLE_PAGINATION.T_ALL'],
                    value: function() {
                        return 10000
                    }
                }],
                limit: 20,
                page: 1
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
