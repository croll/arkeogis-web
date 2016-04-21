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
    ArkeoGIS.service('arkeoService', ['$http', '$q', '$cookies', '$translate', function($http, $q, $cookies, $translate) {

        var self = this;

        this.theme = 'grey';

		// automatically set message error from server on form fields
		// - form is the $scope.form of the form :)
		// - error is the error object that come from the server
		// - startswith is the starting path (it must starts with it, and will be removed)
		// to work, you must have something like this in your html form for each fields :
		//  <div ng-messages="myform.myfieldname.$error" role="alert">
		//   <div ng-if="myform.myfieldname.$error.server">{{ myform.myfieldname.$error.server | translate }}</div>
		//  </div>
        // You also must name the input field with name="myfieldname"
        // And probably want to add in it something like this : ng-change="myform.myfieldname.$setValidity('server', true)"
        this.setFormErrorFromServer = function(form, error, startswith) {
            if (form == undefined) {
                console.error("call to setFormErrorFromServer with form = undefined !");
                return;
            }
            if (error.field_path.startsWith(startswith)) {
                var path = error.field_path.substr(startswith.length);
                console.log("field error from server : ", path, error.error_string)
                var elems = path.split(".");
                var obj = form;
                for (var i = 0; i < elems.length; i++) {
                    if (!(elems[i] in obj)) {
                        console.error("there is no form path : "+path+" (no '"+elems[i]+"' field)");
                        return;
                    }
                    obj = obj[elems[i]];
                }
                obj.$error.server = error.error_string;
            } else {
                console.log("error ignored: ", error.field_path, ", need to starts with: ", startswith);
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
        // You also must name the input field with name="myfieldname"
        // And probably want to add in it something like this : ng-change="myform.myfieldname.$setValidity('server', true)"
        this.setFormErrorsFromServer = function(form, errors, startswith) {
			errors.forEach(function(error) {
				self.setFormErrorFromServer(form, error, startswith);
			})
		};

        this.loadContinents = function(lang) {
            return self.wrapCall('/api/continents');
        };

        this.autocompleteCountry = function(searchTextCountry, lang) {
            if (searchTextCountry === null) {
                return [];
            }
            var params = {
                search: searchTextCountry,
                limit: 25
            };
            return self.wrapCall('/api/countries', params/*, {
                geonameid: 'value',
                name: 'display',
                name_ascii: 'name_ascii' // not sure this is used somewhere
            }*/);
        };

        this.autocompleteCity = function(selectedCountry, searchTextCity, lang) {
            if (searchTextCity === null) {
                return [];
            }
            var params = {
                search: searchTextCity,
                limit: 25
            };
            if (selectedCountry) {
                params.id_country = selectedCountry;
            }
            return self.wrapCall('/api/cities', params/*, {
                geonameid: 'value',
                name: 'display'
            }*/);
        };

        this.autocompleteCompany = function(searchTextCompany, lang) {
            if (searchTextCompany === null) {
                return [];
            }
            var params = {
                search: searchTextCompany
            };
            return self.wrapCall('/api/companies', params);
        };

        this.loadLangs = function() {
            return self.wrapCall('/api/langs', {});
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

        this.getCity = function(id_city, lang) {
            return self.wrapCall('/api/cities/'+id_city)
        };

        this.getCompany = function(id, lang) {
            return self.wrapCall('/api/companies/'+id)
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

        this.getLang1 = function() {
            var iso_code = $cookies.get('arkeogis_lang_2');
            if (!iso_code) iso_code = 'en';
            return iso_code;
        };

        this.getLangs = function() {
            return this.getLang1() + "," + this.getLang2();
        };
    }]);
})();
