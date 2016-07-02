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
  ArkeoGIS.controller('DatabaseCtrl', ['$scope', 'database', 'databaseDefinitions',
    function($scope, database, databaseDefinitions) {
        $scope.database = database;
        $scope.databaseDefinitions = databaseDefinitions;
    }
  ]);
})();

(function() {
  'use strict';
  ArkeoGIS.controller('DatabaseListCtrl', ['$scope', '$http', 'databaseDefinitions',
    function($scope, $http, databaseDefinitions) {

        $http.get('/api/database', {
        }).then(function(response) {
            $scope.databaseDefinitions = databaseDefinitions;
            var databases = response.data;
            angular.forEach(databases, function(db) {
                var co = (db.authors) ? db.authors.join(',') : '';
                if (co != '') {
                    db.authors = db.author + ' ' + co;
                } else {
                    db.authors = db.author;
                }
            });
            $scope.databases = response.data;
        });

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
