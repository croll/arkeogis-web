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
  ArkeoGIS.service('importService', ['Upload', '$resource', 'login', function(Upload, $resource, login) {

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
      conditionsAccepted: true,
      hideIntro: true
    };

    this.refreshUserInfos = function() {
        self.user = login.user;
        self.importFields.DatabaseLang = self.user.first_lang_id;
    }

    // Step 1
    this.importFieldsDefaultValues = {
      DatabaseLang: '',
      //DatabaseName: '',
      name: 'Db de test',
      SelectedContinent: '',
      SelectedCountries: [],
      UseGeonames: false,
      //GeographicalExtent: '',
      GeographicalExtent: 'world',
      Separator: ';',
      EchapCharacter: '"'
    };

    this.importFields = angular.copy(this.importFieldsDefaultValues);

    // Step 3
    this.publicationFieldsDefaultValues = {
      Authors: [],
      Type: '',
      CreationDate: '',
      License: '',
      Subject: '',
      Context: '',
      ScaleResolution: '',
      State: '',
      Description: [{
        iso_code: '',
        value: ''
      }, {
        iso_code: '',
        value: ''
      }]

    };

    this.publicationFields = angular.copy(this.publicationFieldsDefaultValues);

    // Step 4
    this.moreInfosFieldsDefaultValues = {
      Struture: '',
      Source: '',
      Identifier: '',
      Contributor: '',
      Relations: '',
      SourceUrl: '',
      SourceCreationDate: '',
      ContextDescription: '',
      GeographicalExtent: [{
        iso_code: '',
        value: ''
      }, {
        iso_code: '',
        value: ''
      }],
      Bibliography: [{
        iso_code: '',
        value: ''
      }, {
        iso_code: '',
        value: ''
      }]
    };

    this.moreInfosFields = angular.copy(this.moreInfosFieldsDefaultValues);

    // Data reset
    this.reset = function() {
      self.tabs = angular.copy(self.defaultTabsValues);
      self.importFields = angular.copy(self.importFieldsDefaultValues);
      self.publicationFields = angular.copy(self.publicationFieldsDefaultValues);
      self.moreInfosFields = angular.copy(self.moreInfosFieldsDefaultValues);
      return self.tabs;
    };

    // Tabs
    this.tabs = angular.copy(this.defaultTabsValues);
    this.data = [];

    // CSV upload
    this.uploadCSV = function(file) {
      var values = angular.copy(self.importFields);
      var countriesID = [];
      self.importFields.SelectedCountries.forEach(function(sc) {
        countriesID.push(sc.geonameid);
      });
      values.SelectedCountries = countriesID;
      values.SelectedContinents = [values.SelectedContinent]
      delete values.SelectedContinent;
      console.log(values);
      return Upload.upload({
        url: 'api/import/step1',
        data: {
          csv: file,
          infos: Upload.json(values)
        }
      });
    };

  }]);
})();
