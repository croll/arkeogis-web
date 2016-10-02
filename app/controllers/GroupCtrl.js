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
	ArkeoGIS.controller('GroupCtrl', ['$scope', 'group', 'user', 'login', 'arkeoLang', '$mdDialog', "$http", "$q", "arkeoService", function ($scope, Group, User, Login, arkeoLang, $mdDialog, $http, $q, arkeoService) {

		$scope.domains = [
			{ tr: 'GROUP.GROUPTYPE_USER.T_TITLE', id: 'user'},
			{ tr: 'GROUP.GROUPTYPE_CHRONOLOGY.T_TITLE', id: 'chronology'},
			{ tr: 'GROUP.GROUPTYPE_CHARAC.T_TITLE', id: 'charac'},
		];

		$scope.domain = $scope.domains[0];

		$scope.groups_query = {
			type: 'user',
			order: 'g_tr.name',
			limit: 10,
			page: 1,
			filter: ''
		};

		$scope.groups_filter = {
			show: false,
			options: {
			}
		};

		var groups_bookmark_page=1;

		function getGroups(query) {
			$scope.groups = Group.get(query || $scope.groups_query, getGroupsSuccess);
			//Group.get(query || $scope.groups_query, getGroupsSuccess);
		}

		// used by getGroups on promise success
		function getGroupsSuccess(groups) {
			console.log("updated ! ", groups);
			groups.data.forEach(function(group) {
				Group.get({id:group.id}, function(g) {
					console.log("g", g);
					group.users = g.users;
					if (group.users) {
						group.users.forEach(function(user) {
							user.name = user.firstname + " " + user.lastname;
							user.image = '/api/users/photo/'+user.photo_id;
						})
					} else group.users=[];
				})
			})
		}

		$scope.groups_onPaginate = function (page, limit) {
			getGroups(angular.extend({}, $scope.groups_query, {page: page, limit: limit}));
		}

		$scope.groups_onReorder = function (order) {
			getGroups(angular.extend({}, $scope.groups_query, {order: order}));
		}

		$scope.groups_removeFilter = function () {
	      $scope.groups_filter.show = false;
	      $scope.groups_query.filter = '';

	      if($scope.groups_filter.form.$dirty) {
	        $scope.groups_filter.form.$setPristine();
	      }
	    }

		$scope.$watch('groups_query.filter', function (newValue, oldValue) {
	      	if(!oldValue) {
	        	groups_bookmark_page = $scope.groups_query.page;
	      	}

	      	if(newValue !== oldValue) {
	        	$scope.groups_query.page = 1;
	      	}

	      	if(!newValue) {
	        	$scope.groups_query.page = groups_bookmark_page;
	      	}

			console.log("yo watch");
	      	getGroups();
	    });

		console.log("yo 1");
		//getGroups();

		$scope.querySearchUsers = function(query) {
			return User.get({
				order: 'u.firstname',
				page: 1,
				limit: 10,
				filter: query,
			}).$promise.then(function(data) {
				if (data.data) {
					data.data.forEach(function(elem) {
						elem.name=elem.firstname+" "+elem.lastname;
					});
				} else data.data=[];
				return data.data;
			});
		}

		$scope.updateGroup = function(group) {
			console.log("update group", group)
			Group.save({
				id: group.id
			}, group);
		}

		$scope.saveGroup = function(group) {
			console.log("save : ", group);
		}

		$scope.setDomain = function(domain) {
			$scope.domain=domain;
			$scope.groups_query.type = domain.id;
			getGroups();
		}

	}]);


})(angular);
