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

var ArkeoGIS = angular.module('ArkeoGIS', ['md.data.table', 'ngMaterial', 'ngMessages', 'ui.router', 'ngResource', 'nemLogging', 'ui-leaflet', 'pascalprecht.translate', 'ngFileUpload', 'nvd3', 'ngCookies']);

ArkeoGIS.config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$translateProvider', '$httpProvider',
    function($mdThemingProvider, $stateProvider, $urlRouterProvider, $locationProvider, $translateProvider, $httpProvider) {



        /*
         * Theme
         */
        $mdThemingProvider.alwaysWatchTheme(true);
        $mdThemingProvider.theme('pink')
            .primaryPalette('pink', {})
            .accentPalette('red');

        $mdThemingProvider.theme('grey')
            .backgroundPalette('grey', {
                'default': '100'
            })
            .accentPalette('orange');
        /******/

        /*
         * Translation
         */
        $translateProvider.useStaticFilesLoader({
            prefix: '/languages/',
            suffix: '.json'
        });
        $translateProvider.useSanitizeValueStrategy('escape');
        //$translateProvider.uses('fr');
        $translateProvider.determinePreferredLanguage();
        //$translateProvider.preferredLanguage('fr');
        $translateProvider.fallbackLanguage('fr');
        /******/

        /*
         * Routing
         */
        $urlRouterProvider.otherwise("/map");

        $locationProvider.html5Mode(false);

        $stateProvider
            .state('map', {
                url: "/map",
                templateUrl: "partials/map.html",
                controller: "MapCtrl",
                resolve: {}
            })
            .state('import', {
                url: "/import/:database_id",
                templateUrl: "partials/import/import.html",
                controller: "ImportMainCtrl",
                resolve: {
                    database: function($stateParams, arkeoDatabase, arkeoImport, login, $q) {
                        var deferred = $q.defer();
                        if ($stateParams.database_id == -1) {
                            deferred.resolve(arkeoImport.currentDb);
                        } else {
                            var id = $stateParams.database_id || 0;
                            arkeoDatabase.Database.get({
                                id: parseInt(id)
                            }, function(db) {
                                // debug
                                db.infos = {};
                                db.infos.name = 'pouet';
                                db.infos.geographical_extent = 'world';
                                db.contexts = ["academic_work"];
                                db.infos.license_id = 2;
                                db.infos.scale_resolution = "object";
                                db.infos.state = "in-progress";
                                db.infos.subject = "Le sujet et les mots clés";
                                db.infos.source_creation_date = new Date();
                                db.infos.type = "inventory";
                                console.log(db);
                                arkeoImport.currentDb = db;
                                if (!db.id && login.user.firstname) {
                                    db.default_language = login.user.first_lang_id;
                                }
                                if (!angular.isDefined(db.translations)) {
                                    db.translations = {
                                        description: {fr: 'description fr', en: 'description en'},
                                        bibliography: {fr: 'bibliographie fr', en: 'bibliograhie en'}
                                    };
                                }
                                deferred.resolve(db);
                            });
                        }
                        return deferred.promise;
                    }
                }
            })
            .state('import.step1', {
                url: "/step1",
                controller: "ImportStep1Ctrl",
                templateUrl: "partials/import/step1.html"
            })
            .state('import.step2', {
                url: "/step2",
                templateUrl: "partials/import/step2.html",
                controller: "ImportStep2Ctrl"
            })
            .state('import.step3', {
                url: "/step3",
                templateUrl: "partials/import/step3.html",
                controller: "ImportStep3Ctrl"
            })
            .state('import.step4', {
                url: "/step4",
                templateUrl: "partials/import/step4.html",
                controller: "ImportStep4Ctrl"
            })
            .state('import.step5', {
                url: "/step5",
                templateUrl: "partials/import/step5.html",
                controller: "ImportStep5Ctrl"
            })
            .state('user', {
                url: "/user",
                templateUrl: "partials/user/users.html",
                controller: "UserCtrl",
                resolve: {}
            })
            .state('group', {
                url: "/group",
                templateUrl: "partials/user/groups.html",
                controller: "GroupCtrl",
                resolve: {}
            })
            .state('langeditor', {
                url: "/langeditor",
                templateUrl: "partials/langeditor.html",
                controller: "LangEditorCtrl",
                resolve: {}
            })
            .state('login', {
                url: "/login",
                templateUrl: "partials/login.html",
                controller: "LoginCtrl",
                params: {
                    redirectTo: ''
                },
                resolve: {
                    langs: function(arkeoLang) {
                        return arkeoLang.init();
                    }
                }
            });
        /**********/

        /*
         * http tokens
         */

        $httpProvider.interceptors.push(['$q', '$location', '$cookies', function($q, $location, $cookies) {
            return {
                'request': function(config) {
                    config.headers = config.headers || {};
                    var token = $cookies.get('arkeogis_session_token');
                    if (token) {
                        config.headers.Authorization = token;
                    }
                    return config;
                },
                'responseError': function(response) {
                    if (response.status === 401 || response.status === 403) {
                        $location.path('/login');
                    }
                    return $q.reject(response);
                }
            };
        }]);


    }
]);
