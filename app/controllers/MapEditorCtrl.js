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
    ArkeoGIS.controller('MapEditorCtrl', ['$scope', 'mapService', 'login', '$http', 'X2JS', '$q', function($scope, mapService, login, $http, X2JS, $q) {

        angular.extend($scope, mapService.config);

        $scope.infos = {};

        $scope.wmsLayers = [];

        $scope.getCapabilities = null;

        // $scope.infos.type = 'wmts';
        // $scope.infos.wms_url = 'http://wxs.ign.fr/6cwsohzr2zx1asify37rppfv/geoportail/wmts';
        $scope.infos.type = 'wms';
        $scope.infos.wms_url = 'http://demo.opengeo.org/geoserver/wms';
        $scope.removeAuthor = function(user) {
            if (user.id == login.user.id) {
                arkeoService.showMessage('IMPORT_STEP3.AUTHORS.T_UNABLE_TO_REMOVE_MAIN_AUTHOR');
                database.authors.unshift(user);
            }
        }

        $scope.searchUser = function(txt) {
            return $http.get('/api/users/' + txt).then(function(result) {
                return result.data;
            });
        }

        $scope.getLayers = function(url) {

            $scope.getCapabilities = false;
            if ($scope.infos.wms_url.indexOf('?') == -1) {
                if ($scope.infos.type == 'wmts') {
                    url = $scope.infos.wms_url  + "?request=GetCapabilities&SERVICE=WMTS&version=1.0.0";
                } else {
                    url = $scope.infos.wms_url  + "?request=GetCapabilities&service=WMS&version=1.3.0";
                }
            } else {
                url = $scope.infos.wms_url
            }
            var d = $q.defer();
            $http.get(url).then(function(res) {
                var x2js = new X2JS();
                var capas = x2js.xml_str2json(res.data);
                if (!capas) {
                    d.reject("WMS server returned bad answer");
                    return;
                }
                if ($scope.infos.type == 'wms') {
                    if (angular.isDefined(capas.WMS_Capabilities.Capability.Layer.Layer) && angular.isDefined(capas.WMS_Capabilities.Capability.Layer.Layer)) {
                        angular.forEach(capas.WMS_Capabilities.Capability.Layer.Layer, function(layer) {
                            var l = {
                                title: layer.Title.toString(),
                                identifier: layer.Name.toString(),
                                boundingBox: [layer.BoundingBox._minx+" "+layer.BoundingBox._minx, layer.BoundingBox._miny+" "+layer.BoundingBox._maxy]
                            }
                            $scope.wmsLayers.push(l);
                        });
                    } else {
                        d.reject("WMS server returned bad answer");
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
                                l.boundingBox = [layer.WGS84BoundingBox.UpperCorner.toString(), layer.WGS84BoundingBox.LowerCorner.toString()]
                            }
                            $scope.wmsLayers.push(l);
                        });
                    } else {
                        d.reject("WMTS server returned bad answer");
                        return;
                    }
                }
                $scope.getCapabilities = true;
                console.log($scope.wmsLayers);
                d.resolve()
            },
            function(err) {
                $scope.GetCapabilities = false;
                d.reject(err);
            });
            return d.promise;
        }

        //'http://wxs.ign.fr/6cwsohzr2zx1asify37rppfv/geoportail/wmts?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0'


        // $http.get('http://demo.opengeo.org/geoserver/gwc/service/wmts?request=GetCapabilities').then(function(res) {
        //     var x2js = new X2JS();
        //     var d = x2js.xml_str2json(res.data);
        //     console.log(d);
        // });
        //
        // $http({method: 'GET', url:'http://demo.opengeo.org/geoserver/wms?request=GetCapabilities&service=WMS&version=1.3.0'}).then(function(res) {
        //     var x2js = new X2JS();
        //     var d = x2js.xml_str2json(res.data);
        //     console.log(d);
        // });

    }]);
})();
