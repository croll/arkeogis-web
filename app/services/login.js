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
    ArkeoGIS.service('login', ['$http', 'user', '$q', '$cookies', 'arkeoLang', '$state', function ($http, User, $q, $cookies, arkeoLang, $state) {

        var self=this;

        this.user = new User ({
            Username: "",
            Password: ""
        });

        this.permissions = [];

        this.login = function(user) {
            var promise = $q(function(resolve, reject) {
                $http.post('/api/login', user).then(function(ret) {
                    $cookies.put('arkeogis_session_token', ret.data.Token);
                    //ArkeoGIS.token=ret.data.Token;
                    self.user = new User(ret.data.User);
                    arkeoLang.setUserLang(1, ret.data.lang1.iso_code)
                    arkeoLang.setUserLang(2, ret.data.lang2.iso_code)
                    self.permissions = ret.data.permissions;
                    resolve(self.user);
                }, function(err) {
                    reject(err);
                });
            });
            return promise;
        };


        /*
         * check if the user has the permission "permname"
         * if the user is not logged, he will be redirected to login page
         * if the user is logged and have the permission, true is returned
         * if the user is logged and didin't have the permission :
             - if redirectTo isn't defined, false is returned
             - if redirectTo is defined, it will be redirecte to map !
         */
        this.requirePermission = function(permname, redirectTo) {
            if (!angular.isDefined(self.user.id) || self.user.id == 0) {
                // user is not logged, so try to login first
                if (redirectTo)
                    $state.go('login', { redirectTo: redirectTo});
                return false;
            } else {
                // user is logged, check permissions
                var haveperm=false;
                // console.log("permissions: ", self.permissions);
                self.permissions.forEach(function(permission) {
                    if (permission.name == permname)
                        haveperm=true;
                })
                if (haveperm) {
                    // everything is ok
                    return true;
                } else {
                    // user is logged but didn't have the permission
                    if (redirectTo)
                        $state.go('map');
                    return false;
                }
            }
        };

    }]);
})();
