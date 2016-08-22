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
    ArkeoGIS.service('arkeoDatabase', ['$q', '$resource', '$translate', 'login', function($q, $resource, $translate, login) {

        var self = this;

        /*
        this.defaultValues = {
            id: null,
            name: "",
            scale_resolution: "",
            geographical_extent: "world",
            type: "undefined",
            owner: null,
            declared_creation_date: "",
            data_set: "",/lo
            identifier: "",
            source: "",
            source_url: "",
            editor : "",
            contributor: "",
            default_language: null,
            relation: "",
            coverage: "",
            copyright: "",
            state: "undefined",
            license_id: 0,
            context: "undefined",
            context_description: "",
            subject: "",
            published: false,
            soft_deleted: false,
            created_at: null,
            updated_at: null,
            geographical_limit: "",
            bibliography: "",
            countries: [],
            continents: [],
            handles: [],
            number_of_sites: [],
            owner_name: ""
        }
        */

        this.Database = $resource('/api/database/:id', {}, {
            'get': {
                method: 'GET',
                isArray: false,
                transformResponse: function(data, headers) {
                    /*
                    if (data == 'null' || data == null) {
                        var dbInfos = {
                            default_language: login.user.first_lang_isocode,
                            contexts: [],
                            translations: {
                                description: {},
                                bibliography: {},
                                geographical_limit: {}
                            }
                        }
                    } else {
                    */
                    var dbInfos = angular.fromJson(data);
                    if (dbInfos.id > 0) {
                        dbInfos.created_at = new Date(dbInfos.created_at);
                        dbInfos.updated_at = new Date(dbInfos.updated_at);
                        dbInfos.declared_creation_date  = new Date(dbInfos.declared_creation_date);
                        dbInfos.geographical_extent_geom = angular.fromJson(dbInfos.geographical_extent_geom);
                        dbInfos.subject = dbInfos.subject[dbInfos.default_language];
                        dbInfos.source_relation = dbInfos.source_relation[dbInfos.default_language];
                        dbInfos.source_description = dbInfos.source_description[dbInfos.default_language];
                        dbInfos.context_description = dbInfos.context_description[dbInfos.default_language];
                        if (angular.isDefined(dbInfos.handles) && angular.isArray(dbInfos.handles) && angular.isDefined(dbInfos.handles[0])) {
                            dbInfos.source_url = dbInfos.handles[0].url;
                            dbInfos.source_identifier = dbInfos.handles[0].identifier;
                            dbInfos.source_declared_creation_date = new Date(dbInfos.handles[0].declared_creation_date);
                        }
                    } else {
                        dbInfos.created_at = new Date();
                        dbInfos.updated_at = new Date();
                        dbInfos.declared_creation_date  = new Date();
                    }
                    if (!dbInfos.contexts) {
                        dbInfos.contexts = [];
                    }
                    /*
                    if (dbInfos && typeof(dbInfos.infos) != undefined) {
                        angular.extend(dbInfos, dbInfos.infos);
                        delete dbInfos.infos;
                    }
                    if (dbInfos && typeof(dbInfos.translations) != undefined) {
                        angular.extend(dbInfos, dbInfos.translations);
                        delete dbInfos.translations;
                    }
                    */
                    // console.log(dbInfos);
                    return dbInfos;
                }
            },
            'query': {
                method: 'GET',
                isArray: true,
                transformResponse: function(data, headers) {
                    var dbInfos = angular.fromJson(data);
                    angular.forEach(dbInfos, function(dbi) {
                        if (dbi.infos) {
                            angular.extend(dbi, dbi.infos);
                            delete dbi.infos;
                        }
                    })
                }
            }
        });

        this.definitions = {undef: [{
            tr: 'DATABASE.UNDEFINED.T_TITLE',
            id: 'undefined'
        }]};

        this.definitions.scaleResolutions = [{
            tr: 'DATABASE.SCALE_RESOLUTION_OBJECT.T_TITLE',
            id: 'object'
        }, {
            tr: 'DATABASE.SCALE_RESOLUTION_SITE.T_TITLE',
            id: 'site'
        }, {
            tr: 'DATABASE.SCALE_RESOLUTION_WATERSHED.T_TITLE',
            id: 'watershed'
        }, {
            tr: 'DATABASE.SCALE_RESOLUTION_MICROREGION.T_TITLE',
            id: 'micro-region'
        }, {
            tr: 'DATABASE.SCALE_RESOLUTION_REGION.T_TITLE',
            id: 'region'
        }, {
            tr: 'DATABASE.SCALE_RESOLUTION_COUNTRY.T_TITLE',
            id: 'country'
        }, {
            tr: 'DATABASE.SCALE_RESOLUTION_EUROPA.T_TITLE',
            id: 'europa'
        }];

        this.definitions.geographicalExtents = [{
            tr: 'DATABASE.GEOGRAPHICAL_EXTENT_WORLD.T_TITLE',
            id: 'world'
        }, {
            tr: 'DATABASE.GEOGRAPHICAL_EXTENT_INTERNATIONAL_WATERS.T_TITLE',
            id: 'international_waters'
        }, {
            tr: 'DATABASE.GEOGRAPHICAL_EXTENT_CONTINENT.T_TITLE',
            id: 'continent'
        }, {
            tr: 'DATABASE.GEOGRAPHICAL_EXTENT_COUNTRY.T_TITLE',
            id: 'country'
        }];

        this.definitions.types = [{
            tr: 'DATABASE.TYPE_INVENTORY.T_TITLE',
            id: 'inventory'
        }, {
            tr: 'DATABASE.TYPE_RESEARCH.T_TITLE',
            id: 'research'
        }, {
            tr: 'DATABASE.TYPE_LITERARYWORK.T_TITLE',
            id: 'literary-work'
        }];

        this.definitions.states = [{
            tr: 'DATABASE.STATE_INPROGRESS.T_TITLE',
            id: 'in-progress'
        }, {
            tr: 'DATABASE.STATE_FINISHED.T_TITLE',
            id: 'finished'
        }];

        this.definitions.contexts = [{
            tr: 'DATABASE.CONTEXT_ACADEMIC_WORK.T_TITLE',
            id: 'academic-work'
        }, {
            tr: 'DATABASE.CONTEXT_CONTRACT.T_TITLE',
            id: 'contract'
        }, {
            tr: 'DATABASE.CONTEXT_RESEARCH_TEAM.T_TITLE',
            id: 'research_team'
        }, {
            tr: 'DATABASE.CONTEXT_OTHER.T_TITLE',
            id: 'other'
        }];

        this.definitions.occupations = [{
            tr: 'DATABASE.SITE_OCCUPATION_NOT_DOCUMENTED.T_TITLE',
            id: 'not_documented'
        }, {
            tr: 'DATABASE.SITE_OCCUPATION_SINGLE.T_TITLE',
            id: 'single'
        }, {
            tr: 'DATABASE.SITE_OCCUPATION_CONTINUOUS.T_TITLE',
            id: 'continuous'
        }, {
            tr: 'DATABASE.SITE_OCCUPATION_MULTIPLE.T_TITLE',
            id: 'multiple'
        }];

        this.definitions.knowledgeTypes = [{
            tr: 'DATABASE.KNOWLEDGE_TYPE_NOTDOCUMENTED.T_TITLE',
            id: 'not_documented'
        }, {
            tr: 'DATABASE.KNOWLEDGE_TYPE_LITERATURE.T_TITLE',
            id: 'literature'
        }, {
            tr: 'DATABASE.KNOWLEDGE_TYPE_PROSPECTED_AERIAL.T_TITLE',
            id: 'prospected_aerial'
        }, {
            tr: 'DATABASE.KNOWLEDGE_TYPE_PROSPECTED_PEDESTRIAN.T_TITLE',
            id: 'prospected_pedestrian'
        }, {
            tr: 'DATABASE.KNOWLEDGE_TYPE_SURVEYED.T_TITLE',
            id: 'surveyed'
        }, {
            tr: 'DATABASE.KNOWLEDGE_TYPE_DIG.T_TITLE',
            id: 'dig'
        }];

        this.translateDefinitions = function() {
            var deferred = $q.defer();
            var promises = [];
            var definitionTranslations = {};
            for (var type in self.definitions) {
                if (!self.definitions.hasOwnProperty(type)) continue;
                angular.forEach(self.definitions[type], function(item) {
                    promises.push($translate(item.tr).then(function(tr) {
                        definitionTranslations[item.id] = tr;
                    }));
                });
            }
            $q.all(promises).then(function(h) {
                deferred.resolve(definitionTranslations);
            }, function(err) {
                deferred.resolve(definitionTranslations);
            });
            return deferred.promise;
        };

    }]);
})()
