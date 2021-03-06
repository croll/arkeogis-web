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

    window.ArkeoGIS = angular.module('ArkeoGIS', ['md.data.table', 'ngMaterial', 'ngMessages', 'ui.router', 'ngResource', 'nemLogging', 'ui-leaflet', 'pascalprecht.translate', 'ngFileUpload', 'nvd3', 'ngCookies', 'xml', 'ngPromiseExtras', 'ngIdle']);

    ArkeoGIS.config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$translateProvider', '$httpProvider', 'KeepaliveProvider', 'IdleProvider',
        function($mdThemingProvider, $stateProvider, $urlRouterProvider, $locationProvider, $translateProvider, $httpProvider, KeepaliveProvider, IdleProvider) {

            $('div#first_loading').hide();

            /*
             * Theme
             */
    /*
            $mdThemingProvider.theme('pink')
                .primaryPalette('pink', {})
                .accentPalette('red');
    */
            // $mdThemingProvider.theme('grey').primaryPalette('grey', {default: '900'});

            $mdThemingProvider.theme('arkeo-grey')
                .primaryPalette('orange', {
                })
                .warnPalette('red')
                .backgroundPalette('grey')
                .accentPalette('orange');

            $mdThemingProvider.setDefaultTheme('arkeo-grey');
    /*
            $mdThemingProvider.theme('grey')
                .backgroundPalette('grey', {
                    'default': '100'
                })
                .accentPalette('orange');
                */
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
             * http tokens
             */

            $httpProvider.interceptors.push(['$q', '$location', '$cookies', function($q, $location, $cookies) {
                return {
                    'request': function(config) {

                        // do not add Authorization token header on external urls
                        if (config.url.indexOf("http://") == 0 || config.url.indexOf("https://") == 0) {
                            return config;
                        }

                        config.headers = config.headers || {};
                        var token = $cookies.get('arkeogis_session_token');
                        if (token) {
                            config.headers.Authorization = token;
                        }
                        return config;
                    },
                    'responseError': function(response) {
                        // do not go to login path if this is an external url
                        if (response.config.url.indexOf("http://") == 0 || response.config.url.indexOf("https://") == 0) {
                            return $q.reject(response);
                        }
                        if (response.status === 403) {
                            $location.path('/login');
                        }
                        return $q.reject(response);
                    }
                };
            }]);

            $httpProvider.interceptors.push(['$q', function($q) {
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
            }]);

            /***
             * auto logout (idle)
             ***/

             if (window.location.hostname != "localhost" && window.location.hostname != "humain" && window.location.hostname != "home.keblo.net") {
                 IdleProvider.idle(15*60);
                 IdleProvider.timeout(3*60);
                 KeepaliveProvider.interval(10);
             }



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
                        langs: ['arkeoLang', function(arkeoLang) {
                            return arkeoLang.init();
                        }]
                    },
                    controller: function($state) {
                        if ($state.current.url == "")
                            $state.go("arkeogis.map");
                    }
                })
                .state('arkeogis.map', {
                    url: "/map",
                    templateUrl: "partials/map.html",
                    controller: "MapCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('request map', 'arkeogis.map');
                        }],
                        translations: ['$translate', function($translate) {
                            return $translate(['MAP.QUERY_MENU.T_MODIFY', 'MAP.QUERY_MENU.T_DOWNLOAD_CSV', 'MAP.QUERY_MENU.T_ARCHIVE', 'MAP.QUERY_MENU.T_DELETE', 'MAP.QUERY_MENU.T_PROJECT_LAYERS', 'MAP.QUERY_MENU.T_QUERY']);
                        }]
                    }
                })
                .state('arkeogis.import', {
                    url: "/import/:database_id",
                    templateUrl: "partials/import/import.html",
                    controller: "ImportMainCtrl",
                    resolve: {
                        database: ['$stateParams', 'arkeoDatabase', 'arkeoImport', 'login', '$q', function($stateParams, arkeoDatabase, arkeoImport, login, $q) {
                            var deferred = $q.defer();
                            var id = ($stateParams.database_id) ? $stateParams.database_id : 0;
                            arkeoDatabase.Database.get({
                                id: parseInt(id)
                            }, function(db) {
                                deferred.resolve(db);
                            });
                            return deferred.promise;
                        }],
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('import', 'arkeogis.import.step1');
                        }]
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
                        database: ['$stateParams', 'arkeoDatabase', 'login', '$q', function($stateParams, arkeoDatabase, login, $q) {
                            var deferred = $q.defer();
                                var id = $stateParams.database_id || 0;
                                arkeoDatabase.Database.get({
                                    id: parseInt(id)
                                }, function(db) {
                                    deferred.resolve(db);
                                });
                            return deferred.promise;
                        }],
                        databaseDefinitions: ['arkeoDatabase', function(arkeoDatabase) {
                            return arkeoDatabase.translateDefinitions();
                        }],
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('request map', 'arkeogis.database-list');
                        }],
                        isAdmin: ['login', function(login) {
                            return login.havePermission('manage all databases');
                        }]
                    }
                })
                .state('arkeogis.database-list', {
                    url: "/database-list",
                    templateUrl: "partials/database/listing.html",
                    controller: "DatabaseListCtrl",
                    resolve: {
                        databaseDefinitions: ['arkeoDatabase', function(arkeoDatabase) {
                            return arkeoDatabase.translateDefinitions();
                        }],
                        translations: ['$translate', function($translate) {
                            return $translate(['GENERAL.TABLE_PAGINATION.T_ALL']);
                        }],
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('request map', 'arkeogis.database-list');
                        }],
                        isAdmin: ['login', function(login) {
                            return login.havePermission('manage all databases');
                        }]
                    }
                })
                .state('arkeogis.user', {
                    url: "/user",
                    params: {
                        user_id: null,
                    },
                    templateUrl: "partials/user/users.html",
                    controller: "UserCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('request map', 'arkeogis.user');
                        }],
                    }
                })
                .state('arkeogis.project', {
                    url: "/project",
                    templateUrl: "partials/project/project.html",
                    controller: "ProjectCtrl",
                    resolve: {
                        translations: ['$translate', function($translate) {
                            return $translate(['GENERAL.TABLE_PAGINATION.T_ALL']);
                        }],
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('request map', 'arkeogis.project');
                        }],
                    }
                })
                .state('arkeogis.mapeditor', {
                    url: "/mapeditor/:type/:id",
                    templateUrl: "partials/mapeditor.html",
                    controller: "MapEditorCtrl",
                    resolve: {
                        layer: ['$stateParams', '$q', 'layerService', function($stateParams, $q, layerService) {
                            var deferred = $q.defer();
                            if (!$stateParams.id) {
                                deferred.resolve();
                            } else {
                                layerService.getLayer(parseInt($stateParams.id), $stateParams.type, true).then(function(layer) {
                                    deferred.resolve(layer);
                                }, function(err) {
                                    deferred.reject(err);
                                });
                            }
                            return deferred.promise;
                        }],
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('manage all wms/wmts', 'arkeogis.mapeditor');
                        }]
                    }
                })
                .state('arkeogis.mapeditor-list', {
                    url: "/mapeditor-list",
                    templateUrl: "partials/mapeditor-list.html",
                    controller: "MapEditorListCtrl",
                    resolve: {
                        translations: ['$translate', function($translate) {
                            return $translate(['GENERAL.TABLE_PAGINATION.T_ALL']);
                        }],
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('manage all wms/wmts', 'arkeogis.mapeditor');
                        }]
                    }
                })
                .state('arkeogis.group', {
                    url: "/group",
                    templateUrl: "partials/user/groups.html",
                    controller: "GroupCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('adminusers', 'arkeogis.group');
                        }]
                    }
                })
                .state('arkeogis.langeditor', {
                    url: "/langeditor",
                    templateUrl: "partials/langeditor.html",
                    controller: "LangEditorCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('user can use langeditor', 'arkeogis.langeditor');
                        }]
                    }
                })
                .state('arkeogis.chronoditor-list', {
                    url: "/chronoditor-list",
                    templateUrl: "partials/chronoditor-list.html",
                    controller: "ChronoEditorListCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('user can edit some chronology', 'arkeogis.chronoditor-list');
                        }]
                    }
                })
                .state('arkeogis.chronoditor', {
                    url: "/chronoditor/:chronology_id",
                    templateUrl: "partials/chronoditor.html",
                    controller: "ChronoEditorCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('user can edit some chronology', 'arkeogis.chronoditor');
                        }]
                    }
                })
                .state('arkeogis.characeditor-list', {
                    url: "/characeditor-list",
                    templateUrl: "partials/characeditor-list.html",
                    controller: "CharacEditorListCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('user can edit some charac', 'arkeogis.characeditor-list');
                        }]
                    }
                })
                .state('arkeogis.characeditor', {
                    url: "/characeditor/:charac_id",
                    templateUrl: "partials/characeditor.html",
                    controller: "CharacEditorCtrl",
                    resolve: {
                        checkPerm: ['login', function(login) {
                            return login.resolvePermission('user can edit some charac', 'arkeogis.characeditor');
                        }]
                    }
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


        }

    ]);

})();
