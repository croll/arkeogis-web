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

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            $scope.user = login.user;

            //arkeoImport.tabs.selectedIndex = 3;

            if (typeof(database.id) == undefined || !database.id) {
                database.default_language = login.user.first_lang_isocode;
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
                        $state.go('arkeogis.import.step' + arkeoImport.tabs.selectedIndex);
                        return;
                    }
                    tabNum--;
                }
            };

            $scope.uploadCSV = function(file) {
                arkeoImport.uploadCSV(file, $scope.importChoices, $scope.database).then(function(resp) {
                    arkeoImport.data = resp.data;
                    if (angular.isDefined(resp.data.database_id) && resp.data.database_id) {
                        database.id = resp.data.database_id;
                        database.import_id = resp.data.import_id;
                    }
                    database.authors = [{id: login.user.id, fullname: login.user.firstname+' '+login.user.lastname}];
                    if ($location.path().split("/").pop() === "step2") {
                        $state.go($state.current, {database_id: -1}, {reload: true});
                    } else {
                        $state.go('arkeogis.import.step2');
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
    ArkeoGIS.controller('ImportStep1Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoDatabase', 'arkeoImport', 'login', 'arkeoLang', 'database',
        function($scope, $state, arkeoService, arkeoDatabase, arkeoImport, login, arkeoLang, database) {

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
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

            // $scope.loadLangs = function() {
            //     arkeoLang.getActiveLangs().then(function(langs) {
            //         $scope.langs = langs;
            //     });
            // };

            $scope.myTransLang1 = angular.copy(arkeoLang.default_language);

            $scope.myTransLang2 = angular.copy(arkeoLang.default_language);
        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep2Ctrl', ['$scope', 'arkeoImport', 'login',
        function($scope, arkeoImport, login) {

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
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
    ArkeoGIS.controller('ImportStep3Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoImport', 'arkeoLang', 'arkeoDatabase', 'database', 'login', '$translate', '$q', '$http',
        function($scope, $state, arkeoService, arkeoImport, arkeoLang, arkeoDatabase, database, login, $translate, $q, $http) {

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            arkeoImport.selectTab(3)

            $scope.loadLicenses = function() {
                arkeoService.loadLicenses().then(function(l) {
                    var licenses = [];
                    angular.forEach(l, function(license) {
                        if (license.name !== '-') {
                            licenses.push(license)
                        }
                    });
                    $scope.licenses = licenses;
                });
            };

            $scope.searchContext = function(txt) {
                var contexts = [];
                var ctxByKey = {};
                var ctxKeys = []

                if (txt == "") {
                    return $q.defer().resolve([]).promise;
                }

                angular.forEach(arkeoDatabase.definitions.contexts, function(ctx) {
                    ctxByKey[ctx.tr] = ctx.id
                    ctxKeys.push(ctx.tr);
                });

                return $translate(ctxKeys).then(function(translations) {
                    for (var k in translations) {
                        if (translations[k].toLowerCase().indexOf(txt.toLowerCase()) !== -1) {
                                contexts.push({id: ctxByKey[k], label: translations[k]});
                        }
                    }
                    return contexts;
                });
            };

            $scope.searchUser = function(txt) {
                return $http.get('/api/users/'+txt).then(function(result) {
                    return result.data;
                });
            }

            $scope.removeAuthor = function(user) {
                if (user.id == login.user.id) {
                    arkeoService.showMessage('IMPORT_STEP3.AUTHORS.T_UNABLE_TO_REMOVE_MAIN_AUTHOR');
                    database.authors.unshift(user);
                }
            }

            $scope.submit = function(form) {
                // Copy database object to be a little bit modified for request
                var dbObj = angular.copy(database);
                if (form.$valid) {
                    dbObj.authors = [];
                    angular.forEach(database.authors, function(author) {
                        dbObj.authors.push(author.id);
                    });
                    dbObj.description = [];
                    for (var iso_code in database.description) {
                        if (database.description.hasOwnProperty(iso_code)) {
                            dbObj.description.push({lang_isocode: iso_code, text: database.description[iso_code]});
                        }
                    }
                    dbObj.contexts = [];
                    angular.forEach(database.contexts, function(ctx) {
                        dbObj.contexts.push(ctx.id);
                    });
                    $http.post("/api/import/step3", dbObj).then(function(result) {
                        if (result.status == 200) {
                            $state.go('arkeogis.import.step4')
                            // arkeoService.showMessage("IMPORT_STEP3.MESSAGES.T_PUBLICATION_INFORMATIONS_SAVED")
                        } else {
                            console.log("Error sending step3");
                        }
                    }, function(error) {
                        console.log("Error sending step3");
                        console.log(error);
                    });
                }
            }

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep4Ctrl', ['$scope', '$state', '$stateParams', 'arkeoService', 'arkeoImport', 'arkeoLang', 'login', 'database', '$http',
        function($scope, $state, $stateParams, arkeoService, arkeoImport, arkeoLang, login, database, $http) {

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            arkeoImport.selectTab(4)

            $scope.submit = function(form) {
                var dbObj = angular.copy(database);

                if (form.$valid) {
                    dbObj.bibliography= [];
                    for (var iso_code in database.bibliography) {
                        if (database.bibliography.hasOwnProperty(iso_code)) {
                            dbObj.bibliography.push({lang_isocode: iso_code, text: database.bibliography[iso_code]});
                        }
                    }
                    dbObj.geographical_limit= [];
                    for (var iso_code in database.geographical_limit) {
                        if (database.geographical_limit.hasOwnProperty(iso_code)) {
                            dbObj.geographical_limit.push({lang_isocode: iso_code, text: database.geographical_limit[iso_code]});
                        }
                    }
                    $http.post("/api/import/step4", dbObj).then(function(result) {
                        if (result.status == 200) {
                            $stateParams.database_id = database.id;
                            $state.go('arkeogis.database')
                            // arkeoService.showMessage("IMPORT_STEP4.MESSAGES.T_MORE_INFORMATIONS_SAVED")
                        } else {
                            console.log("Error sending step4");
                        }
                    }, function(error) {
                        console.log("Error sending step4");
                        console.log(error);
                    });
                }
            };

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep5Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoImport', 'login',
        function($scope, $state, arkeoService, arkeoImport, login) {

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            arkeoImport.selectTab(5)

        }
    ]);
})();
