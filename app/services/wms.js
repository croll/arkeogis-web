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
  ArkeoGIS.service('wmsService', ['$http', '$q', 'X2JS', 'arkeoMap', function($http, $q, X2JS, arkeoMap) {

    var self = this;

    var x2js = new X2JS();

    var computedCapabilities = {
      abstract: '',
      layers: {},
      error: {
        code: null,
        msg: null
      }
    };

    this.setURL = function(url) {
      self.url = url;
    };

    this.getCapabilities = function() {
      var d = $q.defer();
      if (!this.url) {
        d.reject();
      } else {
        var url = self.url + "?request=GetCapabilities&service=WMS&version=1.3.0";
        $http.get(url).then(function(res) {
          var capas = x2js.xml_str2json(res.data);
          if (!capas) {
            d.reject(666);
          } else {
            d.resolve(capas);
          }
        }, function(err) {
          d.reject(err.status);
        });
      }
      return d.promise;
    };

    this.getLayers = function(url) {
      var d = $q.defer();
      if (url) {
        self.url = url;
      }
      this.getCapabilities().then(function(capabilities) {
        computedCapabilities = self.parseWMSCapabilities(capabilities);
        if (computedCapabilities.error.code) {
          d.reject(computedCapabilities.error.code);
        } else {
          d.resolve(computedCapabilities);
        }
      }, function(errorCode) {
        d.reject(errorCode);
      });
      return d.promise;
    };

    this.parseWMSCapabilities = function(capabilities) {

      function _getLayerRecursive(layer, final) {

        if (angular.isObject(layer)) {

          /* {
            name: '',
            title: '',
            url: '',
            MetadataURL: '',
            description: '', // Abstract
            attribution: '', // Attribution.title + Attribution.OnlineResource
            crs: '',
            queryable: false,
            styles: [],
            disabled: false
          } */

          var l = {
            title: layer.Title.toString(),
            name: layer.Name,
            crs: layer.CRS
          };

          if (angular.isArray(layer.Layer) && layer.Layer.length) {
            angular.forEach(layer.Layer, function(l) {
              _getLayerRecursive(l, final.layers);
            });
          }

          final.layers.push(l);
        }

      }

      if (!capabilities || !angular.isObject(capabilities) || !capabilities.WMS_Capabilities) {
        computedCapabilities.error.code = -1;
        return computedCapabilities;
      }

      console.log(capabilities);

      if (capabilities.WMS_Capabilities.Service.Abstract) {
        computedCapabilities.description = capabilities.WMS_Capabilities.Service.Abstract;
      }

      _getLayerRecursive(capabilities.WMS_Capabilities.Capability.Layer, computedCapabilities.layers);

      console.log(computedCapabilities);

      return computedCapabilities;
    };

    function processBoundingBox(boundingBox, type) {

      var result = null;

      var processFuncs = {
        wms: function(bbox) {
          if (bbox._CRS !== '' && bbox._CRS.indexOf("EPSG:4326") === -1 && bbox._CRS.indexOf("CRS:84")) {
            console.log("Wrong CRS detected: " + bbox._CRS);
            return false;
          }
          if (!bbox._minx || !bbox._miny || !bbox._maxx || !bbox._maxy) {
            return [
              [-90, -180],
              [89.999999, 179.999999]
            ];
          } else {
            return arkeoMap.getValidBoundingBox(bbox._minx, bbox._maxy, bbox._maxx, bbox._miny);
          }
        },
        wmts: function(bbox) {
          if (!bbox) {
            return false;
          }
          var upper = bbox.UpperCorner.toString().split(' ');
          var lower = bbox.LowerCorner.toString().split(' ');
          return arkeoMap.getValidBoundingBox(lower[1], upper[0], upper[1], lower[0]);
        }
      };

      if (angular.isArray(boundingBox)) {
        angular.forEach(boundingBox, function(bbox) {
          result = processFuncs[type](bbox);
          if (result) {
            return;
          }
        });
      } else {
        result = processFuncs[type](boundingBox);
      }

      return result;
    }

  }]);

})();
