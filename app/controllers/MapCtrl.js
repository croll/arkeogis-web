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
	ArkeoGIS.controller('MapCtrl', ['$scope', '$http', '$location', '$mdSidenav', '$mdComponentRegistry', '$q', 'arkeoService', 'arkeoProject', 'login',
	function($scope, $http, $location, $mdSidenav, $mdComponentRegistry, $q, arkeoService, arkeoProject, Login) {

		if (!Login.requirePermission('request map', 'arkeogis.map'))
            return;

		$scope.project = arkeoProject.get();
		console.log("project: ", $scope.project);

		// the Query
		$scope.query = {
		};

		// results
		$scope.latest_result = 0;

		/*
		 * SideNav
		 */

		$scope.open_sideleft = function() {
			$mdSidenav('sidenav-left').open();
		};

	}]);
})();
