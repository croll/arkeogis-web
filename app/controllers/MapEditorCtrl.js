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
    ArkeoGIS.controller('MapEditorCtrl', ['$scope', 'mapService', 'login', '$http', function($scope, mapService, login, $http) {

        angular.extend($scope, mapService.config);

        $scope.infos = {};

        $scope.removeAuthor = function(user) {
            if (user.id == login.user.id) {
                arkeoService.showMessage('IMPORT_STEP3.AUTHORS.T_UNABLE_TO_REMOVE_MAIN_AUTHOR');
                database.authors.unshift(user);
            }
        }

        $scope.searchUser = function(txt) {
            return $http.get('/api/users/'+txt).then(function(result) {
                return result.data;
            });
        }


        $http.get('http://wxs.ign.fr/6cwsohzr2zx1asify37rppfv/autoconf/?keys=6cwsohzr2zx1asify37rppfv').then(function(res) {
            console.log("REQUETE 1");
            console.log(res);
        });


        $http.get('http://wxs.ign.fr/mdqr7be8bit9apu0oogndt3in/autoconf/?keys=mdqr7be8bit9apu0oogndt3in').then(function(res) {
            console.log("REQUETE 2");
            console.log(res);
        });

// curl -X GET http://wxs.ign.fr/mdqr7be8bit9apu0oogndt3in/autoconf/?keys=mdqr7be8bit9apu0oogndt3in

// "http://wxs.ign.fr/6cwsohzr2zx1asify37rppfv/autoconf/?keys=6cwsohzr2zx1asify37rppfv"

    }]);
})();
