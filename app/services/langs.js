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

    this.getLangs = function(onlyActive) {
        var params = {};
        if (onlyActive === true) {
            params.active = 1;
        }
       return arkeoService.wrapCall('/api/langs', params)
    };

    this.getActiveLangs = function() {
        return self.getLangs(true);
    };

    this.setLang1 = function(iso_code) {
        $translate.use(iso_code);
        $cookies.put('arkeogis_lang_1', iso_code);
    };

    this.setLang2 = function(iso_code) {
        $cookies.put('arkeogis_lang_2', iso_code);
    };

    this.getLang1 = function() {
        var iso_code = $cookies.get('arkeogis_lang_1');
        if (!iso_code) iso_code = $translate.use();
        if (!iso_code) iso_code = 'en';
        return iso_code;
    };

    this.getLang2 = function() {
        var iso_code = $cookies.get('arkeogis_lang_2');
        if (!iso_code) iso_code = 'en';
        return iso_code;
    };

}]);
})();
