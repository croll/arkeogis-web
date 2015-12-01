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
	ArkeoGIS.service('arkeoService', ['$http', '$q', function($http, $q) {

		var self = this;

		this.loadContinents = function(lang) {
			lang = lang || 'fr';
			return self.wrapCall('/api/continents', {lang: lang});
		};

        this.autocompleteCountry = function (searchTextCountry, lang) {
            if (searchTextCountry === null) {
				return [];
			}
			lang = lang || 'fr';
			var params = {
				search: searchTextCountry,
				lang: 'fr'
			};
			return self.wrapCall('/api/countries', params);
        };

        this.autocompleteCity = function (selectedCountry, searchTextCity, lang) {
            if (searchTextCity === null) {
				return [];
			}
			lang = lang || 'fr';
            var params = {
                search: searchTextCity,
				lang : lang
            };
            if (selectedCountry) {
                params.id_country = selectedCountry;
			}
			return self.wrapCall('/api/cities', params);
        };

		this.loadLangs = function() {
			return self.wrapCall('/api/langs');
		};

		this.wrapCall = function(uri, params) {
			var p = {
				responseType: "json"
			};
			if (typeof params === 'object') {
				p.params = params;
			}
			var d = $q.defer();
			$http.get(uri, p).then(function(data) {
				d.resolve(data.data);
			}, function(err) {
				d.reject(err);
			});
			return d.promise;
		};
	}]);
})();
