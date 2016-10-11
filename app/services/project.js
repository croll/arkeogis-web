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

    ArkeoGIS.service('arkeoProject', ['$cookies', '$http', '$q', 'arkeoLang', function($cookies, $http, $q, arkeoLang) {

        var self = this;
        var chronologyCacheByDates = {};
        var chronologyCacheByStartDate = {};
        var chronologyCacheByEndDate = {};

        this.set = function(project) {
            self.project = project;
        }

        this.get = function() {
            if (!this.project || !this.project.id) {
                this.project = {
                    id: 0,
                    chronologies: [],
                    layers: [],
                    databases: [],
                    characs: [],
                    geom: ''
                };
            } else {
                if (!angular.isObject(self.project.geom)) {
                    self.project.geom = angular.fromJson(self.project.geom);
                }
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

                    // set parent
                    function setRootRecurse(charac, parent) {
                        charac.parent = parent;
                        if (_.has(charac, 'content'))
                            _.each(charac.content, function(subcharac) {
                                setRootRecurse(subcharac, charac);
                            })
                    }
                    setRootRecurse(res.data, null);

                    _.each(self.project.characs, function(charac) {
                        if (c.id == charac.id) {
                            _.merge(charac, res.data);
                        }
                    });

                    // Project geojson
                    self.project.geojson = {
                        type: 'Feature',
                        geometry: (!angular.isObject(self.project.geom)) ? angular.fromJson(self.project.geom) : self.project.geom,
                        properties: {
                            name: self.project.name
                        }
                    }
                }));
            });
            // Chronologies
            // Reset flattened chronologies cache
            chronologyCacheByDates = {};
            chronologyCacheByStartDate = {};
            chronologyCacheByEndDate = {};
            chronologies_by_id=null;
            _.each(this.project.chronologies, function(c) {
                promises.push($http.get('/api/chronologies/' + c.id, {
                    silent: true
                }).then(function(res) {
                    _.each(self.project.chronologies, function(chrono) {
                        if (c.id == chrono.id) {
                            _.merge(chrono, res.data);
                            cacheChronologiesByDates(chrono);
                            cacheChronologiesByStartDate(chrono);
                            cacheChronologiesByEndDate(chrono);
                        }
                    });
                }));
            });
            // Databases
            _.each(this.project.databases, function(d) {
                promises.push($http.get('/api/database/' + d.id, {
                    silent: true
                }).then(function(res) {
                    _.each(self.project.databases, function(db) {
                        if (res.data.translations) {
                            _.merge(res.data, res.data.translations)
                            delete res.data.translations;
                        }
                        if (d.id == db.id) {
                            _.merge(db, res.data);
                        }

                        // make a string of authors array of objects
                        db.author = Array.isArray(db.authors) ? db.authors.map(function(elem){ return elem.fullname }).join(",") : '';
                    });
                }));
            });
            _.each(this.project.layers, function(l) {
                // Get wms layers list and shp layers list

                promises.push($http.get('/api/layer', {
                    params: {
                        type: l.type,
                        id: l.id
                    },
                    silent: true
                }).then(function(res) {
                    _.each(self.project.layers, function(lay) {
                        if (res.data.infos) {
                            _.merge(res.data, res.data.infos)
                            delete res.data.infos;
                        }
                        if (res.data.translations) {
                            _.merge(res.data, res.data.translations)
                            delete res.data.translations;
                        }
                        if (l.id == lay.id) {
                            _.merge(lay, res.data);
                        }
                    });
                }));
            });
            // Layers WM(T)S
            return $q.all(promises);
        }

        this.getChronologyByDates = function(start_date, end_date) {
            if (start_date == end_date) return null;
            return (_.has(chronologyCacheByDates, start_date+''+end_date)) ? chronologyCacheByDates[start_date+''+end_date] : null;
        }

        this.getChronologyByStartDate = function(start_date) {
            return (_.has(chronologyCacheByStartDate, start_date)) ? chronologyCacheByStartDate[start_date] : null;
        }

        this.getChronologyByEndDate = function(end_date) {
            return (_.has(chronologyCacheByEndDate, end_date)) ? chronologyCacheByEndDate[end_date] : null;
        }

        var cacheChronologiesByDates = function(currentChrono) {
            if (currentChrono.content) {
                _.each(currentChrono.content, function(c) {
                    cacheChronologiesByDates(c);
                });
            }
            chronologyCacheByDates[currentChrono.start_date+''+currentChrono.end_date] = currentChrono;
        }

        var cacheChronologiesByStartDate = function(currentChrono) {
            if (currentChrono.content) {
                _.each(currentChrono.content, function(c) {
                    cacheChronologiesByStartDate(c);
                });
            }
            chronologyCacheByStartDate[currentChrono.start_date] = currentChrono;
        }

        var cacheChronologiesByEndDate = function(currentChrono) {
            if (currentChrono.content) {
                _.each(currentChrono.content, function(c) {
                    cacheChronologiesByEndDate(c);
                });
            }
            chronologyCacheByEndDate[currentChrono.end_date] = currentChrono;
        }

		var chronologies_by_id = null;
        this.getChronologyById = function(id) {
			if (chronologies_by_id == null) {
				chronologies_by_id = {};
				var chronologiesAll = self.project.chronologies;
				function fillCache(content) {
					_.each(content, function(chronology) {
						chronologies_by_id[parseInt(chronology.id)]=chronology;
						if (_.has(chronology, 'content'))
							fillCache(chronology.content);
					});
				}
				fillCache(chronologiesAll);
			}
			return chronologies_by_id[parseInt(id)];
		}

		// cache characs by id
		var characs_by_id = null;
		this.getCharacById = function(id) {
			if (characs_by_id == null) {
				characs_by_id = {};
				var characsAll = self.project.characs;
                function buildCharacHierarchy(charac, path) {
                    var path = path || [];
                    if (angular.isObject(charac.parent)) {
                        buildCharacHierarchy(charac.parent, path);
                    }
                    path.push(charac.name[arkeoLang.getUserLang()]);
                    return path;
                }
				function fillCache(content) {
					_.each(content, function(charac) {
                        charac.hierarchy = buildCharacHierarchy(charac);
						characs_by_id[parseInt(charac.id)]=charac;
						if (_.has(charac, 'content'))
							fillCache(charac.content);
					});
				}
				fillCache(characsAll);
	   	    }
			return characs_by_id[parseInt(id)];
		}

        //get charac root
        this.getCharacRoot = function(charac) {
            while(charac.parent) {
                charac=charac.parent;
            }
            return charac;
        }

        this.reset = function() {
            this.project = {
                id: false,
            };
            this.get();
        }
    }]);
})();
