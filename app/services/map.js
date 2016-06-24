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
    ArkeoGIS.service('mapService', ['$http', '$q', '$translate', '$mdToast', function($http, $q, $translate, $mdToast) {

        var self = this;

        this.config = {
            defaults: {
                zoomControlPosition: 'topright'
            },
            center: {
                lat: 48.58476,
                lng: 7.750576,
                zoom: 8
            },
            layers: {
                baselayers: {
                    osm: {
                        name: 'OpenStreetMap',
                        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        type: 'xyz'
                    },
                    mapquest: {
                        name: 'MapQuest',
                        url: 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png',
                        type: 'xyz'
                    },
                    googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
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
            }
        }

        this.getValidBoundingBox = function(north, east, south, west) {
            north = parseFloat(north);
            east = parseFloat(east);
            south = parseFloat(south);
            west = parseFloat(west);
            if (north < -90) {
                north = -90;
            }
            if (south >= 90) {
                south = 89.999999;
            }
            if (west < -180) {
                west = -180;
            }
            if (east >= 180) {
                east = 179.999999;
            }
            console.log([north, east],
                [south, west]);
            return [
                [north, east],
                [south, west]
            ]
        }

    }]);
})();
