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

(function() {
	ArkeoGIS.service('importService', ['Upload', function(Upload) {

		var self = this;

		this.defaultTabsValues = {
			selectedIndex: 0,
			enabled: {
				1: true,
				2: false,
				3: false,
				4: false
			}
		};

		this.userPreferences = {
			firstLangId: 48, // TODO: Get it from real
			conditionsAccepted: false,
			savePreferencesAccepted: false,
			hideIntro: false 
		};

		this.importFieldsDefaultValues = {
			DatabaseLang: self.userPreferences.firstLangId, // TODO: set it accordingly
			//DatabaseName: 'Db de test',
			DatabaseName: '',
			SelectedContinent: '',
			SelectedCountries: [],
			UseGeonames: false,
			//GeographicalExtent: 'world',
			GeographicalExtent: '',
			Separator: ';',
			Echap_character: '"'
		};

		this.importFields = angular.copy(this.importFieldsDefaultValues);

		this.tabs = angular.copy(this.defaultTabsValues);

		this.data = [];

		this.reset = function() {
			self.tabs = angular.copy(self.defaultTabsValues);
			self.importFields = angular.copy(self.importFieldsDefaultValues);
			return self.tabs;
		};

		this.uploadCSV = function(file) {
			var values = angular.copy(self.importFields);
			var countriesID = [];
			self.importFields.SelectedCountries.forEach(function(sc) {
				countriesID.push(sc.value);	
			});
			values.SelectedCountries = countriesID;
			return Upload.upload({
				url: 'api/import/step1',
				data: {csv: file, infos: Upload.json(values)}
			});
		};
	}]);
})();
