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
 			$scope.users = User.get(query || $scope.users_query).$promise.then(function(users) {
				console.log("updated ! ", users);
				$scope.users = users;
			}, function(err) {
				console.error("error to display to the user: ", err);
			});
		}

		$scope.users_onPaginate = function (page, limit) {
			console.log("users_onPaginate", page, limit);
			//getUsers(angular.extend({}, $scope.users_query, {page: page, limit: limit}));
			if (page > 0)
				getUsers();
			else {
				console.error("page 0 ?");
			}
		}

		$scope.users_onReorder = function (order) {
			console.log("users_onReorder", order);
			getUsers(angular.extend({}, $scope.users_query, {order: order}));
		}

		$scope.users_removeFilter = function () {
			console.log("users_removeFilter");
	      	$scope.users_filter.show = false;
	      	$scope.users_query.filter = '';

	      	if($scope.users_filter.form.$dirty) {
	        	$scope.users_filter.form.$setPristine();
	      	}
	    }

		$scope.$watch('users_query.filter', function (newValue, oldValue) {
			console.log("users_query.filter", newValue, oldValue);
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
				getUsers();
            }, function() {
                console.log("Dialog Add User cancelled");
            });
        };

		console.log("yo 1");
		//getUsers();

	}]);


	ArkeoGIS.controller('UserEditCtrl', ['$scope', 'Upload', 'user', 'group', 'Langs', '$mdDialog', "$http", "$q", "arkeoService", "id_user", function ($scope, Upload, User, Group, Langs, $mdDialog, $http, $q, arkeoService, id_user) {

		$scope.langs = Langs.query();

		//$scope.user = id_user != undefined ? User.get({id: id_user}, getUserSuccess) : hackAutocompletes(new User());
		$scope.companies=[null, null];
		$scope.companies_search=[null, null];
		$scope.companies_city=[null, null];
		$scope.companies_city_search=[null, null];
		$scope.companies_country=[null, null];
		$scope.companies_country_search=[null, null];

		$scope.available_groups_user = Group.get({type: 'user', limit: 100, page: 1, order: 'g_tr.name'});
		$scope.available_groups_charac = Group.get({type: 'charac', limit: 100, page: 1, order: 'g_tr.name'});
		$scope.available_groups_chronology = Group.get({type: 'chronology', limit: 100, page: 1, order: 'g_tr.name'});

		init();
		function init() {

			$q.all($scope.available_groups_user.$promise, $scope.available_groups_charac.$promise, $scope.companies_country_search.$promise).then(function() {
				console.log("all loaded !");
				$scope.user = id_user != undefined ? User.get({id: id_user}, getUserSuccess) : hackAutocompletes(new User());
			}, function(error) {
				console.error("all not loaded !", error);
			});
		}

		function hackAutocompletes(user) {
			//console.log("hack user: ", user);

			// companies fields
			if (user.companies == undefined || user.companies == null) {
				user.companies = [];
			}
			while (user.companies.length < 2) {
				user.companies[user.companies.length] = {
					name: "",
					id:0,
					city_and_country: {
						city: {
							name:"",
							geonameid:0,
						},
						country: {
							name:"",
							geonameid:0,
						},
					},
				};
			}

			for (var i=0; i<user.companies.length; i++) {
				set_company(i, user.companies[i]);
			}

			// city & country field of user
			if (user.city_and_country == undefined) {
				user.city_and_country={
					city: null,
					country: null,
				};
			}

			if (user.city_and_country.country && user.city_and_country.country.name == "") {
				user.city_and_country.country=null;
				$scope.searchTextCountry = "";
			}

			if (user.city_and_country.city && user.city_and_country.city.name == "") {
				user.city_and_country.city=null;
			}

			// also hack groups
			user.groups_user=[];
			user.groups_chronology=[];
			user.groups_charac=[];
			if ((!('groups' in user)) || !user.groups)
				user.groups=[];
			user.groups.forEach(function(group) {
				switch(group.type) {
					case 'user':
						user.groups_user = group.id; // only one group per user
					break;
					case 'chronology':
						user.groups_chronology.push(group.id);
					break;
					case 'charac':
						user.groups_charac.push(group.id);
					break;
					default:
					console.error("unknown group type fro group: ", group);
				}
			})

			// and Password
			user.password="";
			user.password2="";

			return user;
		}

		function set_company(index, company) {
			console.log("got: ", company);
			if (company && company.name.length > 0) {
				if (!$scope.companies[index] || $scope.companies[index].id != company.id || $scope.companies[index].name != company.name) {
					$scope.companies[index]={
						name: company.name,
						id: company.id,
					};
				}

				if (company.city_and_country && company.city_and_country.country && company.city_and_country.country.name && company.city_and_country.country.name.length > 0) {
					$scope.companies_country[index]={
						name: company.city_and_country.country.name,
						geonameid: company.city_and_country.country.geonameid,
					};
				}

				if (company.city_and_country && company.city_and_country.city && company.city_and_country.city.name && company.city_and_country.city.name.length > 0) {
					$scope.companies_city[index]={
						name: company.city_and_country.city.name,
						geonameid: company.city_and_country.city.geonameid,
					};
				}
			}
		}

		function getUserSuccess(user) {
			console.log("user loaded before hack: ", user);
			hackAutocompletes(user);
			//$scope.user=user;
			console.log("user loaded after hack: ", user);
		};

		$scope.company_change = function(num) {
			if ($scope.companies[num] && $scope.companies[num].id) {

				// check if we already have it from the init query
				if ($scope.user.companies && $scope.user.companies[num] && $scope.user.companies[num].id && $scope.user.companies[num].id == $scope.companies[num].id) {
					set_company(num, $scope.user.companies[num]);
				} else {
					arkeoService.getCompany($scope.companies[num].id).then(function(company) {
						set_company(num, company);
					});
				}
			} else {
				set_company(num, null);
			}
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
		$scope.autocompleteCompany = arkeoService.autocompleteCompany;

        $scope.userAddSubmit = function (userForm, photo) {
			// update user.active to a real bool
            $scope.user.active = $scope.user.active == "true" ? true : false;

			// update companies of the user
			for (var i=0; i<2; i++) {
				if (($scope.companies[i] || $scope.companies_search[i]) && $scope.companies_country[i] && $scope.companies_city[i]) {
					$scope.user.companies[i] = $scope.companies[i] ? $scope.companies[i] : {};
					$scope.user.companies[i].name = $scope.companies_search[i];
					$scope.user.companies[i].city_and_country = {
						country: $scope.companies_country[i],
						city: $scope.companies_city[i],
					};
				} else {
					console.log("naze", i, $scope.companies[i], $scope.companies_country[i], $scope.companies_city[i])
				}
			}

			//  update groups
			$scope.user.groups=[];
			$scope.user.groups.push({id: $scope.user.groups_user}); // mono select version
			/* multi select version
			$scope.user.groups_user.forEach(function(id_group) {
				$scope.user.groups.push({id: id_group});
			});
			*/
			$scope.user.groups_chronology.forEach(function(id_group) {
				$scope.user.groups.push({id: id_group});
			});
			$scope.user.groups_charac.forEach(function(id_group) {
				$scope.user.groups.push({id: id_group});
			});

			var plop=Upload.upload({
				url: '/api/users'+(('id' in $scope.user && $scope.user.id >= 0) ? '/'+$scope.user.id : ''),
				data: {
					beve_sent_des_pieds: Upload.json($scope.user),
					et_pas_que: $scope.user.photo,
				}
			}).then(function(ret) {
                console.log("user saved ", ret);
				$scope.hide();
            }, function(err) {
                console.log("err ! ", err);
				if (err.data.errors) {
					arkeoService.setFormErrorsFromServer(userForm, err.data.errors, "json.");
				}
            });

        };

		$scope.deluser = function() {
			if (confirm("Delete this user ?"))
				User.delete({id: $scope.user.id}).$promise.then(function(ret) {
					console.log("user deleted.");
					$scope.hide();
				}, function(err) {
					console.error("err: ", err);
				});
		};

	}]);

})(angular);
