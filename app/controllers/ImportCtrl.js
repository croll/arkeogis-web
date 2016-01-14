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
    ArkeoGIS.controller('ImportMainCtrl', ['$scope', '$location', '$rootScope', '$state', 'importService',
        function($scope, $location, $rootScope, $state, importService) {
			// debug
			// return $state.go('import.step3');
            $scope.tabs = importService.tabs; //jshint ignore: line
            var checkPath = function(p) {
                var tabNum = p.split('step')[1];
                importService.tabs.selectedIndex = tabNum;
                if (tabNum === 1) {
                    return;
                }
                while (tabNum > 0) {
                    if (importService.tabs.enabled[tabNum] === true) {
                        importService.tabs.selectedIndex = tabNum;
                        $state.go('import.step' + importService.tabs.selectedIndex);
                        return;
                    }
                    tabNum--;
                }
            };
            $scope.uploadCSV = function(file) {
                importService.uploadCSV(file).then(function(resp) {
                    importService.data = resp.data;
					if ($location.path().split("/")[2] === "step2") {
						$state.reload();
					}  else {
						$state.go('import.step2');
					}
                }, function(resp) {
                    console.log('Import Error. Status: ' + resp.status);
                }, function(evt) {
                    $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                    if ($scope.uploadProgress === 100) {
                        $scope.tabs.enabled[2] = true;
                        $scope.tabs.selectedIndex = 2;
                    }
                });
            };
            return checkPath($location.path());
        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep1Ctrl', ['$scope', '$state', 'arkeoService', 'importService',
        function($scope, $state, arkeoService, importService) {

            $scope.reset = function() {
                var a = importService.reset();
                $scope.tabs.enabled[2] = a.enabled[2];
                $scope.importFields = importService.importFields;
                $scope.file = undefined;
            };

            $scope.importFields = importService.importFields;

            $scope.userPreferences = importService.userPreferences;

            $scope.countrySearch = function(txt) {
                return arkeoService.autocompleteCountry(txt);
            };

            $scope.loadLangs = function() {
                arkeoService.loadLangs().then(function(langs) {
                    $scope.langs = langs;
                });
            };

            $scope.loadContinents = function() {
                arkeoService.loadContinents().then(function(continents) {
                    $scope.continents = continents;
                });
            };

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep2Ctrl', ['$scope', 'importService',
        function($scope, importService) {

            if (!angular.isDefined(importService.data)) {
                return;
            }

            var sitesWithErrors = [];
            var nbSitesOK = 0;
            var nbSitesNOK = 0;
            var nbSites = importService.data.nbSites || 0;
			var nbErrors = 0;

            if (angular.isDefined(importService.data.errors) && (angular.isObject(importService.data.errors))) {

                $scope.importErrors = {
                    total: importService.data.errors.length,
                    data: importService.data.errors
                };

                importService.data.errors.forEach(function(e) {
                    if (sitesWithErrors.indexOf(e.siteCode) === -1) {
                        sitesWithErrors.push(e.siteCode);
                    }
                });

                nbSitesNOK = sitesWithErrors.length;
                nbSitesOK = nbSites - nbSitesNOK;
				nbErrors = importService.data.errors.length;
            } else {
				nbSitesOK = nbSites;
			}

            $scope.nbSites = nbSites;
            $scope.nbSitesOK = nbSitesOK;
            $scope.nbSitesNOK = nbSitesNOK;
            $scope.nbErrors = nbErrors;
            $scope.nbLines = importService.data.nbLines;

            var tooltip = nv.models.tooltip();
            tooltip.duration(0);

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
    ArkeoGIS.controller('ImportStep3Ctrl', ['$scope', '$state', 'arkeoService', 'importService',
        function($scope, $state, arkeoService, importService) {

            $scope.reset = function() {
                var a = importService.reset();
                $scope.tabs.enabled[3] = a.enabled[3];
                $scope.importFields = importService.importFields;
                $scope.file = undefined;
            };

            $scope.importFields = importService.importFields;

            $scope.userPreferences = importService.userPreferences;

            $scope.countrySearch = function(txt) {
                return arkeoService.autocompleteCountry(txt);
            };

            $scope.loadLangs = function() {
                arkeoService.loadLangs().then(function(langs) {
                    $scope.langs = langs;
                });
            };

            $scope.loadContinents = function() {
                arkeoService.loadContinents().then(function(continents) {
                    $scope.continents = continents;
                });
            };

        }
    ]);
})();
