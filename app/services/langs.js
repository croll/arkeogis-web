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

    ArkeoGIS.service('arkeoLang', ['$http', '$cookies', '$translate', '$q', 'arkeoService', function ($http, $cookies, $translate, $q, arkeoService) {

    var self = this;

    this.init = function() {
        self.getLangs(true, true).then(function(langs) {
            self.langs = langs;
        });
    }

    this.getLangs = function(onlyActive, force) {
        var params = {};
        if (onlyActive === true) {
            params.active = 1;
        }
        if (force) {
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

    this.setLang = function(num, idOrIsoCode, isTranslation) {
        var iso_code = self.getIsoCode(idOrIsoCode);
        if (!iso_code) return false;
        self.setCookie(num, iso_code, isTranslation);
        return true;
    };

    self.getIsoCode = function(idOrIsoCode) {
        var iso_code = null;
        if (idOrIsoCode === parseInt(idOrIsoCode)) {
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

    this.setTranslationLang = function(num, idOrIsoCode, englishTranslationDone) {
        var iso_code = self.getIsoCode(idOrIsoCode);
        if (!iso_code) {
            console.log('Unable to set translation lang');
            return;
        }
        if (num > 1) {
            var iso_code1 = self.getLang(1);
            if (!englishTranslationDone && iso_code1 != 'en' && iso_code2 != 'en') {
                arkeoService.showMessage('GENERAL.INVALIDE_CHOICE.T_CAN_T_SET_OTHER_TRANSLATION_LANG_IF_NO_ENGLISH_TRANSLATION_DONE');
            }
        }
        self.setLang(num, idOrIsoCode, true);
    };

    this.setCookie = function(num, iso_code, isTranslation) {
        if (isTranslation) {
            $cookies.put('arkeogis_translation_lang_'+num, iso_code);
        } else {
            if (num == 1) {
                $translate.use(iso_code);
            }
            $cookies.put('arkeogis_lang_'+num, iso_code);
        }
    }

    this.getLang = function(num) {
        var num = num || 1;
        var iso_code = $cookies.get('arkeogis_lang_'+num);
        if (!iso_code) iso_code = $translate.use() || 'en';
        return iso_code;
    };

    this.getTranslationLangs = function() {
        var iso_code1 = $cookies.get('arkeogis_translation_lang_1');
        if (!iso_code1) iso_code1 = self.getLang(1);
        var iso_code2 = $cookies.get('arkeogis_translation_lang_2');
        if (!iso_code2) iso_code2 = self.getLang(2);
        if (iso_code1 != 'en') iso_code2 = 'en';
        return [iso_code1, iso_code2];
    }

}]);
})();
