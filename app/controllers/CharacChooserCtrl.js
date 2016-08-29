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

	/*
	 * CharacChooserCtrl Charac Chooser Controller
	 */

	ArkeoGIS.controller('CharacChooserCtrl', ['$scope', '$q', '$mdSidenav', 'arkeoLang', 'login', '$http', 'arkeoService', '$stateParams', '$state', 'user', '$mdDialog', function ($scope, $q, $mdSidenav, arkeoLang, Login, $http, arkeoService, $stateParams, $state, User, $mdDialog) {

		if (!Login.requirePermission('user can edit some charac', 'arkeogis.characchooser'))
            return;

        var self=this;

		$scope.mdsidenav_opened = !($stateParams.charac_id > 0);
		$scope.publishable = false;
		$scope.errstatus = {};
		$scope.arbo = {
			name: {},
			content: [],
		};

		function check_elem(elem, previous, next, parent) {
			var ret={
				errcount: 0,
				elemcount: 1,
				tradscount: {},
			}

			if ('order' in elem) {
				elem.order=parseInt(elem.order);
			} else {
				elem.order=0;
			}

			// compte les traductions
			if ('name' in elem) {
				for (var isocode in elem.name) {
					if (elem.name[isocode].length > 0)
						ret.tradscount[isocode]=1;
				}
			}

			if ('content' in elem) {
				for (var i=0; i<elem.content.length; i++) {
					var sub_elem = elem.content[i];
					var sub_previous = i > 0 ? elem.content[i-1] : null;
					var sub_next = i < (elem.content.length-1) ? elem.content[i+1] : null;
					var res = check_elem(sub_elem, sub_previous, sub_next, elem);
					ret.errcount += res.errcount;
					ret.elemcount += res.elemcount;
					for (var isocode in res.tradscount) {
						if (isocode in ret.tradscount)
							ret.tradscount[isocode] += res.tradscount[isocode];
						else
							ret.tradscount[isocode] = res.tradscount[isocode];
					}
				}
			}
			return ret;
		}

		$scope.check_all = function() {

			// hack root element (not visible) to have start_date / end_date of extremities
			if ($scope.arbo.content.length >= 1) {
				$scope.arbo.start_date = $scope.arbo.content[0].start_date;
				$scope.arbo.end_date = $scope.arbo.content[$scope.arbo.content.length-1].end_date;
			}

			// recursively check all elements
			var ret = check_elem($scope.arbo, null, null, null);
			console.log("ret: ", ret);

			// check if publishable
			$scope.errstatus = ret;

			var publishable = false;
			if (ret.errcount == 0) {
				var fulltrads=[];
				for (var isocode in ret.tradscount) {
					console.log("isocode: ", isocode, ret.tradscount[isocode]);
					if (ret.tradscount[isocode] == ret.elemcount)
						fulltrads.push(isocode);
				}
				if ((fulltrads.length >= 2) && (fulltrads.indexOf('en') != -1)) {
					publishable = true;
				}
				$scope.errstatus.fulltrads = fulltrads;
				console.log("fulltrads", fulltrads, publishable);
			}

			$scope.publishable = publishable;
		}

		$scope.add_arbo = function(elem, parent, idx1, idx, level) {
			elem.content.push({
				name: {},
				content: [],
			});
			$scope.check_all();
		};

		$scope.remove_arbo = function(elem, parent, idx1, idx, level) {
			parent.content.splice(idx, 1);
		};

		$scope.openLeftMenu = function() {
		    $mdSidenav('left').toggle();
			 $scope.check_all()
		};

		$scope.delete_button = function() {
			$scope.showConfirm = function(ev) {
			   // Appending dialog to document.body to cover sidenav in docs app
			   var confirm = $mdDialog.confirm()
			         .title('Would you like to delete your debt?')
			         .textContent('All of the banks have agreed to forgive you your debts.')
			         .ariaLabel('Lucky day')
			         .targetEvent(ev)
			         .ok('Please do it!')
			         .cancel('Sounds like a scam');
			   $mdDialog.show(confirm).then(function() {
			     $scope.status = 'You decided to get rid of your debt.';
			   }, function() {
			     $scope.status = 'You decided to keep your debt.';
			   });
			 };
		};

		$scope.save = function() {
			var url = '/api/characs';
			/*
			var config = {
				responseType: "json",
				data: $scope.arbo,
			};*/

			// copie author user id from the autocomplete input
			if (('author' in $scope.arbo) && ($scope.arbo.author != null) && ('id' in $scope.arbo.author))
				$scope.arbo.author_user_id = $scope.arbo.author.id;

			$http.post(url, $scope.arbo).then(function(data) {
				arkeoService.showMessage("ok !");
				$scope.arbo = data.data;
				$scope.check_all();
			}, function(err) {
				arkeoService.showMessage("save failed : "+err.status+", "+err.statusText);
				console.error("saved", err);
			});

		};

		$scope.load = function() {
			var id = $stateParams.charac_id || 0;
			if (id > 0) {
				var url = '/api/characs/'+id;
				$http.get(url).then(function(data) {
					$scope.arbo = data.data;
					$scope.check_all();
				}, function(err) {
					arkeoService.showMessage("load failed : "+err.status+", "+err.statusText);
					console.error("loaded", err);
				})
			} else {
				console.log("starting with a new empty charac...");
			}
		};

		$scope.delete_charac = function() {
			var url = '/api/characs/'+$scope.arbo.id;
			$http.delete(url).then(function(data) {
				arkeoService.showMessage("deleted !");
				$scope.arbo = {
					name: {},
					start_date: 0,
					end_date: 0,
					content: [],
				};
				$scope.check_all();
				$state.go('arkeogis.characchooser-list');
			}, function(err) {
				arkeoService.showMessage("delete failed : "+err.status+", "+err.statusText);
				console.error("delete", err);
			});
		};

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

		function init() {
			$scope.load();
		}
		init();

    }]); // controller CharacChooserCtrl

})(); // all
