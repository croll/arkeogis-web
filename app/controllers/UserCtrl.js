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

(function () {
	'use strict';
	ArkeoGIS.controller('UserCtrl', ['$scope', 'user', 'Langs', '$mdDialog', "$http", "$q", "arkeoService", function ($scope, user, Langs, $mdDialog, $http, $q, arkeoService) {


		$scope.langs = Langs.query();

		//$scope.users = user.query();
        $scope.user = new user();
        $scope.selectedCountry=null;
        $scope.selectedCity=0;

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
            $scope.user.active = $scope.user.active == "true" ? true : false;
            $scope.user.$save().then(function(ret) {
                console.log("ret ! ", ret);
            }, function(err) {
                console.log("err ! ", err);
				if (err.data.errors) {
					arkeoService.setFormErrorsFromServer($scope.userForm, err.data.errors, "json.");
				}
            });
        }



		/* users list */

		$scope.users_query = {
			order: 'u.created_at',
			limit: 10,
			page: 1,
			filter: ''
		}
		$scope.users_filter = {
			show: false,
			options: {
			}
		}
		var users_bookmark_page=1;

		function getUsers(query) {
			$scope.promise = user.get(query || $scope.users_query, getUsersSuccess).$promise;
		}

		// used by getUsers on promise success
		function getUsersSuccess(users) {
			$scope.users = users;
		}

		$scope.users_onPaginate = function (page, limit) {
			getUsers(angular.extend({}, $scope.users_query, {page: page, limit: limit}));
		}

		$scope.users_onReorder = function (order) {
			getUsers(angular.extend({}, $scope.users_query, {order: order}));
		}

		$scope.users_removeFilter = function () {
	      $scope.users_filter.show = false;
	      $scope.users_query.filter = '';

	      if($scope.users_filter.form.$dirty) {
	        $scope.users_filter.form.$setPristine();
	      }
	    }

		$scope.$watch('users_query.filter', function (newValue, oldValue) {
	      	if(!oldValue) {
	        	users_bookmark_page = $scope.users_query.page;
	      	}

	      	if(newValue !== oldValue) {
	        	$scope.users_query.page = 1;
	      	}

	      	if(!newValue) {
	        	$scope.users_query.page = users_bookmark_page;
	      	}

	      	getUsers();
	    });

		getUsers();

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
