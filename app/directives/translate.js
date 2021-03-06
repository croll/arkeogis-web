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
    ArkeoGIS.directive('arkTranslate', ['arkeoLang', function(arkeoLang) {

		return {
			restrict: 'A',
			template: '',
            scope: {
                ngModel: '=?',
                arkTranslations: '=',
                arkTranslateBindLang: '='
            },
			link: function(scope, element, attrs) {

                // preliminary checks

                if (!angular.isObject(scope.arkTranslations))
                    scope.arkTranslations={};

                var iso_code = arkeoLang.getTranslationLang(scope.arkTranslateBindLang);
                if (iso_code) {
                    switchModel(iso_code);
                }

                scope.translationLangs = arkeoLang.translationLangs;

                scope.$watchCollection('translationLangs', function(newLangs, oldLangs) {
                    switchModel(newLangs[scope.arkTranslateBindLang]);
                });

                scope.$watch('ngModel', function(newTranslation) {
                    if (newTranslation === undefined) return;
                    if (!angular.isObject(scope.arkTranslations)) {
                        scope.arkTranslations={};
                    }
                    if (scope.translationLangs[scope.arkTranslateBindLang]) {
                        scope.arkTranslations[scope.translationLangs[scope.arkTranslateBindLang]] = scope.ngModel;
                    }
                });

                scope.$watch('arkTranslations', function(newTranslations) {
                    switchModel(scope.translationLangs[scope.arkTranslateBindLang]);
                });

                function switchModel(newIsoCode) {
                    if (!angular.isObject(scope.arkTranslations)) {
                        console.log("params passed to ark-translations is not an object : ", scope.arkTranslations);
                        return;
                    }
                    //scope.arkTranslations[oldIsoCode] = scope.ngModel;
                    // if (!angular.isDefined(scope.arkTranslations[newIsoCode])) {
                    //     console.log("ark-translate directive: No translation object found for lang "+newIsoCode)
                    // }
                    scope.ngModel = scope.arkTranslations[newIsoCode];
                }
			}

		};
    }]);
})();

(function() {
    'use strict';
    ArkeoGIS.directive('arkGetTranslation', ['arkeoLang', '$translate', '$parse', '$interpolate', function(arkeoLang, $translate, $parse, $interpolate) {

		return {
			restrict: 'A',
			template: '',
            scope: {
                arkTranslations: '=?',
                arkForceLang: '=?'
            },
			link: function(scope, element, attrs) {

                var mainLanguage = 'en';
                var secondLanguage = 'fr';
                scope.userLangs = arkeoLang.userLangs;

                if (Object.keys(scope.userLangs).length != 0) {
                    mainLanguage = scope.userLangs[1];
                    secondLanguage = scope.userLangs[2];
                }

                if (scope.arkForceLang) {
                    mainLanguage = scope.arkForceLang;
                    if (angular.isDefined(scope.userLangs) && angular.isObject(scope.userLangs) && scope.userLangs[1]) {
                        secondLanguage = scope.userLangs[1];
                    } else {
                        secondLanguage = 'en';
                    }
                }

                switchModel({1: mainLanguage, 2: secondLanguage}, {});

                scope.$watchCollection('userLangs', function(newLangs) {
                    switchModel(newLangs)
                });

                function switchModel(newLangs) {
                    var translation = '';
                    if (angular.isObject(scope.arkTranslations)) {
                        setVal(searchTranslation(scope.arkTranslations, newLangs));
                    } else if (angular.isString(scope.arkTranslations)) {
                        $translate(scope.arkTranslations).then(function(t) {
                            setVal(t);
                        }, function(t) {
                            setVal(scope.arkTranslations);
                        });
                    } else {
                        var str = $interpolate(element.text())(scope);
                        if (str) {
                            setVal(searchTranslation(angular.fromJson(str), newLangs));
                        }
                        // console.log(angular.fromJson($interpolate(element.text())(scope)));
                    }
                }

                function searchTranslation(transObj, newLangs) {
                    var translation = '';
                        if (angular.isDefined(transObj[newLangs[1]]) && transObj[newLangs[1]] != "") {
                            translation = transObj[newLangs[1]];
                        } else if (angular.isDefined(transObj[newLangs[2]]) && transObj[newLangs[2]] != "") {
                            translation = transObj[newLangs[2]];
                        } else if (angular.isDefined(transObj['en'])) {
                            translation = transObj['en'];
                        } else if (angular.isDefined(transObj['D'])){
                            translation = transObj['D'];
                        } else {
                            // console.error("ark-get-translation: No translation found !");
                            translation = '';
                        }
                        return translation;
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
    }]);

    ArkeoGIS.filter('arkTranslate', ['arkeoLang', function(arkeoLang) {
        return function(src) {
            if (_.has(src, arkeoLang.userLangs[1]))
                return src[arkeoLang.userLangs[1]];
            else if (_.has(src, arkeoLang.userLangs[2]))
                return src[arkeoLang.userLangs[2]];
            else if (_.has(src, 'en'))
                return src['en'];
            else if (_.has(src, 'fr'))
                return src['fr'];
            else if (_.has(src, 'D'))
                return src['D'];
            else return "";
        }
    }]);

})();
