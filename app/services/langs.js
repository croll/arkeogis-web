/* ArkeoGIS - The Geographic Information System for Archaeologists
 * Copyright (C) 2015-2016 CROLL SAS
 *
 * Authors :
 *  Nicolas Dimitrijevic <nicolas@croll.fr>
 *  Christophe Beveraggi <beve@croll.fr>
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

(function () {
    'use strict';

    ArkeoGIS.service('arkeoLang', ['$http', '$rootScope', '$cookies', '$translate', '$q', 'arkeoService', function ($http, $rootScope, $cookies, $translate, $q, arkeoService) {

    var self = this;

    self.langs = [];
    self.userLangs = {};
    self.translationLangs = {};

    this.init = function() {
        self.setTranslationLang(1, self.getUserLang(1));
        self.setTranslationLang(2, self.getUserLang(2), true, false);
        return self.getLangs(true, true).then(function(langs) {
            self.langs = langs;
            $rootScope.langs = langs;
            $rootScope.userLangs = self.userLangs;
            $rootScope.translationLangs = self.translationLangs;
        });
    }

    this.getLangs = function(onlyActive, reload) {
        var params = {};
        if (onlyActive === true) {
            params.active = 1;
        }
        if (reload) {
            return arkeoService.wrapCall('/api/langs', params)
        } else {
            var d = $q.defer();
            d.resolve(self.langs);
            return d.promise;
        }
    };

    this.getActiveLangs = function(force) {
        return self.getLangs(true);
    };

    this.getUserLang = function(num) {
        var num = num || 1;
        if ([1,2].indexOf(num) == -1) {
            console.log("Error with getUserLang(): Wrong value lang num. Should be 1 or 2");
            return;
        }
        if (!angular.isDefined(self.userLangs[num])) {
            var iso_code = $cookies.get('arkeogis_user_lang_'+num);
            if (!iso_code && num == 1) iso_code = $translate.use() || 'en';
            if (!iso_code && num == 2) iso_code = 'en';
            self.userLangs[num] = iso_code;
        }
        return self.userLangs[num];
    };

    this.setUserLang = function(num, idOrIsoCode) {
        if ([1,2].indexOf(num) == -1) {
            console.log("Error with setUserLang(): Wrong value lang num. Should be 1 or 2");
            return false;
        }
        var iso_code = self.getIsoCode(idOrIsoCode);
        if (!iso_code) return false;
        self.userLangs[num] = iso_code;
        $cookies.put('arkeogis_user_lang_'+num, iso_code);
        if (num == 1) {
            $translate.use(iso_code);
        }
        return true;
    };

    self.getIsoCode = function(idOrIsoCode) {
        var iso_code = null;
        if (idOrIsoCode == parseInt(idOrIsoCode)) {
            angular.forEach(self.langs, function(l) {
                if (parseInt(l.id) == parseInt(idOrIsoCode)) {
                    iso_code =  l.iso_code;
                }
            });
        } else if (idOrIsoCode.match(/^[a-z]{2}$/)) {
            iso_code = idOrIsoCode;
        } else {
            console.log("Wrong parameter passed to getIsoCode()");
        }
        return iso_code;
    }

    this.setTranslationLang = function(num, idOrIsoCode, englishTranslationDone, silent) {
        if ([1,2].indexOf(num) == -1) {
            console.log("Error with setTranslationLang(): Wrong value lang num. Should be 1 or 2");
            return false;
        }
        var iso_code = self.getIsoCode(idOrIsoCode);
        if (!iso_code) {
            console.log('Unable to set translation lang');
            return false;
        }
        if (num > 1) {
            var iso_code1 = self.getUserLang(1);
            if (!englishTranslationDone && iso_code1 != 'en' && iso_code != 'en') {
                if (!silent) {
                    arkeoService.showMessage('GENERAL.INVALIDE_CHOICE.T_CAN_T_SET_OTHER_TRANSLATION_LANG_IF_NO_ENGLISH_TRANSLATION_DONE');
                }
                iso_code = 'en';
            }
        }
        self.translationLangs[num] = iso_code;
        $cookies.put('arkeogis_translation_lang_'+num, iso_code);
        return true;
    };

    this.getTranslationLang = function(num) {
        var num = num || 1;
        if ([1,2].indexOf(num) == -1) {
            console.log("Error with getTranslationLang(): Wrong value lang num. Should be 1 or 2");
            return;
        }
        if (!angular.isDefined(self.userLangs[num])) {
            self.translationLangs[num] = $cookies.get('arkeogis_translation_lang_'+num);
        }
        return self.translationLangs[num];
    };

    this.getTranslationLangs = function() {
        var iso_code1 = $cookies.get('arkeogis_translation_lang_1');
        if (!iso_code1) iso_code1 = self.getUserLang(1);
        var iso_code2 = $cookies.get('arkeogis_translation_lang_2');
        if (!iso_code2) iso_code2 = self.getUserLang(2);
        return [iso_code1, iso_code2];
    }

}]);
})();
