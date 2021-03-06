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
	ArkeoGIS.controller('ArkeoCtrl', ['$scope', 'arkeoService', 'arkeoLang', 'Idle', 'Keepalive', 'login', '$state', '$rootScope', '$http', '$filter', 'EditUser',
	function($scope, Arkeo, arkeoLang, Idle, Keepalive, Login, $state, $rootScope, $http, $filter, EditUser) {

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
				window.location.href="http://arkeogis.org/";
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

		$rootScope.$on('$stateChangeError', function(e, toState, toParams, fromState, fromParams, error) {
			if(angular.isObject(error) && ('requirePermission' in error) && ('redirectTo' in error)) {
				$state.go('arkeogis.login', {
					redirectTo: error.redirectTo,
				});
			}
		});

		// for display logged user on top of the site
		$scope.$watch(function() {
			return Login.user;
		}, function(newval, oldval) {
			$scope.user = Login.user;
			$scope.permissions = Login.permissions;
		})

		$scope.editMyUser = function(ev) {
			if (Login.user.id > 0) {
				EditUser.openDialogEdit(ev, Login.user.id).then(function() {
					Login.relogin().then(function(u) {
						$scope.user = u;
					});
				});
			}
		};

		$scope.hasPerm = function(perm) {
			var found=false;
			_.each($scope.permissions, function(p) {
				if (p.name == perm) found=true;
			})
			return found;
		};

		$http.get('/api/stats').then(function(data) {
            $scope.stats = data.data;
            $scope.stats.date = $filter('date')(new Date(), 'shortDate');
			console.log("stats: ", $scope.stats);
        });

	}]);
})();
