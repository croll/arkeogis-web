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

            var self = this;

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            if (database.id > 0) {
                database.editMode = true;
            }

            $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
                var num = toState.name.split('.').pop().replace('step', '');
                arkeoImport.tabs.enabled[num] = true;
                arkeoImport.tabs.selectedIndex = num - 1;
            });

            $scope.user = login.user;

            if (angular.isDefined(database.id) == undefined || !database.id) {
                database.default_language = login.user.first_lang_isocode;
            }

            $scope.definitions = arkeoDatabase.definitions;

            arkeoDatabase.translateDefinitions().then(function(databaseDefinitions) {
                $scope.databaseDefintions = databaseDefinitions;

                // contexts
                if (database.id > 0) {
                    arkeoImport.enableAllTabs();
                    arkeoImport.disableReportTab();
                    angular.forEach(database.contexts, function(ctx) {
                        ctx.label = databaseDefinitions[ctx.context];
                    });
                }

                $scope.database = database;
                $scope.tabs = arkeoImport.tabs; //jshint ignore: line

                var askedStepNum = $state.current.name.split('.').pop().replace('step', '');

                if (askedStepNum > 1) {
                    if (!database.editMode) {
                        $state.go('arkeogis.import.step1', {}, {reload: true});
                        return;
                    } else {
                        $scope.tabs.selectedIndex = ($scope.tabs.enabled[2] === true) ? askedStepNum-=1 : askedStepNum-=2;
                    }
                }
            });

            $scope.importChoices = arkeoImport.importChoicesDefaultValues;

            $scope.userPreferences = arkeoImport.userPreferences;

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep1Ctrl', ['$scope', '$state', '$http', 'arkeoService', 'arkeoDatabase', 'arkeoImport', 'login', 'arkeoLang', 'database',
        function($scope, $state, $http, arkeoService, arkeoDatabase, arkeoImport, login, arkeoLang, database) {

            var self = this;

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            $scope.reset = function() {
                $scope.tabs.enabled[2] = arkeoImport.tabs.enabled[2];
                $scope.file = undefined;
            };

            $scope.countrySearch = function(txt) {
                return arkeoService.autocompleteCountry(txt);
            };

            $scope.continentSearch = function(txt) {
                return arkeoService.autocompleteContinent(txt);
            };

            $scope.myTransLang1 = angular.copy(arkeoLang.default_language);

            $scope.myTransLang2 = angular.copy(arkeoLang.default_language);

            $scope.modifyDatabase = function(form) {

                $http({
                    url: '/api/import/update-step1',
                    method: 'POST',
                    data: database
                }).then(function() {
                    $state.go('arkeogis.import.step3');
                    arkeoService.showMessage('IMPORT_STEP1.MESSAGE.T_INFORMATIONS_UPDATED');
                }, function(err) {
                    console.log(err);
                    arkeoService.showMessage('IMPORT_STEP1.MESSAGE.T_UNABLE_TO_UPDATE_DATABASE_INFORMATIONS', 'error');
                })
            };

            $scope.uploadCSV = function() {
                if (database.editMode) {
                    arkeoImport.enableReportTab();
                }
                console.log($scope.importChoices);
                console.log(angular.copy($scope.database));

                arkeoImport.uploadCSV($scope.file, $scope.importChoices, $scope.database).then(function(resp) {
                    arkeoImport.data = resp.data;
                    if (angular.isDefined(resp.data.database_id) && resp.data.database_id) {
                        database.id = resp.data.database_id;
                        database.import_id = resp.data.import_id;
                    }
                    database.authors = [{
                        id: login.user.id,
                        fullname: login.user.firstname + ' ' + login.user.lastname
                    }];
                    $state.go('arkeogis.import.step2');
                }, function(resp) {
                    console.log('Import Error. Status: ' + resp.status);
                }, function(evt) {
                    $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                });
            }

            $scope.check = function() {
                $scope.importForm.extent_continent.$setValidity("required", !(database.geographical_extent == 'continent' && database.continents.length == 0));
                $scope.importForm.extent_country.$setValidity("required", !(database.geographical_extent == 'country' && database.countries.length == 0));
            }

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep2Ctrl', ['$scope', 'arkeoImport', 'login',
        function($scope, arkeoImport, login) {

            var self = this;

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            if (!angular.isDefined(arkeoImport.data)) {
                return;
            }

            $scope.uploadCSV = function() {
                arkeoImport.uploadCSV($scope.file, $scope.importChoices, $scope.database).then(function(resp) {
                    arkeoImport.data = resp.data;
                    //$state.go($state.current, {database_id: -1}, {reload: true});
                    $scope.file = undefined;
                    $scope.formUpload.$setPristine();
                    self.refreshDisplay();
                }, function(resp) {
                    console.log('Import Error. Status: ' + resp.status);
                }, function(evt) {
                    $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                });
            }

            this.refreshDisplay = function() {
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

            }


            //var tooltip = nv.models.tooltip();
            //tooltip.duration(0);


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

            this.refreshDisplay();

        }
    ]);
})();

(function() {
    'use strict';
    ArkeoGIS.controller('ImportStep3Ctrl', ['$scope', '$state', 'arkeoService', 'arkeoImport', 'arkeoLang', 'arkeoDatabase', 'arkeoProject', 'database', 'login', '$translate', '$q', '$http',
        function($scope, $state, arkeoService, arkeoImport, arkeoLang, arkeoDatabase, arkeoProject, database, login, $translate, $q, $http) {

            if (!login.requirePermission('import', 'arkeogis.import.step1'))
                return;

            if (!angular.isDefined(arkeoImport.data)) {
                return;
            }

            var project = arkeoProject.get();

            //arkeoImport.selectTab(3, database.editMode)

            // Force lang to english for translatables fields if necessary
            arkeoLang.autoSetTranslationLang2FromDatas([database.description]);

            $scope.$watch('database.description.en', function(newVal, oldVal) {
                if (!newVal || (newVal && newVal == '')) {
                    $scope.lang2SelectDisabled = true;
                    $scope.publicationForm.description2.$setValidity('english_required', false)
                } else {
                    $scope.lang2SelectDisabled = false;
                    $scope.publicationForm.description2.$setValidity('english_required', true)
                }
            }, true);

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
                            contexts.push({
                                context: ctxByKey[k],
                                label: translations[k]
                            });
                        }
                    }
                    return contexts;
                });
            };

            $scope.searchUser = function(txt) {
                return $http.get('/api/users/' + txt).then(function(result) {
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
                    if (!database.description.en || (database.description.en && database.description.en.trim() == '')) {
                        arkeoService.showMessage('IMPORT_STEP4.MESSAGES.T_ERROR_BIBLIOGRAPHY_EN_TRANSLATION_CAN_T_BE_EMPTY', 'error');
                        return;
                    }
                    dbObj.authors = [];
                    dbObj.project_id = project.id;
                    angular.forEach(database.authors, function(author) {
                        dbObj.authors.push(parseInt(author.id));
                    });
                    dbObj.description = [];
                    for (var iso_code in database.description) {
                        if (database.description.hasOwnProperty(iso_code)) {
                            dbObj.description.push({
                                lang_isocode: iso_code,
                                text: database.description[iso_code]
                            });
                        }
                    }
                    dbObj.contexts = [];
                    angular.forEach(database.contexts, function(ctx) {
                        dbObj.contexts.push(ctx.context);
                    });
                    // console.log(dbObj)
                    $http.post("/api/import/step3", dbObj).then(function(result) {
                        if (result.status == 200) {
                            $state.go('arkeogis.import.step4')
                            arkeoService.showMessage("IMPORT_STEP3.MESSAGES.T_PUBLICATION_INFORMATIONS_SAVED")
                                //Restore translation lang 2 to user choice
                        } else {
                            console.log("Error sending step3");
                        }
                        arkeoLang.restoreTranslationLang();
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

            if (!angular.isDefined(arkeoImport.data)) {
                return;
            }

            //    arkeoImport.selectTab(4, database.editMode)

            // Force lang to english for translatables fields if necessary
            arkeoLang.autoSetTranslationLang2FromDatas([database.geographical_limit, database.bibliography]);

            // $scope.$watch('database.geographical_limit.en', function(newVal, oldVal) {
            //     if (!newVal || (newVal && newVal == '')) {
            //         $scope.lang2SelectDisabled = true;
            //         $scope.moreInfosForm.geographicallimit2.$setValidity('english_required', false)
            //     } else {
            //         $scope.lang2SelectDisabled = false;
            //         $scope.moreInfosForm.geographicallimit2.$setValidity('english_required', true)
            //     }
            // }, true);
            //
            // $scope.$watch('database.bibliography.en', function(newVal, oldVal) {
            //     if (!newVal || (newVal && newVal == '')) {
            //         $scope.lang2SelectDisabled = true;
            //         $scope.moreInfosForm.bibliography2.$setValidity('english_required', false)
            //     } else {
            //         $scope.lang2SelectDisabled = false;
            //         $scope.moreInfosForm.bibliography2.$setValidity('english_required', true)
            //     }
            // }, true);

            $scope.submit = function(form) {
                var dbObj = angular.copy(database);
                if (form.$valid) {
                    // if (!database.geographical_limit.en || (database.geographical_limit.en && database.geographical_limit.en.trim() == '')) {
                    //     arkeoService.showMessage('IMPORT_STEP4.MESSAGES.T_ERROR_GEOGRAPHICAL_LIMITS_EN_TRANSLATION_CAN_T_BE_EMPTY', 'error');
                    //     return;
                    // }
                    // if (!database.bibliography.en || (database.bibliography.en && database.bibliography.en.trim() == '')) {
                    //     arkeoService.showMessage('IMPORT_STEP4.MESSAGES.T_ERROR_BIBLIOGRAPHY_EN_TRANSLATION_CAN_T_BE_EMPTY', 'error');
                    //     return;
                    // }
                    dbObj.bibliography = [];
                    for (var iso_code in database.bibliography) {
                        if (database.bibliography.hasOwnProperty(iso_code)) {
                            dbObj.bibliography.push({
                                lang_isocode: iso_code,
                                text: database.bibliography[iso_code]
                            });
                        }
                    }
                    dbObj.geographical_limit = [];
                    for (var iso_code in database.geographical_limit) {
                        if (database.geographical_limit.hasOwnProperty(iso_code)) {
                            dbObj.geographical_limit.push({
                                lang_isocode: iso_code,
                                text: database.geographical_limit[iso_code]
                            });
                        }
                    }
                    console.log(dbObj);
                    if (database.editMode == true && !angular.isDefined(dbObj.import_id)) {
                        dbObj.import_id = dbObj.imports[0].id;
                    }
                    $http.post("/api/import/step4", dbObj).then(function(result) {
                        if (result.status == 200) {
                            $stateParams.database_id = database.id;
                            $state.go('arkeogis.database', {
                                    database_id: dbObj.id
                                })
                                //Restore translation lang 2 to user choice
                            arkeoService.showMessage("IMPORT_STEP4.MESSAGES.T_PUBLICATION_INFORMATIONS_SAVED")
                            arkeoLang.restoreTranslationLang();
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
