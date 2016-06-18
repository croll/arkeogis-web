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

        angular.extend($scope, mapService.config);

        var defaultInfos = {
            authors: [{
                fullname: login.user.firstname + ' ' + login.user.lastname,
                id: login.user.id
            }],
            translations: [],
            wms_url: 'http://demo.opengeo.org/geoserver/wms'
        }

        $scope.infos = angular.copy(defaultInfos);

        $scope.wmsLayers = [];

        $scope.getCapabilities = null;

        $scope.hideFields = true;

        // $scope.infos.type = 'wmts';
        // $scope.infos.wms_url = 'http://wxs.ign.fr/6cwsohzr2zx1asify37rppfv/geoportail/wmts';

        $scope.reset = function(type) {
            $scope.infos = angular.copy($scope.infos);
            $scope.layers.overlays = [];
            $scope.wmsLayers = [];
            $scope.hideFields = true;
            $scope.getCapabilities = null;
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
                map.fitBounds($scope.selectedLayer.boundingBox);
            });
        }

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
            arkeoService.loadLicenses().then(function(l) {
                var licenses = [];
                angular.forEach(l, function(license) {
                    if (license.name !== '-') {
                        licenses.push(license)
                    }
                });
                $scope.licenses = licenses;
            });
        };

        $scope.uploadSHP = function(file) {
            $scope.uploadProgress = 0;
            var reader = new FileReader();
            reader.onload = function(e) {
                shp(e.target.result).then(function(geojson){
                    $scope.geojson = geojson;
                    leafletData.getMap().then(function(map) {
                        var myLayer = L.geoJson().addTo(map);
                        myLayer.addData(geojson);
                        console.log(geojson);
                        map.fitBounds(myLayer.getBounds());
                    });
                }, function(err){
                    console.log(err);
                });
            }
            reader.onprogress = function(e) {
                $scope.uploadProgress = parseInt(100.0 * e.loaded / e.total);
            }
            reader.readAsArrayBuffer(file);
            /*
          return Upload.upload({
            url: 'api/shapefile/togeojson',
            data: {
              shp: file
            }
          });
          */
        };

    }]);
})();
