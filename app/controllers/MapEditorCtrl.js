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
    ArkeoGIS.controller('MapEditorCtrl', ['$scope', 'arkeoService', 'mapService', 'login', '$http', 'X2JS', '$q', 'leafletData', 'Upload', function($scope, arkeoService, mapService, login, $http, X2JS, $q, leafletData, Upload) {

        var self = this;

        angular.extend($scope, mapService.config);

        this.defaultInfos = {
            authors: [{
                fullname: login.user.firstname + ' ' + login.user.lastname,
                id: login.user.id
            }],
            translations: {}
        }

        $scope.infos = angular.copy(this.defaultInfos);

        // Debug

        $scope.infos = angular.copy({
                authors: [{
                    fullname: login.user.firstname + ' ' + login.user.lastname,
                    id: login.user.id
                }],
                wms_url: 'http://demo.opengeo.org/geoserver/wms',
                min_scale: 2,
                max_scale: 10,
                declared_creation_date: new Date(),
                max_usage_date: new Date(),
                start_date: -1200,
                end_date: 300,
                license: 'pouet license',
                attribution: 'atribution pouet',
                copyright: 'copyright pouet',
                translations: {
                    description: {
                        fr: 'desc fr',
                        en: 'desc en',
                        es: 'desc es'
                    },
                    name: {
                        fr: 'name fr',
                        en: 'name en',
                        es: 'name es'
                    }
                }
            },
            $scope.infos);

        $scope.wmsLayers = [];

        $scope.getCapabilities = null;

        $scope.hideFields = true;

        // $scope.infos.type = 'wmts';
        // $scope.infos.wms_url = 'http://wxs.ign.fr/6cwsohzr2zx1asify37rppfv/geoportail/wmts';

        $scope.reset = function(type) {
            //$scope.infos = angular.copy(this.defaultInfos);
            $scope.layers.overlays = [];
            $scope.wmsLayers = [];
            $scope.hideFields = true;
            $scope.getCapabilities = null;
            $scope.file = null;
            if ($scope.geojsonLayer) {
                leafletData.getMap().then(function(map) {
                    map.removeLayer($scope.geojsonLayer);
                });
            }
        }

        $scope.getLayers = function(url) {

            $scope.wmsLayers = [];

            $scope.getCapabilities = false;
            if ($scope.infos.wms_url.indexOf('?') == -1) {
                if ($scope.infos.type == 'wmts') {
                    url = $scope.infos.wms_url + "?request=GetCapabilities&SERVICE=WMTS&version=1.0.0";
                } else {
                    url = $scope.infos.wms_url + "?request=GetCapabilities&service=WMS&version=1.3.0";
                }
            } else {
                url = $scope.infos.wms_url
            }
            var d = $q.defer();
            $http.get(url).then(function(res) {
                    var x2js = new X2JS();
                    var capas = x2js.xml_str2json(res.data);
                    if (!capas) {
                        d.reject();
                        arkeoService.showMessage('MAPEDITOR.MESSAGE_GET_LAYER_LIST.T_ERROR', 'error')
                        $scope.hideFields = false;
                        return;
                    }
                    if ($scope.infos.type == 'wms') {
                        if (angular.isDefined(capas.WMS_Capabilities.Capability.Layer.Layer) && angular.isDefined(capas.WMS_Capabilities.Capability.Layer.Layer)) {
                            angular.forEach(capas.WMS_Capabilities.Capability.Layer.Layer, function(layer) {
                                var l = {
                                    title: layer.Title.toString(),
                                    identifier: layer.Name.toString(),
                                }
                                if (!layer.BoundingBox._minx || !layer.BoundingBox._miny || !layer.BoundingBox._maxx || !layer.BoundingBox._maxy) {
                                    l.boundingBox = [
                                        [-180, -90],
                                        [180, 90]
                                    ];
                                } else {
                                    l.boundingBox = [
                                        [layer.BoundingBox._minx, layer.BoundingBox._miny],
                                        [layer.BoundingBox._maxx, layer.BoundingBox._maxy]
                                    ]
                                }
                                $scope.wmsLayers.push(l);
                            });
                        } else {
                            d.reject();
                            arkeoService.showMessage('MAPEDITOR.MESSAGE_GET_LAYER_LIST.T_ERROR', 'error')
                            $scope.hideFields = false;
                            return;
                        }
                    } else if ($scope.infos.type == 'wmts') {
                        if (angular.isDefined(capas.Capabilities) && angular.isDefined(capas.Capabilities.Contents.Layer)) {
                            angular.forEach(capas.Capabilities.Contents.Layer, function(layer) {
                                var l = {
                                    title: layer.Title.toString(),
                                    identifier: layer.Identifier.toString(),
                                    format: layer.Format.toString(),
                                }
                                if (angular.isDefined(layer.WGS84BoundingBox)) {
                                    var upper = layer.WGS84BoundingBox.UpperCorner.toString().split(' ');
                                    var lower = layer.WGS84BoundingBox.LowerCorner.toString().split(' ');
                                    l.boundingBox = [
                                        [upper[1], upper[0]],
                                        [lower[1], lower[0]]
                                    ];
                                }
                                $scope.wmsLayers.push(l);
                            });
                        } else {
                            d.reject("WMTS server returned bad answer");
                            $scope.hideFields = false;
                            arkeoService.showMessage('MAPEDITOR.MESSAGE_GET_LAYER_LIST.T_ERROR', 'error')
                            return;
                        }
                    }
                    arkeoService.showMessage('MAPEDITOR.MESSAGE_GET_LAYER_LIST.T_SUCCESS', 'error')
                    $scope.getCapabilities = true;
                    // console.log($scope.wmsLayers);
                    d.resolve()
                },
                function(err) {
                    $scope.GetCapabilities = false;
                    d.reject(err);
                });
            return d.promise;
        }

        $scope.onLayerSelected = function() {
            angular.forEach($scope.wmsLayers, function(wl) {
                if ($scope.selectedLayerId == wl.identifier) {
                    $scope.selectedLayer = wl;
                }
            });

            switch ($scope.infos.type) {
                case 'wms':
                    setWMSPreview();
                    break;
                case 'wmts':
                    setWMTSPreview();
                    break;
            }

            $scope.hideFields = false;
        }

        var setWMSPreview = function() {
            if ($scope.layers.overlays.hasOwnProperty('preview')) {
                delete $scope.layers.overlays.preview;
            }
            setTimeout(function() {
                $scope.layers.overlays.preview = {
                    name: $scope.selectedLayer.title,
                    type: 'wms',
                    url: $scope.infos.wms_url,
                    visible: true,
                    layerOptions: {
                        layers: $scope.selectedLayer.identifier,
                        opacity: 0.70
                    }
                };
                leafletData.getMap().then(function(map) {
                    $scope.infos.geographical_extent_geom = JSON.stringify(L.rectangle($scope.selectedLayer.boundingBox).toGeoJSON());
                    map.fitBounds($scope.selectedLayer.boundingBox);
                });
            }, 0);
        }

        var setWMTSPreview = function() {
            var layer = new L.TileLayer.WMTS($scope.infos.wms_url, {
                layer: $scope.selectedLayer.identifier,
                //    style: "normal",
                //    tilematrixSet: "PM",
                //    format: "image/jpeg",
            });
            leafletData.getMap().then(function(map) {
                map.addLayer(layer);
                $scope.infos.geographical_extent_geom = JSON.stringify(L.rectangle($scope.selectedLayer.boundingBox).toGeoJSON());
                map.fitBounds($scope.selectedLayer.boundingBox);
            });
        }

        $scope.processSHP = function(file) {
            $scope.shpProcessingProgress = 0;
            if (!file) {
                return;
            }
            if (!file.type.indexOf('zip') == -1) {
                arkeoService.showMessage('MAPEDITOR.MESSAGE_NOT_ZIP_FILE.T_ERROR', 'error');
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                shp(e.target.result).then(function(geojson) {
                    $scope.infos.geojson = geojson;
                    leafletData.getMap().then(function(map) {
                        if ($scope.geojsonLayer) {
                            map.removeLayer($scope.geojsonLayer);
                        }
                        $scope.geojsonLayer = L.geoJson().addTo(map)
                        $scope.geojsonLayer.addData(geojson);
                        var bounds = $scope.geojsonLayer.getBounds();
                        map.fitBounds(bounds);
                        $scope.infos.geographical_extent_geom = JSON.stringify(L.rectangle(bounds).toGeoJSON().geometry);
                        $scope.hideFields = false;
                        console.log(L.rectangle(bounds).toGeoJSON().geometry);
                    }, function(err) {
                        console.log("err");
                        arkeoService.showMessage('MAPEDITOR.MESSAGE_SHP_LOADING.T_ERROR', 'error')
                    });
                }, function(err) {
                    arkeoService.showMessage('MAPEDITOR.MESSAGE_SHP_LOADING.T_ERROR', 'error')
                });
            }
            reader.onprogress = function(e) {
                $scope.shpProcessingProgress = parseInt(100.0 * e.loaded / e.total);
            }
            reader.readAsArrayBuffer(file);
        };

        $scope.setScale = function(lvl) {
            var level = lvl || 'min';
            leafletData.getMap().then(function(map) {
                $scope.infos[level + '_scale'] = map.getZoom();
            });
        }

        $scope.removeAuthor = function(user) {
            if (user.id == login.user.id) {
                arkeoService.showMessage('IMPORT_STEP3.AUTHORS.T_UNABLE_TO_REMOVE_MAIN_AUTHOR');
                infos.authors.unshift(user);
            }
        }

        $scope.searchUser = function(txt) {
            return $http.get('/api/users/' + txt).then(function(result) {
                return result.data;
            });
        }

        $scope.loadLicenses = function() {
            arkeoService.loadLicenses(true).then(function(l) {
                var licenses = [];
                angular.forEach(l, function(license) {
                    licenses.push(license)
                });
                $scope.licenses = licenses;
            });
        };

        $scope.submit = function(form) {
            $scope.uploadProgress = 0;
            var dbObj = angular.copy($scope.infos);
            // License id
            if (!dbObj.license_id) {
                dbObj.license_id = 0;
            }
            // Authors
            if ($scope.type == 'shp') {
                dbObj.authors = [];
                angular.forEach($scope.infos.authors, function(author) {
                    dbObj.authors.push(author.id);
                });
                // Type of wm(t)s layer
            } else {
                dbObj.type = $scope.type;
                dbObj.author_id = login.user.id;
            }
            // translations
            delete dbObj.translations;
            angular.extend(dbObj, formatTranslation('description', $scope.infos.translations.description));
            angular.extend(dbObj, formatTranslation('name', $scope.infos.translations.name));
            // geojson
            dbObj.geojson_with_data = JSON.stringify($scope.infos.geojson);
            dbObj.geojson = JSON.stringify(removeGeoJSONDatas($scope.infos.geojson));
            console.log(dbObj);
            var url = ($scope.type == 'shp') ? '/api/shpLayer' : '/api/wmLayer';
            if (form.$valid) {
                Upload.upload({
                    url: url,
                    data: {
                        csv: $scope.file,
                        infos: Upload.json(dbObj)
                    }
                }).then(function() {
                    arkeoService.showMessage('MAPEDITOR.MESSAGE_SAVE_SUCCESS')
                    $state.go('arkeogis.mapeditor');
                }, function(resp) {
                    arkeoService.showMessage('MAPEDITOR.MESSAGE_SAVE_FAILED')
                }, function(evt) {
                    $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
                });
            }
        };

        function removeGeoJSONDatas(geojson) {
            if (typeof(geojson) == null || !angular.isDefined(geojson.features)) {
                return null;
            }
            for (var i = 0; i < geojson.features.length; i++) {
                delete geojson.features[i].properties
            }
            return geojson;
        }

        function formatTranslation(property, container) {
            var outp = {};
            outp[property] = [];
            for (var iso_code in container) {
                if (container.hasOwnProperty(iso_code)) {
                    if (iso_code && container[iso_code]) {
                        outp[property].push({
                            lang_isocode: iso_code,
                            text: container[iso_code]
                        });
                    }
                }
            }
            return outp;
        }

    }]);
})();
