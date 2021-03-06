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
    'use strict';
    ArkeoGIS.service('arkeoImport', ['Upload', 'login', function(Upload, login) {

        var self = this;

        this.defaultTabsValues = {
            selectedIndex: 0,
            enabled: {
                1: true,
                2: false,
                3: false,
                4: false,
                5: false
            }
        };

        this.importChoicesDefaultValues = {
            UseGeonames: false,
            Separator: ";",
            EchapCharacter: "\""
        }

        this.userPreferences = {
            conditionsAccepted: true,
            hideIntro: true
        };

        // Tabs
        this.tabs = angular.copy(this.defaultTabsValues);
        this.data = [];

        this.enableAllTabs = function() {
            self.tabs = {
                enabled: {
                    1: true,
                    2: true,
                    3: true,
                    4: true,
                    5: true
                }
            }
        }

        this.disableReportTab = function() {
            self.tabs.enabled[2] = false;
        }

        this.enableReportTab = function() {
            self.tabs.enabled[2] = true;
        }

        this.nextTab = function() {
            console.log(self.tabs.selectedIndex);
            self.tabs.selectedIndex++;
        }

        this.selectTab = function(num, editMode) {
            console.log("ICI");
            if (!editMode) {
                self.tabs.selectedIndex = num;
                self.tabs.enabled[num] = true;
                for (var i = num + 1; i < 5; i++) {
                    self.tabs.enabled[i] = false;
                }
            } else if (self.tabs.enabled[2] == true) {
                self.tabs.selectedIndex = num - 1;
            } else {
                self.tabs.selectedIndex = num - 1;
            }
        }

        // CSV upload
        this.uploadCSV = function(file, choices, datas) {

            var values = angular.extend(choices, datas);
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
