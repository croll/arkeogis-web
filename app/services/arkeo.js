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

		// automatically set message error from server on form fields
		// - form is the $scope.form of the form :)
		// - error is the error object that come from the server
		// - startswith is the starting path (it must starts with it, and will be removed)
		// to work, you must have something like this in your html form for each fields :
		//  <div ng-messages="myform.myfieldname.$error" role="alert">
		//   <div ng-if="myform.myfieldname.$error.server">{{ myform.myfieldname.$error.server | translate }}</div>
		//  </div>
        this.setFormErrorFromServer = function(form, error, startswith) {
            if (error.field_path.startsWith(startswith)) {
                var path = error.field_path.substr(startswith.length);
                var elems = path.split(".");
                var obj = form;
                for (var i = 0; i < elems.length; i++) {
                    obj = obj[elems[i]];
                }
                obj.$error.server = error.error_string;
            }
        };

		// automatically set message errorS from server on form fields
		// - form is the $scope.form of the form :)
		// - error is the error object that come from the server
		// - startswith is the starting path (it must starts with it, and will be removed)
		// to work, you must have something like this in your html form for each fields :
		//  <div ng-messages="myform.myfieldname.$error" role="alert">
		//   <div ng-if="myform.myfieldname.$error.server">{{ myform.myfieldname.$error.server | translate }}</div>
		//  </div>
        this.setFormErrorsFromServer = function(form, errors, startswith) {
			errors.forEach(function(error) {
				self.setFormErrorFromServer(form, error, startswith);
			})
		};

        this.loadContinents = function(lang) {
            lang = lang || 'fr';
            return self.wrapCall('/api/continents', {
                lang: lang
            });
        };

        this.autocompleteCountry = function(searchTextCountry, lang) {
            if (searchTextCountry === null) {
                return [];
            }
            lang = lang || 'fr';
            var params = {
                search: searchTextCountry,
                lang: 'fr',
                limit: 25
            };
            return self.wrapCall('/api/countries', params, {
                geonameid: 'value',
                name: 'display',
                name_ascii: 'name_ascii' // not sure this is used somewhere
            });
        };

        this.autocompleteCity = function(selectedCountry, searchTextCity, lang) {
            if (searchTextCity === null) {
                return [];
            }
            lang = lang || 'fr';
            var params = {
                search: searchTextCity,
                lang: lang,
                limit: 25
            };
            if (selectedCountry) {
                params.id_country = selectedCountry;
            }
            return self.wrapCall('/api/cities', params, {
                geonameid: 'value',
                name: 'display'
            });
        };

        this.autocompleteCompany = function(searchTextCompany, lang) {
            if (searchTextCompany === null) {
                return [];
            }
            lang = lang || 'fr';
            var params = {
                search: searchTextCompany,
                lang: 'fr'
            };
            return self.wrapCall('/api/companies', params);
        };

        this.loadLangs = function() {
            return self.wrapCall('/api/langs', {}, {});
        };

        // call rest list
        this.wrapCall = function(uri, params, remap) {
            var self = this;
            var p = {
                responseType: "json"
            };
            if (typeof params === 'object') {
                p.params = params;
            }
            var d = $q.defer();
            $http.get(uri, p).then(function(data) {
                if (typeof remap === 'object')
                    data.data = self.remap(remap, data.data);
                d.resolve(data.data);
            }, function(err) {
                d.reject(err);
            });
            return d.promise;
        };

        // remap data array of object
        // exemple: remap({id: 'value', name: 'display'}, [ { id: 1, name: 'Albert'}, { id: 2, name: 'Alfred' }])
        // will return : [ { value: 1, display: 'Albert'}, { value: 2, display: 'Alfred'}]
        this.remap = function(remap, data) {
            var newdata = [];
            for (var i = 0; i < data.length; i++) {
                newdata[i] = {};
                for (var k in remap) {
                    var nk = remap[k];
                    newdata[i][nk] = data[i][k];
                }
            }
            return newdata;
        }
    }]);
})();
