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
    ArkeoGIS.directive('arkLangSelector', function(arkeoLang) {

		return {
			restrict: 'E',
			template: '<div class="ark-lang-selector"><md-select ng-model="arkTranslationLangSelected" ng-change="changedValue()" ng-attr-ng-disabled="ngDisabled" aria-label="Lang switcher"><md-option ng-hide="arkHide.indexOf(lang.iso_code) != -1" ng-disabled="{{lang.disabled}}" ng-value="lang.iso_code" ng-repeat="lang in langs" arial-label="lang.name"><img ng-hide="!arkFlags" src="/img/blank.gif" class="flag flag-{{lang.iso_code}}" alt="{{lang.name}}"><span  ng-class="{caption: true, \'ark-flags-spacer\': arkFlags}">{{lang.name}}</span></md-option></md-select></div>',
            replace: true,
            scope: {
                ngModel: '=',
                ngDisabled: '=?',
                arkHide: '=?',
                arkFlags: '=?',
                arkSetAsTranslationLang: '=?',
                arkTranslationLangSelected: '@',
                arkTranslationLangsDisabled: '=?',
                traductionLangs: '@'
            },
			link: function(scope, element, attrs) {
                scope.langs = [];
                if (scope.arkFlags === undefined) {
                    scope.arkFlags = true;
                }
                if (scope.arkDisabled === undefined) {
                    scope.arkDisabled = [];
                }
                if (scope.arkHide === undefined) {
                    scope.arkHide = [];
                }
                if (scope.arkTranslationLangsDisabled === undefined) {
                    scope.arkTranslationLangsDisabled = [];
                }
                scope.arkTranslationLangSelected = arkeoLang.getTranslationLang(scope.arkSetAsTranslationLang);
                scope.langs = [];
                //scope.translationLangsDisabled = (angular.isDefined(attrs.arkLangsDisabled)) ? attrs.arkLangsDisabled : [];
                angular.forEach(angular.copy(arkeoLang.langs), function(lang) {
                    if (scope.arkTranslationLangsDisabled.indexOf(lang.iso_code) != -1) {
                        lang.disabled = true;
                    }
                    scope.langs.push(lang);
                });
                scope.changedValue = function() {
                    if (!scope.arkSetAsTranslationLang) {
                        return;
                    }
                    var val = parseInt(scope.arkSetAsTranslationLang);
                    if ([1,2].indexOf(val) === -1) {
                        console.log("Wrong value for ark-set-as-lang-trad. Should be 1 or 2");
                    } else {
                        arkeoLang.setTranslationLang(val, scope.arkTranslationLangSelected);
                    }
                }
			}
		};
    });
})();
