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
    self.userLangs = [];
    self.translationLangs = [];

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

    this.getLangByIsoCode = function(isocode) {
        var l = null;
        angular.forEach(self.langs, function(lang) {
                if (lang.iso_code == isocode) {
                    l = lang;
                }
        });
        return l;
    }

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

    this.setUserLang = function(num, iso_code) {
        if ([1,2].indexOf(num) == -1) {
            console.log("Error with setUserLang(): Wrong value lang num. Should be 1 or 2");
            return false;
        }
        self.userLangs[num] = iso_code;
        $cookies.put('arkeogis_user_lang_'+num, iso_code);
        if (num == 1) {
            $translate.use(iso_code);
        }
        return true;
    };

    this.setTranslationLang = function(num, iso_code) {
        if ([1,2].indexOf(num) == -1) {
            console.log("Error with setTranslationLang(): Wrong value lang num. Should be 1 or 2");
            return false;
        }
        if (!iso_code) {
            console.log('Unable to set translation lang');
            return false;
        }
        if (num > 1) {
            var iso_code1 = self.getUserLang(1);
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
    };

    this.autoSetTranslationLang2FromDatas = function(aDatas) {
        var ret = false;
        if (!angular.isArray(aDatas) && !angular.isObject(aDatas)) {
            console.error("arkeoLang.autoSetTranslationLangFromData: data passed is not valid");
            return false;
        }
        if (angular.isObject(aDatas) && !angular.isArray(aDatas)) {
            aDatas = [aDatas];
        }
        if (this.getTranslationLang(1) == 'en') {
            return false;
        }
        angular.forEach(aDatas, function(d) {
            if (!angular.isDefined(d) || !d) {
                self.setTranslationLang(2, 'en');
                ret = true;
                return;
            }
            if (!angular.isDefined(d.en) || (angular.isDefined(d.en) && d.en.trim() == '')) {
                self.setTranslationLang(2, 'en');
                ret = true;
                return;
            }
        });
        return ret;
    };

    this.restoreTranslationLang = function() {
        self.setTranslationLang(self.getUserLang(2));
    }

    // map an sql translation object to a js translation object
    // exemple, input is :
    // [ {group_id: 1, name: "Administrator", isocode: "en"}, {group_id: 1, name: "Administrateur", isocode: "fr"} ]
    // become :
    // { 'en': {group_id: 1, name: "Administrator", isocode: "en"}, 'fr': {group_id: 1, name: "Administrateur", isocode: "fr"}}
    this.mapSqlTranslations = function(a, fieldname) {
        var b={};
        a.forEach(function(el) {
            if ('lang_isocode' in el)
                el.isocode = el.lang_isocode;
            b[el.isocode] = el[fieldname];
        });
        return b;
    };

    // return the translation using current lang of a mapped translation object like :
    // { fr: 'Traduction', en: 'Translation', ... }
    this.getMappedTranslation = function(translations) {
        var latestisocode='';
        for (var k in self.userLangs) {
            var isocode = self.userLangs[k];
            if (isocode in translations)
                return translations[isocode];
            latestisocode=isocode;
        }

        if ('D' in translations)
            return translations['D'];

        if ('D ' in translations)
            return translations['D '];

        if (lastestisocode) // no translation found... return any translation !
            return translations[lastestisocode];

        console.error("no translation found !", translations);
        return "[error: no translation]";
    };

}]);
})();
