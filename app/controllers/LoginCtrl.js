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

(function () {
    'use strict';
	ArkeoGIS.controller('LoginCtrl', ['$scope', 'login', 'user', "$state", "$stateParams", "arkeoService", "$mdToast", function ($scope, login, User, $state, $stateParams, arkeoService, $mdToast) {

        $scope.user = login.user;

        if ($state.current.data.logout) {
            login.logout();
            $state.go("arkeogis.map");            
        }

		$scope.loginSubmit = function () {
            login.login($scope.user).then(function(ret) {
                $scope.user = ret;
                if (($stateParams.redirectTo != "") && ($stateParams.redirectTo != "arkeogis.login")) {
                  $state.go($stateParams.redirectTo);
                  $stateParams.redirectTo = "";
                } else {
                  $state.go("arkeogis.map");
                }
            }, function(err) {
                console.log("err ! ", err);
                if (err.data.errors) {
					arkeoService.setFormErrorsFromServer(loginForm, err.data.errors, "json.");
                } else {
                    //alert('Login Failed');
                    $mdToast.show($mdToast.simple().textContent("Login Failed !").position('bottom left'));
                //loginForm.username.$error.server = "Login Failed";
                }
            });
		}
	}]);
})();
