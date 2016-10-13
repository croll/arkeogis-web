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
    ArkeoGIS.service('login', ['$http', 'user', '$q', '$cookies', 'arkeoLang', 'arkeoProject', '$state', 'Idle', function($http, User, $q, $cookies, arkeoLang, arkeoProject, $state, Idle) {

        var self = this;

        this.user = new User({
            Username: "",
            Password: ""
        });

        this.permissions = [];

        this.login = function(user) {
            return $q(function(resolve, reject) {
                $http.post('/api/login', user).then(function(ret) {
                    $cookies.put('arkeogis_session_token', ret.data.Token);
                    //ArkeoGIS.token=ret.data.Token;
                    self.user = new User(ret.data.User);

                    // set langs
                    arkeoLang.setUserLang(1, ret.data.lang1.isocode)
                    arkeoLang.setUserLang(2, ret.data.lang2.isocode)

                    // set permissions
                    self.permissions = ret.data.permissions;

                    // init idle timeout
                    if ('id' in self.user && self.user.id != 0) Idle.watch();

                    // set project
                    arkeoProject.set(ret.data.project);
                    $cookies.put('project_id', ret.data.project.id);

                    arkeoProject.getDetails().then(function(proj) {
                        resolve(self.user);
                    }, function(err) {
                        reject(err);
                    });
                }, function(err) {
                    reject(err);
                });
            });
        };

        this.relogin = function() {
            return $q(function(resolve, reject) {
                $http.get('/api/relogin').then(function(ret) {
                    self.user = new User(ret.data.User);

                    // set langs
                    arkeoLang.setUserLang(1, ret.data.lang1.isocode)
                    arkeoLang.setUserLang(2, ret.data.lang2.isocode)

                    // set permissions
                    self.permissions = ret.data.permissions;

                    // init idle timeout
                    if ('id' in self.user && self.user.id != 0) Idle.watch();

                    // set project
                    arkeoProject.set(ret.data.project);
                    $cookies.put('project_id', ret.data.project.id);

                    arkeoProject.getDetails().then(function(proj) {
                        resolve(self.user);
                    }, function(err) {
                        reject(err);
                    });
                }, function(err) {
                    console.error(err);
                    reject(err);
                });
            });
        };

        this.getUser = function() {
            return $q(function(resolve, reject) {
                if (!angular.isDefined(self.user.id) || self.user.id == 0) {
                    self.relogin().then(function(user) {
                        resolve(user)
                    }, function(err) {
                        reject(err);
                    })
                } else {
                    resolve(self.user);
                }
            });
        };

        this.logout = function() {
            return $http.get('/api/logout').then(function(ret) {
                self.user = new User(ret.data.User);

                // reset lang
                arkeoLang.setUserLang(1, ret.data.lang1.isocode)
                arkeoLang.setUserLang(2, ret.data.lang2.isocode)

                // reset project
                $cookies.remove('project_id');
                arkeoProject.reset();

                // reset permissions
                self.permissions = ret.data.permissions;

                // reset idle timeout
                Idle.unwatch();
                return self.user;
            }, function(err) {
                return err;
            });
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
            console.warn("login.requirePermission IS NOT SUPPORTED ANYMORE, sorry !");
            return true;

            if (!angular.isDefined(self.user.id) || self.user.id == 0) {
                // user is not logged, so try to login first
                if (redirectTo)
                    $state.go('arkeogis.login', {
                        redirectTo: redirectTo
                    });
                return false;
            } else {
                // user is logged, check permissions
                var haveperm = false;
                // console.log("permissions: ", self.permissions);
                self.permissions.forEach(function(permission) {
                    if (permission.name == permname)
                        haveperm = true;
                })
                if (haveperm) {
                    // everything is ok
                    return true;
                } else {
                    // user is logged but didn't have the permission
                    if (redirectTo)
                        $state.go('arkeogis.map');
                    return false;
                }
            }
        };

        this.resolvePermission = function(permname, redirectTo) {
            return $q(function(resolve, reject) {
                var user = self.getUser().then(function(user) {

                    var haveperm = false;
                    self.permissions.forEach(function(permission) {
                        if (permission.name == permname)
                            haveperm = true;
                    })
                    if (haveperm) {
                        // everything is ok
                        resolve(user);
                    } else {
                        reject({
                            requirePermission: permname,
                            redirectTo: redirectTo,
                        });
                    }

                }, function(err) {
                    reject(err);
                });
            });
        };

        this.havePermission = function(permname) {
            return $q(function(resolve, reject) {
                var user = self.getUser().then(function(user) {
                    var haveperm = false;
                    self.permissions.forEach(function(permission) {
                        if (permission.name == permname)
                            haveperm = true;
                    })
                    resolve(haveperm);
                }, function(err) {
                    reject(err);
                });
            });
        };

    }]);
})();
