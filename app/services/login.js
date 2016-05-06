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
    ArkeoGIS.service('login', ['$http', 'user', '$q', '$cookies', 'arkeoService', function ($http, User, $q, $cookies, Arkeo) {

        var self=this;

        this.user = new User ({
            Username: "",
            Password: ""
        });

        this.login = function(user) {
            var promise = $q(function(resolve, reject) {
                $http.post('/api/login', user).then(function(ret) {
                    $cookies.put('arkeogis_session_token', ret.data.Token);
                    //ArkeoGIS.token=ret.data.Token;
                    self.user=new User(ret.data.User);
                    Arkeo.setLang1(ret.data.lang1.iso_code)
                    Arkeo.setLang2(ret.data.lang2.iso_code)
                    resolve(self.user);
                }, function(err) {
                    reject(err);
                });
            });
            return promise;
        };

    }]);
})();
