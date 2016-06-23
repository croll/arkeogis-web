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

    ArkeoGIS.controller('UserPreferencesCtrl', ['$scope', 'mapService', 'leafletData',
        function($scope, mapService, leafletData) {
        var self = this;
//        console.log(mapService.config);
        angular.extend($scope, angular.extend(mapService.config, {center: {}}));

        leafletData.getMap().then(function(map) {
            map.on('moveend', function() {
                $scope.bounds = L.rectangle(map.getBounds()).toGeoJSON().geometry;
                self.refreshLists();
            });
        });

        self.refreshLists = function(map) {
            console.log($scope.bounds);
        }


    }]);

    ArkeoGIS.controller('ProjectLayersCtrl', ['$scope', 'layerService', 'leafletData',
        function($scope, layerService, leafletData) {

            layerService.getLayers().then(function(layers) {
                $scope.layerList = layers;
            });
    }]);

    ArkeoGIS.controller('ProjectChronosCtrl', ['$scope',
        function($scope) {

    }]);

    ArkeoGIS.controller('ProjectDatabasesCtrl', ['$scope',
        function($scope) {

    }]);

    ArkeoGIS.controller('ProjectCharacsCtrl', ['$scope',
        function($scope) {

    }]);
})();
