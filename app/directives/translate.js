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
    ArkeoGIS.directive('arkTranslate', function(arkeoLang) {

		return {
			restrict: 'A',
			template: '',
            scope: {
                ngModel: '=?',
                arkTranslations: '=',
                arkTranslateBindLang: '='
            },
			link: function(scope, element, attrs) {

                var iso_code = arkeoLang.getTranslationLang(scope.arkTranslateBindLang);
                if (iso_code) {
                    switchModel(iso_code);
                }

                scope.translationLangs = arkeoLang.translationLangs;

                scope.$watchCollection('translationLangs', function(newLangs, oldLangs) {

                    switchModel(newLangs[scope.arkTranslateBindLang], oldLangs[scope.arkTranslateBindLang]);
                });

                scope.$watch('ngModel', function(newTranslation) {
                    if (!angular.isObject(scope.arkTranslations)) {
                        return;
                    }
                    if (scope.translationLangs[scope.arkTranslateBindLang]) {
                        scope.arkTranslations[scope.translationLangs[scope.arkTranslateBindLang]] = scope.ngModel;
                    }
                });

                function switchModel(newIsoCode, oldIsoCode) {
                    if (!angular.isObject(scope.arkTranslations)) {
                        console.log("params passed to ark-translations is not an object");
                        return;
                    }
                    //scope.arkTranslations[oldIsoCode] = scope.ngModel;
                    if (!angular.isDefined(scope.arkTranslations[newIsoCode])) {
                        console.log("ark-translate directive: No translation object found for lang "+newIsoCode)
                    }
                    scope.ngModel = scope.arkTranslations[newIsoCode];
                }
			}

		};
    });
})();

(function() {
    'use strict';
    ArkeoGIS.directive('arkGetTranslation', function(arkeoLang, $translate) {

		return {
			restrict: 'A',
			template: '',
            scope: {
                arkTranslations: '='
            },
			link: function(scope, element, attrs) {

                var mainLanguage = 'en';
                var secondLanguage = 'fr';
                scope.userLangs = arkeoLang.userLangs;

                if (Object.keys(scope.userLangs).length != 0) {
                    mainLanguage = scope.userLangs[1];
                    secondLanguage = scope.userLangs[2];
                }

                switchModel({1: mainLanguage, 2: secondLanguage}, {});

                scope.$watchCollection('userLangs', function(newLangs) {
                    switchModel(newLangs)
                });

                function switchModel(newLangs) {
                    var translation = '';
                    if (angular.isObject(scope.arkTranslations)) {
                        if (angular.isDefined(scope.arkTranslations[newLangs[1]]) && scope.arkTranslations[newLangs[1]] != "") {
                            translation = scope.arkTranslations[newLangs[1]];
                        } else if (angular.isDefined(scope.arkTranslations[newLangs[2]]) && scope.arkTranslations[newLangs[2]] != "") {
                            translation = scope.arkTranslations[newLangs[2]];
                        } else {
                            translation = scope.arkTranslations['en'];
                        }
                        setVal(translation);
                    } else if (angular.isString(scope.arkTranslations)) {
                        $translate(scope.arkTranslations).then(function(t) {
                            setVal(t);
                        }, function(t) {
                            setVal(scope.arkTranslations);
                        });
                    }
                }

                function setVal(translation) {
                    if (['INPUT'].indexOf(element[0].nodeName) != -1) {
                        element.val(translation);
                    } else {
                        element.html(translation);
                    }
                }
			}
		};
    });
})();
