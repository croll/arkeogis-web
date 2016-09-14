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
    ArkeoGIS.controller('MapLeafletCtrl', ['$scope', '$http', '$compile', '$filter', '$mdDialog', 'arkeoService', 'arkeoProject', 'arkeoMap', 'arkeoQuery', 'arkeoLang', 'arkeoDatabase',
        function($scope, $http, $compile, $filter, $mdDialog, arkeoService, arkeoProject, arkeoMap, arkeoQuery, arkeoLang, arkeoDatabase) {

            /*
             * Leaflet Map
             */
            var self = this;

            var project = arkeoProject.get();

            // Get map area to fit full screen
            angular.element(window).on('resize', function() {
                $scope.mapHeight = $(window).height() - $("#arkeo-main-toolbar").height() - 20 + "px";
                $scope.$apply();
            });

            arkeoMap.getMap().then(function(map) {

                if (project.geom != '') {
                    map.fitBounds(L.geoJson(project.geom).getBounds());
                }

                // Cluster radius
                arkeoMap.clusterRadiusControl = new L.Control.ClusterRadius({
                    minRadius: 0.1,
                    maxRadius: 80,
                    callback: function() {
                        $scope.displayMarkers();
                    }
                }).addTo(map);

                map.on('layeradd', function(e) {
                    if (e.layer.feature && e.layer.feature.properties && e.layer.feature.properties.init === false) {
                        $http({
                            method: 'GET',
                            url: '/api/layer/' + e.layer.feature.properties.id + '/geojson'
                        }).then(function(result) {
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
                    _.each(project.layers, function(layer) {
                        var l = addLayer(layer, map);
                        arkeoMap.layerControl.addOverlay(l.instance, l.name)
                    });

                }
            }

            function addLayer(layer, map) {

                var l;

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
                        instance: new L.geoJson(geojsonFeature)
                    };
                } else if (layer.type == 'wms') {
                    l = {
                        name: layer.translations.name.en,
                        type: 'wms',
                        instance: L.tileLayer.wms(layer.url, {
                            minZoom: layer.min_scale,
                            maxZoom: layer.max_scale,
                            layers: layer.identifier
                        })
                    };
                } else if (layer.type == 'wmts') {
                    l = {
                        name: layer.translations.name.en,
                        type: 'wmts',
                        instance: L.tileLayer.WMTS(layer.url, {
                            layer: layer.identifier,
                            attribution: layer.translations.attribution.en,
                            minZoom: layer.min_scale,
                            maxZoom: layer.max_scale
                        })
                    };
                }

                arkeoMap.layers.overlayMaps[layer.uniq_code] = l;

                return l;
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
                        html: '<svg class="arkeo-marker arkeo-marker-drop-svg ' + iconClasses + '"><use xlink:href="#arkeo-marker-drop-symbol' + exceptional + '" style="fill: ' + characInfos.iconColor + '"></use></svg><div class="arkeo-marker-letter size' + characInfos.iconSize + '">' + letter + '</div>',
                        iconSize: [55, 60],
                        iconAnchor: getIconAnchorPosition(characInfos.iconSize),
                        popupAnchor: [0, 0]
                    });
                } else {
                    angular.extend(iconProperties, {
                        className: 'arkeo-marker-container-circle query' + letter,
                        html: '<svg class="arkeo-marker arkeo-marker-circle-svg ' + iconClasses + '"><use xlink:href="#arkeo-marker-circle-symbol' + exceptional + '" style="fill:' + characInfos.iconColor + '"></use></svg><div class="arkeo-marker-letter size' + characInfos.iconSize + '">' + letter + '</div>',
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
                var end_date1 = -2147483648;
                var end_date2 = 2147483647;
                var color;
                var ret = {
                    exceptional: false,
                    iconSize: 7,
                    iconColor: 'rgba(255, 255, 255, 0.4)'
                };
                angular.forEach(feature.properties.site_ranges, function(site_range) {
                    // Get icon color
                    if (site_range.end_date1 > end_date1) {
                        end_date1 = site_range.end_date1;
                        end_date2 = site_range.end_date2;
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
                        if (ret.iconSize > currentSize) {
                            ret.iconSize = currentSize;
                        }
                    });
                });
                // Hack to undefined color
                if (end_date1 == -2147483648 && end_date2 == 2147483647) {
                    ret.iconColor = '#888';
                } else {
                    var c = arkeoProject.getChronologyByDates(end_date1, end_date2);
                    if (c && c.color) {
                        ret.iconColor = '#' + c.color;
                    }
                }
                return ret;
            }

            var start;
            var end

            function displayQuery(query) {

                query.done = true;

                arkeoMap.getMap().then(function(map) {

                    var start, end,
                        start = new Date().getTime(),
                        latlngs = [],
                        startingPeriod = {startDate: -2147483648, endDate: 2147483647},
                        endingPeriod = {startDate: 2147483647, endDate: -2147483648};

                    _.each(query.data.features, function(feature) {
                        // Marker
                        var marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                            icon: generateIcon(feature, query.letter)
                        });
                        // Events
                        marker.on('mouseover', function(e) {
                            this.openPopup();
                        });
                        marker.on('click', function(e) {
                            return false;
                        });
                        // For each site range
                        var divsCharacs ={};
                        _.each(feature.properties.site_ranges, function(sr) {
                            /*
                            if (startingPeriod.startDate > sr.start_date1) {
                                startingPeriod.startDate = sr.start_date1;
                                startingPeriod.endDate = sr.start_date2;
                            }
                            if (endingPeriod.endDate < sr.end_date1) {
                                endingPeriod.startDate = sr.end_date1;
                                endingPeriod.endDate = sr.end_date2;
                            }
                            */
                            _.each(sr.characs, function(charac) {
                                var characInfos = arkeoProject.getCharacById(charac.charac_id);
                                divsCharacs[charac.charac_id] = "<div>" + characInfos.hierarchy.join('/') + "</div>";
                            });
                        });
                        // Build html popup
                        $scope.feature = feature;
                        var start_date = $filter('arkYear')(feature.properties.infos.start_date1);
                        var end_date = $filter('arkYear')(feature.properties.infos.start_date2);
                        var html = "<arkeo-popup>";
                        html += "<div class='title'>";
                        html += "<div><span class='site-name'>" + feature.properties.infos.name + "</span> (" + feature.properties.infos.code + ")" + "</div>";
                        html += "<div class='periods'>" + start_date;
                        if (start_date != end_date) {
                            html += ' : '+end_date;
                        }
                        html += "</div>";
                        html += "<div class='db-name'>" + feature.properties.infos.database_name + "</div>";
                        html += "</div>";
                        html += "<div class='content'>";
                        // For reach site range get characs
                        // Store charac divs and order them later
                        Object.keys(divsCharacs).reverse().forEach(function(key) {
                            html += divsCharacs[key];
                        });
                        html += '<div class="more"><md-icon ng-click="toggleSiteDetailsDialog(' + feature.properties.infos.id + ')" class="md-18" style="cursor: pointer">info</md-icon></div>';
                        html += "</div></arkeo-popup>";
                        marker.bindPopup($compile(html)($scope)[0], {maxWidth: '500'});
                        marker.feature = feature;

                        if (!_.has(query.markersByDatabase, feature.properties.infos.database_id)) {
                            query.markersByDatabase[feature.properties.infos.database_id] = {
                                markers: [],
                                instance: null
                            };
                        }
                        query.markersByDatabase[feature.properties.infos.database_id].database = feature.properties.infos.database_name;
                        query.markersByDatabase[feature.properties.infos.database_id].markers.push(marker);
                        query.markersByDatabase[feature.properties.infos.database_id].cluster = null;
                    });

                    $scope.displayMarkers();

                });

            }

            $scope.displayMarkers = function() {

                arkeoMap.getMap().then(function(map) {

                    var query = arkeoQuery.getCurrent();

                    if (!query) {
                        return;
                    }

                    query.markerClusters = {};

                    if (_.has(arkeoMap.queryControls, query.letter)) {
                        map.removeControl(arkeoMap.queryControls[query.letter]);
                    }
                    var control = new L.Control.Queries(null, null, {
                        collapsed: true,
                        letter: query.letter
                    }).addTo(map);

                    arkeoMap.queryControls[query.letter] = control;

                    _.each(query.markersByDatabase, function(markerGroup, dbID) {

                        if (markerGroup.cluster) {
                            map.removeLayer(markerGroup.cluster);
                            arkeoMap.queryControls[query.letter].removeLayer(markerGroup.cluster);
                        }

                        markerGroup.cluster = new L.markerClusterGroup({
                            maxClusterRadius: arkeoMap.clusterRadiusControl.getCurrentRadius()
                        });
                        markerGroup.cluster.addLayers(markerGroup.markers).addTo(map)

                        // Databases control
                        control.addOverlay(markerGroup.cluster, markerGroup.database);

                    });

                });
            };

            $scope.toggleSiteDetailsDialog = function(id) {
                arkeoDatabase.translateDefinitions().then(function(databaseDefinitions) {
                    arkeoQuery.getSite(id).then(function(siteInfos) {
                        $mdDialog.show({
                                controller: function($scope, $mdDialog, $filter, arkeoProject) {

                                    var project = arkeoProject.get();
                                    $scope.databaseDefinitions = databaseDefinitions;
                                    $scope.id = id;
                                    $scope.hide = function() {
                                        $mdDialog.hide();
                                    };
                                    var characCache = {};
                                    $scope.site = siteInfos.features[0];
                                    $scope.site.properties.infos.exceptional = false;
                                    $scope.site.properties.infos.startingPeriod = {
                                        name: null,
                                        color: null,
                                        startDate: null,
                                        endDate: null
                                    };
                                    $scope.site.properties.infos.endingPeriod = {
                                        name: null,
                                        color: null,
                                        startDate: null,
                                        endDate: null
                                    };
                                    _.each($scope.site.properties.site_ranges, function(sr) {
                                        // Periods
                                        if ($scope.site.properties.infos.startingPeriod.startDate == null || $scope.site.properties.infos.startingPeriod.startDate > sr.start_date1) {
                                            $scope.site.properties.infos.startingPeriod.startDate = sr.start_date1;
                                            $scope.site.properties.infos.startingPeriod.endDate = sr.start_date2;
                                            var chrono = arkeoProject.getChronologyByDates(sr.start_date1, sr.start_date2);
                                            if (chrono) {
                                                $scope.site.properties.infos.startingPeriod.color = chrono.color;
                                                $scope.site.properties.infos.startingPeriod.name = chrono.name;
                                            }
                                            // Hack to undefined period color
                                            if (sr.start_date1 == -2147483648 && sr.start_date2 == 2147483647) {
                                                $scope.site.properties.infos.startingPeriod.isUndefined = true;
                                            }
                                        }
                                        if ($scope.site.properties.infos.endingPeriod.endDate == null || $scope.site.properties.infos.endingPeriod.endDate < sr.end_date2) {
                                            $scope.site.properties.infos.endingPeriod.startDate = sr.end_date1;
                                            $scope.site.properties.infos.endingPeriod.endDate = sr.end_date2;
                                            var chrono = arkeoProject.getChronologyByDates(sr.end_date1, sr.end_date2);
                                            if (chrono) {
                                                $scope.site.properties.infos.endingPeriod.color = chrono.color;
                                                $scope.site.properties.infos.endingPeriod.name = chrono.name;
                                            }
                                            // Hack to undefined period color
                                            if (sr.end_date1 == -2147483648 && sr.end_date2 == 2147483647) {
                                                $scope.site.properties.infos.endingPeriod.isUndefined = true;
                                            }
                                        }
                                        // Organise characs
                                        var cachedIds = [];
                                        _.each(sr.characs, function(charac) {
                                            if (cachedIds.indexOf(charac.id) == 1) {
                                                return;
                                            }
                                            cachedIds.push(charac.id);
                                            if (!sr.charac_sections) {
                                                sr.charac_sections = {};
                                            }
                                            var characInfos = _.assign(charac, arkeoProject.getCharacById(charac.id));
                                            if (characInfos.exceptional) {
                                                $scope.site.properties.infos.exceptional = true;
                                            }
                                            var characRoot = characInfos.hierarchy[0];
                                            if (!_.has(sr.charac_sections, characRoot)) {
                                                sr.charac_sections[characRoot] = {
                                                    name: characRoot,
                                                    characs: []
                                                }
                                            }
                                            sr.charac_sections[characRoot].characs.push(_.assign(characInfos, {
                                                path: characInfos.hierarchy.join(' / ')
                                            }));
                                        });
                                    });
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

                });
            };

            $scope.reset = function() {
                arkeoMap.getMap().then(function(map) {

                    var query = arkeoQuery.getCurrent();

                    _.each(arkeoMap.queryControls, function(control) {
                        map.removeControl(control);
                    });

                    _.each(query.markersByDatabase, function(markerGroup, dbID) {

                        if (markerGroup.cluster) {
                            map.removeLayer(markerGroup.cluster);
                            arkeoMap.queryControls[query.letter].removeLayer(markerGroup.cluster);
                        }
                    });
                });
            };

            // $scope.toggleSiteDetailsDialog()

            /*
             * watch on results
             */

            $scope.$watch(function() {
                return arkeoQuery.getNumQueries(true);
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
