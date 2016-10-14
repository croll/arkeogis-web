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
    'use strict';

    ArkeoGIS.service('arkeoQuery', ['$http', 'arkeoService', function($http, arkeoService) {

        var self = this,
            alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            queries = {},
            cachedSites = {},
            currentNum = -1,
            queriesDoneNum = -1;

        this.current = undefined;

        this.do = function(query) {
            return $http.post("/api/map/search", query.params).then(function(result) {
                query.data = result.data;
                query.done = true;
                queriesDoneNum++;
                return query;
            });
        };

        this.exportcsv = function(query) {
            return $http.post("/api/map/searchtocsv", query.params);
        };

        this.getSite = function(id) {
            if (angular.isDefined(cachedSites[id])) {
                return cachedSites[id];
            }
            return $http.get("/api/site/"+id).then(function(result) {
                cachedSites[result.data.id] = result.data;
                return result.data;
            }, function(err) {
                arkeoService.fieldErrorDisplay(err)
                console.error(err);
            });
        };

        this.add = function(params, name) {
            currentNum++;
            this.current = {
                name: name,
                num: currentNum,
                letter: alphabet[currentNum],
                data: null,
                params: params,
                done: false,
                sites: {}, // Store site details once
                markersByDatabase: {}
            };
            queries[alphabet[currentNum]] = this.current;
            return this.current;
        };

        this.setData = function(data) {
            this.current.data = data;
        };

        this.get = function(id) {
            var ret = null,
                prop = (typeof(id) == 'string') ? 'letter' : 'num';
            _.forOwn(queries, function(q, k) {
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

        this.setCurrent = function(query) {
            this.current = query;
        }

        this.getNumQueries = function(onlyDone) {
            return (onlyDone) ? queriesDoneNum+1 : currentNum+1;
        }

        this.delete = function(id) {
            var prop = (typeof(id) == 'string') ? 'letter' : 'num';
            var c = this.getCurrent(),
            n = 0;
            _.forOwn(queries, function(q, k) {
                if (q[prop] == id) {
                    if (c.letter == q.letter) {
                        self.setCurrent(self.getLastQuery());
                    }
                    delete queries[q.letter]
                }
                n++;
            });
        };

        this.getLastQuery = function() {
            _.forOwn(_.cloneDeep(queries).reverse(), function(q, k) {
                if (_.has(q, 'letter')) {
                    return q;
                }
            });
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
