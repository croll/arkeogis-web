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
	ArkeoGIS.controller('MapCtrl', ['$scope', '$mdSidenav', '$mdComponentRegistry', 'arkeoService',
	function($scope, $mdSidenav, $mdComponentRegistry, arkeoService) {
		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $(".md-default-theme .md-toolbar-tools").height() - 65 +"px";
		};

		$(window).on('resize', resize);

		resize();

		// Leaflet init
		angular.extend($scope, {
			defaults: {
				zoomControlPosition: 'topright'
			},
			center: {
				lat: 48.58476,
				lng: 7.750576,
				zoom: 8
			},
			controls: {
				scale: {
					imperial: false,
					position: 'bottomright'
				},
				fullscreen: {
					position: 'topright'
				}
			}
		});


		// sideNav

		$scope.sideNavLeftisOpen = function() { return false };
		$scope.sideNavRightisOpen = function() { return false };

		// Register bindnig function
		$mdComponentRegistry
		            .when("sidenav-left")
		            .then(function(sideNav) {
		                $scope.sideNavLeftisOpen = angular.bind(sideNav, sideNav.isOpen );
		});

		$mdComponentRegistry
		            .when("sidenav-right")
		            .then(function(sideNav) {
		                $scope.sideNavRightisOpen = angular.bind(sideNav, sideNav.isOpen );
		});


		$scope.$watch("sideNavLeftisOpen()",function(newValue,oldValue) {
			// save your changes here
			if (newValue == false) {
				$mdSidenav('sidenav-right').close();
			}
		},true);

		$scope.$watch("sideNavRightisOpen()",function (newValue,oldValue) {
			// save your changes here
			if (newValue == false) {
				$mdSidenav('sidenav-left').close();
			}
		},true);

		$scope.open_sides = function() {
			$mdSidenav('sidenav-left').open();
			$mdSidenav('sidenav-right').open();
		};

		// characs
		//$scope.characs = arkeoService.loadCharacsAll();
		arkeoService.loadCharacsAll().then(function(characs) {
			// construct a tree with characs
			var main={id:0, sub:[]};

			function addsub(c) {
				characs.forEach(function(sub) {
					if (sub.parent_id == c.id) {
						if (!('sub' in c)) c.sub=[];
						c.sub.push(sub);
						addsub(sub); // recurse
					}
				})
			}

			addsub(main);
			$scope.characs = main;
		});

		// the Query
		$scope.query = {
		}

		$scope.addInQuery = function(k, v, text) {
			if (!(k in $scope.query)) {
				$scope.query[k] = [];
			}
			$scope.query[k].push({
				k: k,
				v: v,
				text: text,
			})
		};

		$scope.removeFromQuery = function(k, v) {
			if (k in $scope.query) {
				for (var i in $scope.query[k]) {
					console.log("i: ", i);
					if ($scope.query[k][i].v == v) {
						$scope.query[k].splice(i, 1);
						if ($scope.query[k].length == 0) {
							delete $scope.query[k];
						}
						break;
					}
				}
			}
		};

	}]);
})();
