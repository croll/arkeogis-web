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

(function () {
    'use strict';
    ArkeoGIS.service('Translates', ['$http', '$q', function ($http, $q) {
        var self=this;

        this.sortByKeys = function(unordered) {
            var ordered = {};
            Object.keys(unordered).sort().forEach(function(key) {
                ordered[key] = unordered[key];
            });
            return ordered;
        };

        this.twinload = function(lang, domain) {
            var p_server = $http.get("/api/translates", {
                params: {lang: lang, domain: domain, side: "server"}
            });
            var p_web = $http.get("/api/translates", {
                params: {lang: lang, domain: domain, side: "web"}
            });

            return $q.all([p_server, p_web]).then(function(ret) {
                var server = ret[0].data;
                var web = ret[1].data;

                function reccop(dst, src, side) {
                    for (var k in src) {
                        if (k[0] >= 'A' && k[0] <= 'Z') {
                            if (typeof(src[k]) == "object") {
                                if (typeof(dst[k]) != "object") {
                                    dst[k] = {};
                                }
                                reccop(dst[k], src[k], side);
                            } else {
                                dst[k]={
                                    str: src[k],
                                    side: side
                                }
                            }
                        }
                    }
                    dst=self.sortByKeys(dst);
                }

                var mix={};
                reccop(mix, server, "server");
                reccop(mix, web, "web");

                return mix;
            });
        };

        this.twinsave = function(lang, domain, translates) {
            var server={};
            var web={};

            function reccop(dst_server, dst_web, src) {
                var res={
                    server: 0,
                    web: 0
                }
                for (var k in src) {
                    console.log("using: ", k);
                    if (k[0] >= 'A' && k[0] <= 'Z') {
                        if (typeof(src[k]) == "object" && typeof(src[k]['str']) == "undefined") {
                            if (typeof(dst_server[k]) != "object") {
                                dst_server[k] = {};
                            }
                            if (typeof(dst_web[k]) != "object") {
                                dst_web[k] = {};
                            }
                            var r=reccop(dst_server[k], dst_web[k], src[k]);
                            if (r.server == 0)
                                delete dst_server[k];
                            if (r.web == 0)
                                delete dst_web[k];
                        } else {
                            console.log("adding: ", src[k]['str']);
                            res[src[k].side]++;
                            if (src[k].side == "server")
                                dst_server[k]=src[k]['str'];
                            else if (src[k].side == "web")
                                dst_web[k]=src[k]['str'];
                            else console.error("side unknown :", src[k].side);
                        }
                    }
                }
                return res;
            }

            reccop(server, web, translates);

            var p_server = $http.put("/api/translates", server, {
                params: {lang: lang, domain: domain, side: "server"}
            });
            var p_web    = $http.put("/api/translates", web, {
                params: {lang: lang, domain: domain, side: "web"}
            });

            return $q.all([p_server, p_web]);
        };

        this.domains = function() {
            return $http.get("/api/translates", {
                params: {lang: "en", side: "*"}
            }).then(function(ret) {
                return ret.data.sort();
            })
        };


/*
        return $resource('/api/translates:id', {
            id: '@id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: true
            },
            get: {
                isArray: false
            }
        });
*/
    }]);
})();
