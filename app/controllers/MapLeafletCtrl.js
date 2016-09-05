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
    ArkeoGIS.controller('MapLeafletCtrl', ['$scope', '$http', '$compile', '$mdDialog', 'arkeoService', 'arkeoProject', 'arkeoMap', 'arkeoQuery',
        function($scope, $http, $compile, $mdDialog, arkeoService, arkeoProject, arkeoMap, arkeoQuery) {

            /*
             * Leaflet Map
             */
            var self = this;

            arkeoQuery.reset();

            var project = arkeoProject.get();

            // Get map area to fit full screen
            angular.element(window).on('resize', function() {
                $scope.mapHeight = $(window).height() - $("#arkeo-main-toolbar").height() -20 + "px";
                $scope.$apply();
            });

            arkeoMap.init();

            arkeoMap.getMap().then(function(map) {

                if (project.geom != '') {
                    map.fitBounds(L.geoJson(project.geom).getBounds());
                }

                map.on('zoomend', function(e) {
                    // $scope.layers.overlays.sites.layerParams.showOnSelector = false;
                });

                map.on('layeradd', function(e) {
                    if (e.layer.feature && e.layer.feature.properties && e.layer.feature.properties.init === false) {
                        $http({
                            method: 'GET',
                            url: '/api/layer/' + e.layer.feature.properties.id + '/geojson'
                        }).then(function(result) {
                            // arkeoMap.overlays[e.layer.feature.properties.uniq_code] = {
                            //     name: e.layer.feature.properties.name,
                            //     type: 'geoJSONShape',
                            //     data: result.data,
                            //     visible: true,
                            //     doRefresh: true
                            // };
                            new L.geoJson(result.data).addTo(map);
                        }, function(err) {
                            arkeoService.showMessage('MAPQUERY.MESSAGE.T_GETGEOJSON_ERROR')
                            console.log(err);
                        })
                    }
                });

                initProjectLayers(map);

            })

            function initProjectLayers(map) {
                if (project.layers.length) {
                    angular.forEach(project.layers, function(layer) {
                            addLayer(layer, map);
                    });
                }
            }

            function addLayer(layer, map) {
                // leafletData.getDirectiveControls().then(function(d) {
                //     console.log(d);
                //
                // });

                var l ;

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
                    l = {
                        name: layer.translations.name.en,
                        type: 'shp',
                        layer: new L.geoJson(geojsonFeature)
                    };
                } else if (layer.type == 'wms') {
                    l = {
                        name: layer.translations.name.en,
                        type: 'wms',
                        layer: L.tileLayer.wms(layer.url, {layers: layer.identifier})
                    };
                } else if (layer.type == 'wmts') {
                    l = {
                        name: layer.translations.name.en,
                        type: 'wmts',
                        layer: L.tileLayer.WMTS(layer.url, {layer: layer.identifier, attribution: layer.translations.attribution.en})
                    };
                }

                arkeoMap.layers.overlayMaps[layer.uniq_code] = l;
                arkeoMap.layerControl.addOverlay(l.layer, l.name);
                // l.layer.addTo(map);
                //console.log(map.layerControl.addOverlay(arkeoMap.layers.overlayMaps[layer.uniq_code].layer));
                //map.layerControl.addOverlay(arkeoMap.layers.overlayMaps[layer.uniq_code].layer, arkeoMap.layers.overlayMaps[layer.uniq_code].name);
            }

            var generateIcon = function(feature, letter) {

                // Debug icon position
                // leafletData.getMap().then(function(map) {
                // 	L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]).addTo(map);
                // });

                var iconProperties = {};

                var iconClasses = "";

                var exceptional = "";

                var characInfos = analyzeFeature(feature);

                iconClasses += " size" + characInfos.iconSize;

                if (characInfos.exceptional) {
                    exceptional += "-exceptional"
                }

                if (!feature.properties.infos.centroid) {
                    angular.extend(iconProperties, {
                        className: 'arkeo-marker-container-drop query' + letter,
                        html: '<svg class="arkeo-marker arkeo-marker-drop-svg ' + iconClasses + '"><use xlink:href="#arkeo-marker-drop-symbol' + exceptional + '" style="fill: '+characInfos.iconColor+'"></use></svg><div class="arkeo-marker-letter size' + characInfos.iconSize + '">' + letter + '</div>',
                        iconSize: [55, 60],
                        iconAnchor: getIconAnchorPosition(characInfos.iconSize),
                        popupAnchor: [0, 0]
                    });
                } else {
                    angular.extend(iconProperties, {
                        className: 'arkeo-marker-container-circle query' + letter,
                        html: '<svg class="arkeo-marker arkeo-marker-circle-svg ' + iconClasses + '"><use xlink:href="#arkeo-marker-circle-symbol' + exceptional + '" style="fill:'+characInfos.iconColor+'"></use></svg><div class="arkeo-marker-letter size' + characInfos.iconSize + '">' + letter + '</div>',
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

            var analyzeFeature = function(feature) {
                var currentSize = 0;
                var memorizedSize = 0;
                var start_date = -9999999;
                var end_date = 999999;
                var color;
                var ret = {
                    exceptional: false,
                    iconSize: 0,
                    iconColor: 'rgba(255, 255, 255, 0.4)'
                };
                angular.forEach(feature.properties.site_ranges, function(site_range) {
                    // Get icon color
                    if (site_range.start_date > start_date) {
                        start_date = site_range.start_date;
                    }
                    if (site_range.end_date < end_date) {
                        end_date = site_range.end_date;
                    }
                    angular.forEach(site_range.characs, function(c) {
                        if (c.exceptional) {
                            ret.exceptional = true;
                        }
                        switch (c.knowledge_type) {
                            case 'not_documented':
                                currentSize = 1;
                                break;
                            case 'literature':
                                currentSize = 2;
                                break;
                            case 'prospected_aerial':
                                currentSize = 3;
                                break;
                            case 'prospected_pedestrian':
                                currentSize = 4;
                                break;
                            case 'surveyed':
                                currentSize = 5;
                                break;
                            case 'dig':
                                currentSize = 6;
                                break;
                        }
                        if (memorizedSize < currentSize) {
                            memorizedSize = currentSize;
                            ret.iconSize = currentSize;
                        }
                    });
                });
                color = arkeoProject.getChronologyColor(start_date, end_date);
                if (color) {
                    ret.iconColor = '#'+color;
                }
                return ret;
            }

            function createGroupMarkerIcon() {

                L.Control.GroupMarkers = L.Control.extend({
                    options: {
                        position: 'topright',
                    },

                    onAdd: function(map) {
                        var controlDiv = L.DomUtil.create('div', 'leaflet-control-custom leaflet-control-groupmarkers leaflet-control-hiddable');
                        L.DomEvent
                            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                            .addListener(controlDiv, 'click', function() {
                                if (layerType == 'cluster') {
                                    layerType = 'simple';
                                    controlDiv.className = controlDiv.className.replace(' leaflet-control-active', '');
                                } else {
                                    layerType = 'cluster';
                                    L.DomUtil.addClass(controlDiv, 'leaflet-control-active');
                                }
                                redrawMarkers();
                            });

                        var controlUI = L.DomUtil.create('div', 'leaflet-control-command-interior', controlDiv);
                        controlUI.title = ch_t('arkeogis', 'Recadrer sur l\'emprise des icones');
                        return controlDiv;
                    }
                });

                new L.Control.GroupMarkers({})
                    .addTo(map);

            }

            var start;
            var end

            function displayQuery(query) {

                query.done = true;

                arkeoMap.getMap().then(function(map) {

                var start, end;
                start = new Date().getTime();

                var latlngs = [];

                _.each(query.data.features, function(feature) {
                    var marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                        icon: generateIcon(feature, query.letter)
                    });
                    marker.on('mouseover', function(e) {
                        this.openPopup();
                    });
                    marker.on('click', function(e) {
                        return false;
                    });
                    var html = "<arkeo-popup>";
                    html += "<div style='font-weight:bold'>" + feature.properties.infos.name + " (" + feature.properties.infos.code + ")" + "</div>";
                    html += "<div>" + feature.properties.infos.database_name + "</div>";
                    html += '<md-icon ng-click="toggleSiteDetailsDialog(' + feature.properties.infos.id + ')" class="md-18" style="cursor: pointer">remove_red_eye</md-icon>';
                    html += "</arkeo-popup>";
                    marker.bindPopup($compile(html)($scope)[0]);

                    if (!_.has(query.markerClusters, feature.properties.infos.database_id)) {
                        query.markerClusters[feature.properties.infos.database_id] = new L.markerClusterGroup();
                    };

                    query.markerClusters[feature.properties.infos.database_id].addLayer(marker);
                });



/*
                    L.geoJson(query.data, {
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
                            layer.bindPopup($compile(html)($scope)[0]);

                            if (!_.has(query, feature.properties.infos.database_id) {
                                query.clusters[feature.properties.infos.database_id] = new L.markerClusterGroup();
                            });
                            query.clusters[feature.properties.infos.database_id].addLayer(layer);

                        }
                    });
                    */
                    /*
                    angular.forEach(self.markerClusters, function(mc) {
                        mc.addTo(map);
                    });
                    */

                    // Add markerClusters to map
                    _.each(query.markerClusters, function(mc) {
                        mc.addTo(map);
                    });

                });

            }

            $scope.toggleSiteDetailsDialog = function(id) {
                arkeoQuery.getSite(id).then(function(siteInfos) {
                    $mdDialog.show({
                            controller: function($scope, $mdDialog) {
                                $scope.id = id;
                                $scope.hide = function() {
                                    $mdDialog.hide();
                                };
                                $scope.site = siteInfos.features[0];
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
                });
            };

            // $scope.toggleSiteDetailsDialog()

            /*
             * watch on results
             */

            $scope.$watch(function() {
                return arkeoQuery.getNumQueries();
            }, function(newNum, oldNum) {
                if (newNum == 0) {
                    return;
                }
                if (newNum > oldNum) {
                    var q = arkeoQuery.getCurrent();
                    if (q.done === false) {
                        displayQuery(q);
                    }
                }
            }, true);

            function drawSearchZoneRect() {
                var drawnItems = layers.overlayMaps.draw;

                if (curlayer) {
                    drawnItems.removeLayer(curlayer);
                    curlayer = null;
                }

                geom = angular.fromJson(geom);
                curlayer = L.geoJson(geom).addTo(drawnItems);
                curlayer.editing.enable();
            }

        }
    ]);
})();
