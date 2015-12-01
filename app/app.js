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

var ArkeoGIS = angular.module('ArkeoGIS', ['md.data.table', 'ngMaterial', 'ngMessages', 'ui.router', 'ngResource', 'nemLogging', 'leaflet-directive', 'pascalprecht.translate', 'ngFileUpload', 'nvd3']);

ArkeoGIS.config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$translateProvider', '$httpProvider', function($mdThemingProvider, $stateProvider, $urlRouterProvider, $locationProvider, $translateProvider, $httpProvider) {



    /*
     * Theme
     */
    $mdThemingProvider.theme('default')
        .primaryPalette('blue', {});

    $mdThemingProvider.theme('grey')
        .backgroundPalette('grey', {
            'default': '100'
        })
        .accentPalette('red');
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
            url: "/import",
            templateUrl: "partials/import/import.html",
            controller: "ImportMainCtrl"
        })
        .state('import.step1', {
            url: "/step1",
            controller: "ImportStep1Ctrl",
            templateUrl: "partials/import/step1.html",
            resolve: {}
        })
        .state('import.step2', {
            url: "/step2",
            templateUrl: "partials/import/step2.html",
            controller: "ImportStep2Ctrl",
            resolve: {}
        })
        .state('import.step3', {
            url: "/step3",
            templateUrl: "partials/import/step3.html",
            resolve: {}
        })
        .state('import.step4', {
            url: "/step4",
            templateUrl: "partials/import/step4.html",
            resolve: {}
        })
        .state('user', {
            url: "/user",
            templateUrl: "partials/user.html",
            controller: "UserCtrl",
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
            resolve: {}
        });
    /**********/

    this.token="";

    /*
     * http tokens
     */

    ArkeoGIS.token = "";
    $httpProvider.interceptors.push(['$q', '$location', function($q, $location, user) {
        return {
            'request': function(config) {
                config.headers = config.headers || {};
                if (ArkeoGIS.token) {
                    config.headers.Authorization = ArkeoGIS.token;
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


}]);
