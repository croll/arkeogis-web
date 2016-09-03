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
    ArkeoGIS.service('arkeoProject', ['$cookies', '$http', '$q', function($cookies, $http, $q) {

        var self = this;

        this.chronologyColors = {};

        this.set = function(project) {
            self.project = project;
        }

        this.get = function() {
            if (!this.project.id) {
                this.project = {
                    id: 0,
                    chronologies: [],
                    layers: [],
                    databases: [],
                    characs: [],
                    geom: ''
                };
            } else {
                self.project.geom = angular.fromJson(self.project.geom);
                if (!self.project.chronologies) {
                    self.project.chronologies = [];
                }
                if (!self.project.layers) {
                    self.project.layers = [];
                }
                if (!self.project.databases) {
                    self.project.databases = [];
                }
                if (!self.project.characs) {
                    self.project.characs = [];
                }
            }
            return self.project;
        }

        this.getDetails = function() {
            var promises = [];
            // Characs
            _.each(this.project.characs, function(c) {
                promises.push($http.get('/api/characs/' + c.id + '?project_id=' + self.project.id, {
                    silent: true
                }).then(function(res) {
                    _.findKey(self.project.characs, function(charac) {
                        if (c.id == charac.id) {
                            _.merge(charac, res.data);
                        }
                    });
                }));
            });
            // Chronologies
            // Reset flattened chronologies cache
            self.chronologyColors= {};
            _.each(this.project.chronologies, function(c) {
                promises.push($http.get('/api/chronologies/' + c.id, {
                    silent: true
                }).then(function(res) {
                    _.findKey(self.project.chronologies, function(chrono) {
                        if (c.id == chrono.id) {
                            _.merge(chrono, res.data);
                            indexChronologyColors(chrono);
                        }
                    });
                }));
            });
            // Databases
            _.each(this.project.databases, function(d) {
                promises.push($http.get('/api/database/' + d.id, {
                    silent: true
                }).then(function(res) {
                    _.findKey(self.project.databases, function(db) {
                        if (res.data.translations) {
                            _merge(res.data, res.data.translations)
                            delete res.data.translations;
                        }
                        if (d.id == db.id) {
                            _.merge(db, res.data);
                        }
                    });
                }));
            });
            return $q.all(promises);
        }

        this.getChronologyColor = function(start_date, end_date) {
            return (_.has(self.chronologyColors, start_date+''+end_date)) ? self.chronologyColors[start_date+''+end_date] : 'ffffff';
        }

        var indexChronologyColors = function(currentChrono) {
            if (currentChrono.content) {
                _.each(currentChrono.content, function(c) {
                    indexChronologyColors(c)
                    if (c.color != "") {
                        self.chronologyColors[c.start_date+''+c.end_date] = c.color;
                    }
                });
            }
        }

    }]);
})();
