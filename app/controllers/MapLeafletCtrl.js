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
    ArkeoGIS.controller('MapLeafletCtrl', ['$scope', 'arkeoService', 'arkeoProject', 'arkeoMap', 'leafletData',
        function($scope, arkeoService, arkeoProject, arkeoMap, leafletData) {

            /*
             * Leaflet Map
             */
            var self = this;

            this.letter = 'A';

            var project = arkeoProject.get();

            // Get map area to fit full screen
            var resize = function() {
                $scope.mapHeight = $(window).height() - $("#arkeo-main-toolbar").height() + "px";
            };
            resize();

            $(window).on('resize', resize);

            angular.extend($scope, arkeoMap.config);

            if (project.geom != '') {
                leafletData.getMap().then(function(map) {
                    map.fitBounds(L.geoJson(project.geom).getBounds());
                });
            }

            var generateIcon = function(feature) {

                // Debug icon position
                // leafletData.getMap().then(function(map) {
                // 	L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]).addTo(map);
                // });

                var iconProperties = {};

                var iconClasses = "";

                var exceptional = "";

                var characInfos = analyzeCharacs(feature);

                iconClasses += " size" + characInfos.iconSize;

                if (characInfos.exceptional) {
                    exceptional += "-exceptional"
                }

                if (!feature.centroid) {
                    angular.extend(iconProperties, {
                        className: 'arkeo-marker-container-drop query' + self.letter,
                        html: '<svg class="arkeo-marker arkeo-marker-drop-svg ' + iconClasses + '"><use xlink:href="#arkeo-marker-drop-symbol' + exceptional + '"></use></svg><div class="arkeo-marker-letter size' + characInfos.iconSize + '">' + self.letter + '</div>',
                        iconSize: [55, 60],
                        iconAnchor: getIconAnchorPosition(characInfos.iconSize),
                        popupAnchor: [0, 0]
                    });
                } else {
                    angular.extend(iconProperties, {
                        className: 'arkeo-marker-container-circle query' + self.letter,
                        html: '<svg class="arkeo-marker arkeo-marker-circle-svg ' + iconClasses + '"><use xlink:href="#arkeo-marker-circle-symbol' + exceptional + '"></use></svg><div class="arkeo-marker-letter size' + characInfos.iconSize + '">' + self.letter + '</div>',
                        iconSize: [55, 55],
                        iconAnchor: [25, 27.5],
                        popupAnchor: [0, 0]
                    });
                }

                function getIconAnchorPosition(iconSize) {
                    var ret;
                    switch (iconSize) {
                        case 1:
                            ret = [24, 38];
                            break;
                        case 2:
                            ret = [23, 41];
                            break;
                        case 3:
                            ret = [23, 43];
                            break;
                        case 4:
                            ret = [23, 46];
                            break;
                        case 5:
                            ret = [23, 52];
                            break;
                        case 6:
                            ret = [23, 55];
                            break;
                    }
                    return ret;
                };

                function buildPopup() {
                    return 'pouet';
                }

                return L.divIcon(iconProperties);

            }

            var analyzeCharacs = function(feature) {
                var current = 0;
                var memorized = 0;
                var ret = {
                    exceptional: false,
                    iconSize: 0
                };
                angular.forEach(feature.properties.site_ranges, function(site_range) {
                    angular.forEach(site_range.characs, function(c) {
                        if (c.exceptional) {
                            ret.exceptional = true;
                        }
                        switch (c.knowledge_type) {
                            case 'not_documented':
                                current = 1;
                                break;
                            case 'literature':
                                current = 2;
                                break;
                            case 'prospected_aerial':
                                current = 3;
                                break;
                            case 'prospected_pedestrian':
                                current = 4;
                                break;
                            case 'surveyed':
                                current = 5;
                                break;
                            case 'dig':
                                current = 6;
                                break;
                        }
                        if (memorized < current) {
                            memorized = current;
                            ret.iconSize = current;
                        }
                    });
                });
                return ret;
            }

            function displayMapResults(data) {
                var latlngs = [];

                leafletData.getMap().then(function(map) {
                    leafletData.getLayers().then(function(layers) {
                        if ('sites' in layers.overlays)
                            map.removeLayer(layers.overlays.sites);
                    });
                });

                angular.extend($scope.layers.overlays, {
                    sites: {
                        name: 'ArkeoGIS (' + (++$scope.letter) + ')',
                        type: 'geoJSONShape',
                        data: data,
                        visible: true,
                        icon: generateIcon,
                        layerOptions: {
                            pointToLayer: function(feature, latlng) {
                                var marker = L.marker(latlng, {
                                    icon: generateIcon(feature)
                                });
                                marker.on('mouseover', function(e) {
                                    this.openPopup();
                                });
                                marker.on('click', function(e) {
                                    return false;
                                });
                                return marker;
                            },
                            onEachFeature: function(feature, layer) {
                                console.log(feature);
                                var html = "<arkeo-popup>";
                                html += "<div style='font-weight:bold'>"+feature.properties.infos.name + " (" + feature.properties.infos.code + ")"+"</div>";
                                html += "<div>"+feature.properties.infos.database_name+"</div>";
                                html += "</arkeo-popup>";
                                layer.bindPopup(html);
                            }
                        }
                    }
                });

                angular.forEach(data.features, function(feature) {
                    latlngs.push([parseFloat(feature.geometry.coordinates[0]), parseFloat(feature.geometry.coordinates[1])]);
                });

                resize();
            }

            /*
             * watch on results
             */

            $scope.$parent.$watch("latest_result", function(newval, oldval) {
                console.log("display new results ...", newval);
                displayMapResults(newval);
            });

            function drawSearchZoneRect() {
                leafletData.getMap().then(function(map) {
                    leafletData.getLayers().then(function(layers) {
                        var drawnItems = layers.overlays.draw;

                        if (curlayer) {
                            drawnItems.removeLayer(curlayer);
                            curlayer = null;
                        }

                        geom = angular.fromJson(geom);
                        curlayer = L.geoJson(geom).addTo(drawnItems);
                        curlayer.editing.enable();
                    });
                });
            }

        }
    ]);
})();
