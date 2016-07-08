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

var ArkeoGIS = angular.module('ArkeoGIS', ['md.data.table', 'ngMaterial', 'ngMessages', 'ui.router', 'ngResource', 'nemLogging', 'ui-leaflet', 'pascalprecht.translate', 'ngFileUpload', 'nvd3', 'ngCookies', 'xml', 'ngPromiseExtras']);

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
            .state('arkeogis', {
                url: "",
                template: "<ui-view></ui-view>",
                resolve: {
                    test: function(login) {
                        return login.relogin()
                    },
                    langs: function(arkeoLang) {
                        return arkeoLang.init();
                    }
                }
            })
            .state('arkeogis.map', {
                url: "/map",
                templateUrl: "partials/map.html",
                controller: "MapCtrl",
                resolve: {}
            })
            .state('arkeogis.import', {
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
                                arkeoImport.currentDb = db;
                                deferred.resolve(db);
                            });
                        }
                        return deferred.promise;
                    }
                }
            })
            .state('arkeogis.import.step1', {
                url: "/step1",
                controller: "ImportStep1Ctrl",
                templateUrl: "partials/import/step1.html"
            })
            .state('arkeogis.import.step2', {
                url: "/step2",
                templateUrl: "partials/import/step2.html",
                controller: "ImportStep2Ctrl"
            })
            .state('arkeogis.import.step3', {
                url: "/step3",
                templateUrl: "partials/import/step3.html",
                controller: "ImportStep3Ctrl"
            })
            .state('arkeogis.import.step4', {
                url: "/step4",
                templateUrl: "partials/import/step4.html",
                controller: "ImportStep4Ctrl"
            })
            .state('arkeogis.database', {
                url: "/database/:database_id",
                templateUrl: "partials/database/sheet.html",
                controller: "DatabaseCtrl",
                resolve: {
                    database: function($stateParams, arkeoDatabase, login, $q) {
                        var deferred = $q.defer();
                            var id = $stateParams.database_id || 0;
                            arkeoDatabase.Database.get({
                                id: parseInt(id)
                            }, function(db) {
                                deferred.resolve(db);
                            });
                        return deferred.promise;
                    },
                    databaseDefinitions: function(arkeoDatabase) {
                        return arkeoDatabase.translateDefinitions();
                    }
                }
            })
            .state('arkeogis.database-list', {
                url: "/database-list",
                templateUrl: "partials/database/listing.html",
                controller: "DatabaseListCtrl",
                resolve: {
                    databaseDefinitions: function(arkeoDatabase) {
                        return arkeoDatabase.translateDefinitions();
                    }
                }
            })
            .state('arkeogis.user', {
                url: "/user",
                templateUrl: "partials/user/users.html",
                controller: "UserCtrl",
                resolve: {}
            })
            .state('arkeogis.preferences', {
                url: "",
                templateUrl: "partials/user/preferences.html",
                controller: "UserPreferencesCtrl",
                resolve: {}
            })
            .state('arkeogis.preferences.project', {
                url: "/project",
                templateUrl: "partials/project/project.html",
                controller: "ProjectCtrl",
                resolve: {}
            })
            .state('arkeogis.mapeditor', {
                url: "/mapeditor/:type/:id",
                templateUrl: "partials/mapeditor.html",
                controller: "MapEditorCtrl",
                resolve: {
                    layer: function($stateParams, $q, layerService) {
                        var deferred = $q.defer();
                        if (!$stateParams.id) {
                            deferred.resolve();
                        } else {
                            layerService.getLayer(parseInt($stateParams.id), $stateParams.type).then(function(layer) {
                                deferred.resolve(layer);
                            }, function(err) {
                                deferred.reject(err);
                            });
                        }
                        return deferred.promise;
                    }
                }
            })
            .state('arkeogis.mapeditor-list', {
                url: "/mapeditor-list",
                templateUrl: "partials/mapeditor-list.html",
                controller: "MapEditorListCtrl",
                resolve: {}
            })
            .state('arkeogis.group', {
                url: "/group",
                templateUrl: "partials/user/groups.html",
                controller: "GroupCtrl",
                resolve: {}
            })
            .state('arkeogis.langeditor', {
                url: "/langeditor",
                templateUrl: "partials/langeditor.html",
                controller: "LangEditorCtrl",
                resolve: {}
            })
            .state('arkeogis.chronoditor-list', {
                url: "/chronoditor-list",
                templateUrl: "partials/chronoditor-list.html",
                controller: "ChronoEditorListCtrl",
                resolve: {}
            })
            .state('arkeogis.chronoditor', {
                url: "/chronoditor/:chronology_id",
                templateUrl: "partials/chronoditor.html",
                controller: "ChronoEditorCtrl",
                resolve: {}
            })
            .state('arkeogis.characeditor-list', {
                url: "/characeditor-list",
                templateUrl: "partials/characeditor-list.html",
                controller: "CharacEditorListCtrl",
                resolve: {}
            })
            .state('arkeogis.characeditor', {
                url: "/characeditor/:charac_id",
                templateUrl: "partials/characeditor.html",
                controller: "CharacEditorCtrl",
                resolve: {}
            })
            .state('arkeogis.login', {
                url: "/login",
                templateUrl: "partials/login.html",
                controller: "LoginCtrl",
                data: {
                    logout: false,
                },
                params: {
                    redirectTo: '',
                },
            })
            .state('arkeogis.logout', {
                url: "/logout",
                templateUrl: "partials/login.html",
                controller: "LoginCtrl",
                data: {
                    logout: true,
                },
                params: {
                    redirectTo: '',
                },
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

        $httpProvider.interceptors.push(function($q) {
            return {
                'request': function(config) {
                    if (!config.silent) {
                        $('div#arkeo_loading').show();
                    }
                    return config;
                },

                'requestError': function(rejection) {
                    $('div#arkeo_loading').hide();
                    return $q.reject(rejection);
                },


                'response': function(response) {
                    $('div#arkeo_loading').hide();
                    return response;
                },
                'responseError': function(rejection) {
                    $('div#arkeo_loading').hide();
                    return $q.reject(rejection);
                }

            };
        });

    }
]);
