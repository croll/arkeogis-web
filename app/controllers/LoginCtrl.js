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
	ArkeoGIS.controller('LoginCtrl', ['$scope', 'login', 'user', "$state", "$stateParams", "arkeoService", "$mdToast", '$http', '$filter', 'arkeoProject',
    function ($scope, login, User, $state, $stateParams, arkeoService, $mdToast, $http, $filter, arkeoProject) {

        $scope.user = login.user;

        if ($state.current.data.logout) {
            login.logout().then(function() {
                $state.go("arkeogis.login");
            }, function() {
                $state.go("arkeogis.login");
            });
        }

		$scope.loginSubmit = function () {
            login.login($scope.user).then(function(ret) {
                $scope.user = ret;

                console.log("arkeoProject: ", arkeoProject);

                if (!arkeoProject.project || !('id' in arkeoProject.project) || arkeoProject.project.id==0) {
                    $state.go("arkeogis.project");
                } else {
                    if (($stateParams.redirectTo != "") && ($stateParams.redirectTo != "arkeogis.login")) {
                        $state.go($stateParams.redirectTo);
                        $stateParams.redirectTo = "";
                    } else {
                        $state.go("arkeogis.map");
                    }
                }
            }, function(err) {
                console.log("err ! ", err);
                if (err.data.errors) {
					arkeoService.setFormErrorsFromServer(loginForm, err.data.errors, "json.");
                } else {
                    //alert('Login Failed');
                    $mdToast.show($mdToast.simple().textContent("Login Failed !").position('bottom left'));
                //loginForm.username.$error.server = "Login Failed";
                }
            });
		}

        $http.get('/api/stats').then(function(data) {
            $scope.stats = data.data;
            $scope.stats.date = $filter('date')(new Date(), 'shortDate');

            var contactstr = $('#LOGIN_FOOTER_T_CONTACT').text();
            contactstr = contactstr.replace("CONTACT_LINK", "<a href='"+$('#LOGIN_FOOTER_T_CONTACT_LINKURL').html()+"'>"+$('#LOGIN_FOOTER_T_CONTACT_LINKNAME').text()+"</a>");
            $('#contactstr').html(contactstr);
        });
	}]);
})();
