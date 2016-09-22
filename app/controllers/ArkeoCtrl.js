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
	ArkeoGIS.controller('ArkeoCtrl', ['$scope', 'arkeoService', 'arkeoLang', 'Idle', 'Keepalive', 'login', '$state', function($scope, Arkeo, arkeoLang, Idle, Keepalive, Login, $state) {

		$scope.theme = Arkeo.theme;

		$scope.setUserLang = function(lang) {
			arkeoLang.setUserLang(1, lang);
        	$scope.langIsoCode = arkeoLang.getUserLang(1);
		};

		$scope.setTheme = function(name) {
			Arkeo.theme = name;
			$scope.theme = name;
		};

      	$scope.$on('IdleStart', function() {
			$('div#arkeo_idle').show();
			console.log("idle start");
		});

		$scope.$on('IdleEnd', function() {
			$('div#arkeo_idle').hide();
			console.log("idle end");
        });

		$scope.$on('IdleTimeout', function() {
			console.log("idle timeout");
			$('div#arkeo_idle').hide();
			Login.logout().then(function() {
				window.location.href="http://arkeo4.dev.rhack.net/";
			});
		});

		function toggleFullScreen() {
			var doc = window.document;
			var docEl = doc.documentElement;

			var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
			var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

			if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
				requestFullScreen.call(docEl);
			} else {
				cancelFullScreen.call(doc);
			}
		}

		$scope.toggleFullScreen = toggleFullScreen;
		
	}]);
})();
