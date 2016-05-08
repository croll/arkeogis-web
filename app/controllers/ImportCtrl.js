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
    ArkeoGIS.controller('ImportMainCtrl', ['$scope', '$location', '$rootScope', '$state', 'arkeoImport', 'login', 'arkeoDatabase', 'database',
        function($scope, $location, $rootScope, $state, arkeoImport, login, arkeoDatabase, database) {

            // Debug
            // arkeoImport.tabs.selectedIndex = 3;
            // Fin Debug

            if (!login.requirePermission('import', 'import.step1'))
                return;

            $scope.user = login.user;

            if (typeof(database.id) == undefined || !database.id) {
                database.default_language = login.user.first_lang_id;
            }
            $scope.database = database;

            $scope.definitions = arkeoDatabase.definitions;

            $scope.importChoices = arkeoImport.importChoicesDefaultValues;

            $scope.userPreferences = arkeoImport.userPreferences;

            $scope.tabs = arkeoImport.tabs; //jshint ignore: line

            var checkPath = function(p) {
                var tabNum = p.split('step')[1];
                arkeoImport.tabs.selectedIndex = tabNum;
                if (tabNum === 1) {
                    return;
                }
                while (tabNum > 0) {
                    if (arkeoImport.tabs.enabled[tabNum] === true) {
                        arkeoImport.tabs.selectedIndex = tabNum;
                        $state.go('import.step' + arkeoImport.tabs.selectedIndex);
                        return;
                    }
                    tabNum--;
                }
            };

            $scope.uploadCSV = function(file) {
                arkeoImport.uploadCSV(file, $scope.importChoices, $scope.database).then(function(resp) {
                    arkeoImport.data = resp.data;
                    if (angular.isDefined(resp.data.database_id) && resp.data.database_id) {
                        $scope.database.id = resp.data.database_id;
                    }
                    if ($location.path().split("/").pop() === "step2") {
                        $state.go($state.current, {database_id: -1}, {reload: true});
                    } else {
                        $state.go('import.step2');
                    }
                }, function(resp) {
                    console.log('Import Error. Status: ' + resp.status);
                }, function(evt) {
                    $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                    if ($scope.uploadProgress === 100) {
                        if ($location.path().split("/").pop() !== "step2") {
                            arkeoImport.selectTab(2)
                        }
                    }
                });
            };
            return checkPath($location.path());
        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep1Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoDatabase', 'arkeoImport', 'login',
        function($scope, $state, arkeoService, arkeoDatabase, arkeoImport, login) {

            if (!login.requirePermission('import', 'import.step1'))
                return;

            $scope.reset = function() {
                $scope.tabs.enabled[2] = a.enabled[2];
                $scope.file = undefined;
            };

            $scope.countrySearch = function(txt) {
                return arkeoService.autocompleteCountry(txt);
            };

            $scope.continentSearch = function(txt) {
                return arkeoService.autocompleteContinent(txt);
            };

            $scope.loadLangs = function() {
                arkeoService.loadLangs().then(function(langs) {
                    $scope.langs = langs;
                });
            };

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep2Ctrl', ['$scope', 'arkeoImport', 'login',
        function($scope, arkeoImport, login) {

            if (!login.requirePermission('import', 'import.step1'))
                return;

            if (!angular.isDefined(arkeoImport.data)) {
                return;
            }

            var sitesWithErrors = [];
            var nbSitesOK = 0;
            var nbSitesNOK = 0;
            var nbSites = arkeoImport.data.nbSites || 0;
            var nbErrors = 0;

            if (angular.isDefined(arkeoImport.data.errors) && (angular.isObject(arkeoImport.data.errors))) {

                $scope.importErrors = {
                    total: arkeoImport.data.errors.length,
                    data: arkeoImport.data.errors
                };

                arkeoImport.data.errors.forEach(function(e) {
                    if (sitesWithErrors.indexOf(e.siteCode) === -1) {
                        sitesWithErrors.push(e.siteCode);
                    }
                });

                nbSitesNOK = sitesWithErrors.length;
                nbSitesOK = nbSites - nbSitesNOK;
                nbErrors = arkeoImport.data.errors.length;
            } else {
                nbSitesOK = nbSites;
            }

            $scope.nbSites = nbSites;
            $scope.nbSitesOK = nbSitesOK;
            $scope.nbSitesNOK = nbSitesNOK;
            $scope.nbErrors = nbErrors;
            $scope.nbLines = arkeoImport.data.nbLines;

            //var tooltip = nv.models.tooltip();
            //tooltip.duration(0);

            var percent = (nbSites > 0) ? Math.round(nbSitesOK * 100 / nbSites) : 0;

            $scope.nvd3Options = {
                chart: {
                    type: 'pieChart',
                    height: 280,
                    width: 280,
                    arcsRadius: [{
                        inner: 0.65,
                        outer: 0.85
                    }, {
                        inner: 0.7,
                        outer: 0.8
                    }],
                    x: function(d) {
                        return d.key;
                    },
                    y: function(d) {
                        return d.value;
                    },
                    showLabels: false,
                    donut: true,
                    labelType: "percent",
                    transitionDuration: 500,
                    title: percent + "%",
                    color: ["#9ad49a", "#FB7378"],
                    showLegend: false,
                    legendPosition: 'right',
                    valueFormat: function(d) {
                        return d;
                    },
                }
            };


            $scope.nvd3Datas = [{
                key: "Sites valides:",
                value: (nbSites > 0) ? nbSites - sitesWithErrors.length : 0
            }, {
                key: "Sites en erreur:",
                value: sitesWithErrors.length || nbErrors
            }];

            $scope.filter = {
                show: false,
                options: {}
            };

            $scope.query = {
                filter: '',
                order: 'line',
                limit: 20,
                page: 1,
                numRows: ['All', 10, 20, 30]
            };

            $scope.onOrderChange = function(order) {
                $scope.order = order;
            };

            $scope.removeFilter = function() {
                $scope.filter.show = false;
                $scope.query.filter = '';

                if ($scope.filter.form.$dirty) {
                    $scope.filter.form.$setPristine();
                }
            };

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep3Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoImport', 'login',
        function($scope, $state, arkeoService, arkeoImport, login) {

            if (!login.requirePermission('import', 'import.step1'))
                return;

            arkeoImport.selectTab(3)

            $scope.loadLicenses = function() {
                arkeoService.loadLicenses().then(function(l) {
                    var lincenses = [];
                    licences.each(function(l) {
                        if (l.name !== '-') {
                            licenses.push(l)
                        }
                    });
                    $scope.licenses = licenses;
                });
            };

            console.log($scope.definitions);

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep4Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoImport', 'login',
        function($scope, $state, arkeoService, arkeoImport, login) {

            if (!login.requirePermission('import', 'import.step1'))
                return;

            arkeoImport.selectTab(4)

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep5Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoImport', 'login',
        function($scope, $state, arkeoService, arkeoImport, login) {

            if (!login.requirePermission('import', 'import.step1'))
                return;

            arkeoImport.selectTab(5)

        }
    ]);
})();
