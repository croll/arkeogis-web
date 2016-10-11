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

    ArkeoGIS.service('arkeoMap', ['$http', '$q', 'arkeoProject', '$rootScope', '$translate', function($http, $q, arkeoProject, $rootScope, $translate) {

        var self = this,
            mapDefer = $q.defer(),
            clusterRadiusControl,
            groupRadius = 80,
            projectCentroid;

        // this.queryControls = {};

        this.setProject = function() {

            this.project = arkeoProject.get();

            projectCentroid = {
                lat: 48.58476,
                lng: 7.750576
            }

            if (this.project.geojson) {
                console.log(this.project.geojson);
                var c = L.geoJson(this.project.geojson).getBounds().getCenter();
                projectCentroid.lat = c.lat;
                projectCentroid.lng = c.lng;
            }

        }

        this.setProject();

        this.queryControl = {};

        this.initLeaflet = function(el) {

            this.setProject();

            $translate(['MAP.LAYER_MENU.T_ZOOMIN', 'MAP.LAYER_MENU.T_ZOOMOUT', 'MAP.LAYER_MENU.T_TOGGLE_GROUP', 'MAP.LAYER_MENU.T_BASE_LAYERS', 'MAP.LAYER_MENU.T_ALL']).then(function(translations) {
                var layers = {
                    baseMaps: [{
                        groupName: translations['MAP.LAYER_MENU.T_BASE_LAYERS'],
                        expanded: true,
                        layers: {
                            "OpenStreetMap": new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '<a href="http://openstreetmap.org">OpenStreetMap</a>'
                            }),
                            "OpenTopoMap": new L.TileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                                attribution: '<a href="http://opentopomap.org/credits">OpenTopoMap</a>'
                            }),
                            "Google Roadmap": new L.Google('ROADMAP'),
                            "Google Sat": new L.Google('SATELLITE'),
                            "Google Terrain": new L.Google('TERRAIN')
                        }
                    }]
                }

                // Init leaflet
                var map = new L.Map(el, {
                    center: new L.LatLng(projectCentroid.lat, projectCentroid.lng),
                    layers: [layers.baseMaps[0].layers["OpenStreetMap"]],
                    zoomControl: false,
                    maxZoom: 18,
                    worldCopyJump: true,
                    attributionControl: false,
                });

                self.layerControl = L.Control.styledLayerControl(layers.baseMaps, null, {
                    container_width: "200px",
                    container_maxHeight: "600px",
                    exclusive: false,
                    collapsed: false,
                    group_toggler: {
                        show: true,
                        label: translations['MAP.LAYER_MENU.T_ALL']
                    },
                    buttons: [{
                        label: translations['MAP.LAYER_MENU.T_ZOOMIN'],
                        class: 'zoomin',
                        callback: function(button, layerControl) {
                            map.zoomIn();
                        },
                        events: {
                            zoomend: function(button, layerControl) {
                                if (map.getZoom() >= map.getMaxZoom()) {
                                    $(button.element).addClass('disabled');
                                } else {
                                    $(button.element).removeClass('disabled');
                                }
                            }
                        }
                    }, {
                        label: translations['MAP.LAYER_MENU.T_ZOOMOUT'],
                        class: 'zoomout',
                        callback: function(button, layerControl) {
                            map.zoomOut();
                        },
                        events: {
                            zoomend: function(button, layerControl) {
                                if (map.getZoom() <= map.getMinZoom()) {
                                    $(button.element).addClass('disabled');
                                } else {
                                    $(button.element).removeClass('disabled');
                                }
                            }
                        }
                    }, {
                        label: translations['MAP.LAYER_MENU.T_TOGGLE_GROUP'],
                        class: 'group',
                        enabled: true,
                        togglable: true,
                        callback: function(button, layerControl) {
                            groupRadius = (groupRadius == 0) ? 80 : 0;
                            $rootScope.$apply();
                        }
                    }]

                }).addTo(map);
                // Attribution
                new L.control.attribution({prefix: 'Make by <a href="http://www.croll.fr" target="_blank">© CROLL SAS</a>'}).addTo(map);
                return mapDefer.resolve(map);
                // Scale control
                new L.control.scale({
                    position: 'bottomright'
                }).addTo(map);
            });
        }

        this.getMap = function() {
            return mapDefer.promise;
        }

        this.initPromise = function() {
            mapDefer = $q.defer();
        }

        this.getRadius = function() {
            return groupRadius;
        }

        this.config = {
            defaults: {
                zoomControlPosition: 'topright',
                worldCopyJump: true
            },
            center: {
                lat: projectCentroid.lat,
                lng: projectCentroid.lng,
                zoom: 0
            },
            layers: {
                baselayers: {
                    osm: {
                        name: 'OpenStreetMap',
                        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        type: 'xyz'
                    },
                    googleHybrid: {
                        name: 'Google Hybrid',
                        layerType: 'HYBRID',
                        type: 'google'
                    },
                    googleRoadmap: {
                        name: 'Google Streets',
                        layerType: 'ROADMAP',
                        type: 'google'
                    }
                },
                overlays: {}
            },
            controls: {
                scale: {
                    imperial: false,
                    position: 'bottomright'
                },
                fullscreen: {
                    position: 'topright'
                }
            },
            layercontrol: {
                icons: {
                    uncheck: "fa fa-toggle-off",
                    check: "fa fa-toggle-on"
                }
            },
            watchOptions: {
                markers: {
                    type: null,
                    individual: {
                        type: null
                    }
                }
            }
        }

        this.getValidBoundingBox = function(north, east, south, west) {
            north = parseFloat(north);
            east = parseFloat(east);
            south = parseFloat(south);
            west = parseFloat(west);
            if (north > 90) {
                north = 89.999999;
            }
            if (south < -90) {
                south = -89.999999;
            }
            if (west < -180) {
                west = -179.999999;
            }
            if (east >= 180) {
                east = 179.999999;
            }
            return [
                [north, east],
                [south, west]
            ]
        }

        this.getBoundsAsGeoJSON = function(bbox) {
            var bounds = angular.fromJson(L.rectangle(bbox).toGeoJSON());
            bounds.geometry.crs = {
                type: "name",
                properties: {
                    name: "EPSG:4326"
                }
            }
            return bounds;
        }

    }]);
})();
