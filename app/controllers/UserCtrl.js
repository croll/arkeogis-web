/* ArkeoGIS - The Arkeolog Geographical Information Server Program
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

(function () {
	'use strict';
	ArkeoGIS.controller('UserCtrl', ['$scope', 'user', '$mdDialog', "$http", "$q", "arkeoService", function ($scope, user, $mdDialog, $http, $q, arkeoService) {

		$scope.users = user.query();
        $scope.user = new user();
        $scope.selectedCountry=null;
        $scope.selectedCity=0;

		$scope.markAll = function (checkit) {
			$scope.users.forEach(function (user) {
				user.checked = checkit;
			});
		};

        $scope.openDialogAdd = function (ev) {
            $mdDialog.show({
                controller: DialogAddUserController,
                templateUrl: 'partials/user/dialogAddUser.tmpl.html',
                targetEvent: ev
            }).then(function(answer) {
                console.log("Dialog Add User Answer : "+answer);
            }, function() {
                console.log("Dialog Add User cancelled");
            });
        };

        $scope.autocompleteCountry = arkeoService.autocompleteCountry;
        $scope.autocompleteCity = arkeoService.autocompleteCity;

        $scope.userAddSubmit = function () {
            $scope.user.Active = $scope.user.Active == "true" ? true : false;
            $scope.user.$save().then(function(ret) {
                console.log("ret ! ", ret);
            }, function(err) {
                console.log("err ! ", err);
                if (err.status == 409)
                    $scope.userForm.username.$error.exists=true;
            });
        }

	}]);

    function DialogAddUserController($scope, $mdDialog) {
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.answer = function(answer) {
            $mdDialog.hide(answer);
        };
    }

})();
