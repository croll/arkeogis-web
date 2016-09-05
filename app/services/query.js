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
    ArkeoGIS.service('arkeoQuery', ['$http', 'arkeoService', function($http, arkeoService) {

        var self = this,
            alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            queries = [],
            currentNum = -1;

        this.current = undefined;

        this.do = function(params) {
            $http.post("/api/map/search", params).then(function(result) {
                self.add(result.data, params);
            }, function(err) {
                arkeoService.fieldErrorDisplay(err)
                console.error(err);
            });
        };

        this.getSite = function(id) {
            if (angular.isDefined(self.current.sites[id])) {
                return self.current.sites[id];
            }
            return $http.get("/api/site/"+id).then(function(result) {
                self.current.sites[result.data.id] = result.data;
                return result.data;
            }, function(err) {
                arkeoService.fieldErrorDisplay(err)
                console.error(err);
            });
        };

        this.add = function(data, params) {
            currentNum++;
            this.current = {
                num: currentNum,
                letter: alphabet[currentNum],
                params: params,
                data: data,
                done: false,
                sites: {}, // Store site details once
                markersByDatabase: {},
                markerClusters: {} // object keys: dbID and cluster
            };
            queries[currentNum] = this.current;
        };

        this.get = function(id) {
            var ret = null,
                prop = (typeof(id) == 'string') ? 'letter' : 'num';
            angular.each(queries, function(q) {
                if (q[prop] == id) {
                    ret = q;
                    return;
                }
            });
            return ret;
        };

        this.getCurrent = function() {
            return this.current;
        }

        this.getNumQueries = function() {
            return currentNum+1;
        }

        this.delete = function(id) {
            this.get(id) = {};
        };

        this.getQueries = function() {
            return queries;
        };

        this.reset = function() {
            currentNum = -1;
            queries = [];
        };

    }]);
})();
