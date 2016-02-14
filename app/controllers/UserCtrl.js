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
	ArkeoGIS.controller('UserCtrl', ['$scope', 'user', 'Langs', '$mdDialog', "$http", "$q", "arkeoService", function ($scope, User, Langs, $mdDialog, $http, $q, arkeoService) {

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
			$scope.users = User.get(query || $scope.users_query, getUsersSuccess);
			//User.get(query || $scope.users_query, getUsersSuccess);
		}

		// used by getUsers on promise success
		function getUsersSuccess(users) {
			console.log("updated ! ", users);
			//$scope.users = users;
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

			console.log("yo watch");
	      	getUsers();
	    });

		$scope.openDialogEdit = function (ev, id_user) {
            $mdDialog.show({
                controller: "UserEditCtrl",
                templateUrl: 'partials/user/dialogAddUser.tmpl.html',
                targetEvent: ev,
				locals: {
					id_user: id_user
				}
            }).then(function(answer) {
                console.log("Dialog Add User Answer : "+answer);
				//getUsers();
            }, function() {
                console.log("Dialog Add User cancelled");
            });
        };

		console.log("yo 1");
		//getUsers();

	}]);


	ArkeoGIS.controller('UserEditCtrl', ['$scope', 'user', 'Langs', '$mdDialog', "$http", "$q", "arkeoService", "id_user", function ($scope, User, Langs, $mdDialog, $http, $q, arkeoService, id_user) {

		$scope.langs = Langs.query();

		$scope.user = id_user != undefined ? User.get({id: id_user}, getUserSuccess) : hackUserCompanies(new User());
        $scope.selectedCountry=null;
        $scope.selectedCity=0;

		function hackUserCompanies(user) {
			while (user.companies.length < 2) {
				user.companies[user.companies.length] = {
					data: {
						value: undefined,
						display: "",
					},
					searchname: "",
				}
			}
			return user;
		}

		function getUserSuccess(user) {
			hackUserCompanies(user);
			//$scope.user=user;
			console.log("user loaded : ", user);
		};

        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.answer = function(answer) {
            $mdDialog.hide(answer);
        };

        $scope.autocompleteCountry = arkeoService.autocompleteCountry;
        $scope.autocompleteCity = arkeoService.autocompleteCity;

        $scope.userAddSubmit = function () {
            $scope.user.active = $scope.user.active == "true" ? true : false;
            $scope.user.$save().then(function(ret) {
                console.log("user saved ", ret);
				$scope.hide();
            }, function(err) {
                console.log("err ! ", err);
				if (err.data.errors) {
					arkeoService.setFormErrorsFromServer($scope.userForm, err.data.errors, "json.");
				}
            });
        };

	}]);

})(angular);
