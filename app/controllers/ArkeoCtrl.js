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

(function() {
	'use strict';
	ArkeoGIS.controller('ArkeoCtrl', ['$scope', 'arkeoService', 'arkeoLang', function($scope, Arkeo, arkeoLang) {

		$scope.theme = Arkeo.theme;

		$scope.setUserLang = function(lang) {
			arkeoLang.setUserLang(1, lang);
        	$scope.langIsoCode = arkeoLang.getUserLang(1);
		};

		$scope.setTheme = function(name) {
			Arkeo.theme = name;
			$scope.theme = name;
		};
	}]);
})();
