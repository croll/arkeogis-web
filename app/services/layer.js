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

    ArkeoGIS.service('layerService', ['$http', '$q', '$resource', '$translate', 'login', function($http, $q, $resource, $translate, login) {

        var self = this;

        this.getLayers = function(config) {
            var d = $q.defer();
            var silent = false;
            var params = {
                author: 0,
                type: ''
            };
            if (angular.isDefined(config) && angular.isDefined(config.params)) {
                params = angular.merge(params, config.params);
                silent = config.silent || false;
            }
            $http({
                url: '/api/layers',
                method: 'GET',
                params: params,
                silent: silent,
                transformResponse: function(data) {
                    data = angular.fromJson(data);
                    angular.forEach(data, function(d) {
                        if (d.type == 'shp') {
                            d.min_scale = '';
                            d.max_scale = '';
                        } else {
                            d.zoom_level = d.min_scale + ' / ' + d.max_scale;
                        }

                        if (d.description == "") {
                            d.description = d.description_en;
                            delete d.description_en;
                        }
                    })
                    return data;
                }
            }).then(function(res) {
                d.resolve(res.data);
            }, function(err) {
                console.log(err);
                d.reject(err);
            });
            return d.promise
        };

        this.getLayer = function(id, type) {
            var d = $q.defer();
            $http({
                url: '/api/layer',
                method: 'GET',
                params: {
                    type: type,
                    id: id
                },
                transformResponse: function(data) {
                    return processLayerInfos(angular.fromJson(data));
                }
            }).then(function(res) {
                d.resolve(res.data);
            }, function(err) {
                console.log(err);
                d.reject(err);
            });
            return d.promise
        }

        var processLayerInfos = function(data) {
            angular.extend(data, data.infos);
            data.created_at = new Date(data.created_at);
            data.geographical_extent_geom = angular.fromJson(data.geographical_extent_geom);
            if (data.type == 'shp') {
                data.declared_creation_date = new Date(data.declared_creation_date);
                data.geojson = angular.fromJson(data.geojson);
            } else {
                data.max_usage_date = new Date(data.max_usage_date);
            }
            angular.forEach(data.authors, function(author) {
                author.fullname = author.firstname + ' ' + author.lastname;
            });

            for (var k in data.translations.attribution) {
                if (!data.translations.attribution.hasOwnProperty(k)) continue;
                if (data.translations.attribution[k]) {
                    data.attribution = data.translations.attribution[k];
                }
            }

            for (var k in data.translations.copyright) {
                if (!data.translations.copyright.hasOwnProperty(k)) continue;
                if (data.translations.copyright[k]) {
                    data.copyright = data.translations.copyright[k];
                }
            }

            delete data.infos;
            return data;
        }

    }]);
})();
