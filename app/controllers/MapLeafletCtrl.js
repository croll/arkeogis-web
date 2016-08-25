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
    ArkeoGIS.controller('MapLeafletCtrl', ['$scope', '$http', '$compile', '$mdDialog', 'arkeoService', 'arkeoProject', 'arkeoMap', 'leafletData',
        function($scope, $http, $compile, $mdDialog, arkeoService, arkeoProject, arkeoMap, leafletData) {

            /*
             * Leaflet Map
             */
            var self = this;

            this.letter = 'A';

            this.markerClusters = {};

            var project = arkeoProject.get();

            // Get map area to fit full screen
            var resize = function() {
                $scope.mapHeight = $(window).height() - $("#arkeo-main-toolbar").height() + "px";
            };
            resize();

            initProjectLayers();

            $(window).on('resize', resize);

            angular.extend($scope, arkeoMap.config);

            if (project.geom != '') {
                leafletData.getMap().then(function(map) {
                    map.fitBounds(L.geoJson(project.geom).getBounds());
                });
            }

            leafletData.getMap().then(function(map) {
                map.on('zoomend', function(e) {
                    // $scope.layers.overlays.sites.layerParams.showOnSelector = false;
                });

                map.on('layeradd', function(e) {
                    if (e.layer.feature && e.layer.feature.properties && e.layer.feature.properties.init === false) {
                        $http({
                            method: 'GET',
                            url: '/api/layer/' + e.layer.feature.properties.id + '/geojson'
                        }).then(function(result) {
                            $scope.layers.overlays[e.layer.feature.properties.uniq_code] = {
                                name: e.layer.feature.properties.name,
                                type: 'geoJSONShape',
                                data: result.data,
                                visible: true,
                                doRefresh: true
                            };
                        }, function(err) {
                            arkeoService.showMessage('MAPQUERY.MESSAGE.T_GETGEOJSON_ERROR')
                            console.log(err);
                        })
                    }
                })
            });

            function initProjectLayers() {
                leafletData.getMap().then(function(map) {
                    if (project.layers.length) {
                        angular.forEach(project.layers, function(layer) {
                            addLayer(layer, map);
                        });
                    }
                });
            }

            function addLayer(layer, map) {
                leafletData.getDirectiveControls().then(function(d) {
                    console.log(d);

                });
                if (layer.type == 'shp') {
                    var geojsonFeature = {
                        type: "Feature",
                        properties: {
                            name: layer.translations.name.en,
                            uniq_code: layer.uniq_code,
                            type: layer.type,
                            id: layer.id,
                            init: false
                        },
                        geometry: angular.fromJson(layer.geom)
                    };
                    $scope.layers.overlays[layer.uniq_code] = {
                        name: layer.translations.name.en,
                        type: 'geoJSONShape',
                        data: geojsonFeature,
                        visible: false,
                        doRefresh: true
                    };
                } else if (layer.type == 'wms') {
                    $scope.layers.overlays[layer.uniq_code] = {
                        name: layer.translations.name.en,
                        type: 'wms',
                        url: layer.url,
                        visible: false,
                        layerOptions: {
                            layers: layer.identifier
                        }
                    };
                } else if (layer.type == 'wmts') {
                    $scope.layers.overlays[layer.uniq_code] = {
                        name: layer.translations.name.en,
                        type: 'wmts',
                        url: layer.url,
                        visible: false,
                        layerOptions: {
                            layers: layer.identifier
                        }
                    };
                }
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

                    L.geoJson(data, {
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

                            var html = "<arkeo-popup>";
                            html += "<div style='font-weight:bold'>" + feature.properties.infos.name + " (" + feature.properties.infos.code + ")" + "</div>";
                            html += "<div>" + feature.properties.infos.database_name + "</div>";
                            html += '<md-icon ng-click="toggleSiteDetailsDialog(' + feature.properties.infos.id + ')" class="md-18" style="cursor: pointer">remove_red_eye</md-icon>';
                            html += "</arkeo-popup>";

                            if (!_.has(self.markerClusters, feature.properties.infos.database_id)) {
                                self.markerClusters[feature.properties.infos.database_id] = L.markerClusterGroup({maxClusterRadius: 50000});
                            }
                            self.markerClusters[feature.properties.infos.database_id].addLayer(layer)
                            layer.bindPopup($compile(html)($scope)[0]);
                        }
                    });

                    angular.forEach(self.markerClusters, function(mc) {
                        console.log("--------------");
                        console.log(mc);
                        mc.addTo(map);
                    });

                });


                /*
                angular.extend($scope.layers.overlays, {
                    sites: {
                        name: 'ArkeoGIS (' + (++$scope.letter) + ')',
                        type: 'geoJSONShape',
                        data: data,
                        visible: true,
                        doRefresh: true,
                        icon: generateIcon,
                        layerParams: {
                            showOnSelector: true,
                            transparent: true
                        },
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

                                if (!angular.isDefined(self.markerClusterGroup[feature.properties.infos.database_id])) {
                                    self.markerClusterGroup[feature.properties.infos.database_id] = L.markerClusterGroup();
                                }

                                return marker;
                            },
                            onEachFeature: function(feature, layer) {
                                var html = "<arkeo-popup>";
                                html += "<div style='font-weight:bold'>" + feature.properties.infos.name + " (" + feature.properties.infos.code + ")" + "</div>";
                                html += "<div>" + feature.properties.infos.database_name + "</div>";
                                html += '<md-icon ng-click="toggleSiteDetailsDialog('+feature.properties.infos.id+')" class="md-18" style="cursor: pointer">remove_red_eye</md-icon>';
                                html += "</arkeo-popup>";
                                layer.bindPopup($compile(html)($scope)[0]);
                            }
                        }
                    }
                });
                */

                // angular.forEach(data.features, function(feature) {
                //     latlngs.push([parseFloat(feature.geometry.coordinates[0]), parseFloat(feature.geometry.coordinates[1])]);
                // });

                resize();
            }

            $scope.toggleSiteDetailsDialog = function(id) {
                $mdDialog.show({
                        controller: function($scope, $mdDialog) {
                            $scope.id = id;
                            $scope.hide = function() {
                                $mdDialog.hide();
                            };
                        },
                        templateUrl: 'partials/site-details.html',
                        parent: angular.element(document.body),
                        clickOutsideToClose: true,
                        fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                    })
                    .then(function(answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function() {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };

            /*
             * watch on results
             */

            $scope.$parent.$watch("latest_result", function(newval, oldval) {
                if (!newval) return;
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
