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
  ArkeoGIS.service('arkeoWMS', ['$http', '$q', 'arkeoMap', 'arkeoMapTiles', function($http, $q, arkeoMap, arkeoMapTiles) {

    var self = this;

    var serverCapabilities;

    var selectedImageFormat = null;

    this.setURL = function(url) {
      self.url = url;
    };

    this.getCapabilities = function(url) {
      serverCapabilities = angular.merge(angular.copy(arkeoMapTiles.serverCapabilitiesStruct), {
        content: {
          theme: angular.copy(arkeoMapTiles.themeStruct)
        }
      });
      return arkeoMapTiles.getCapabilities('WMS', url).then(self.parseCapabilities, function(rejection) {
        return rejection;
      });
    };

    this.parseCapabilities = function(fetchedServerCapabilities) {

      var capabilities = fetchedServerCapabilities.WMS_Capabilities;

      var d = $q.defer();

      // Check if server offer data in CRS:3857

      var foundCRS3857 = false;

      var crsList = arkeoMapTiles.getAsArray(capabilities.Capability.Layer.CRS);

      if (!angular.isArray(crsList)) {
        d.reject(arkeoMapTiles.newError(3001, 'This server does not offert a list of valid CRS'));
        return d.promise;
      }

      crsList.forEach(function(crs) {
        if (crs.match(/3857/)) {
          foundCRS3857 = true;
        }
      });

      if (!foundCRS3857) {
        d.reject(arkeoMapTiles.newError(3002, 'This server does not offert maps with EPSG:3857 CRS'));
        return d.promise;
      }

      // Image format
      var formats = arkeoMapTiles.getAsArray(capabilities.Capability.Request.GetMap.Format);

      formats.forEach(function(imageFormat) {
        // Prefer png imgage
        if (imageFormat.match(/png/)) {
          self.selectedFormat = 'image/png';
        } else if (imageFormat.match(/jpeg/)) {
          self.selectedFormat = 'image/jpeg';
        } else if (imageFormat.match(/jpg/)) {
          self.selectedFormat = 'image/jpg';
        }
      });

      if (!self.selectedFormat) {
        d.reject(arkeoMapTiles.newError(3003, 'No exploitable iformat returned by server'));
        return d.promise;
      }

      function _getLayerRecursive(layer, final) {
        if (angular.isObject(layer)) {

          var pl = processLayer(layer);
          if (pl) {
            final.layers.push(pl);
          }

          if (angular.isArray(layer.Layer) && layer.Layer.length) {
            angular.forEach(layer.Layer, function(l) {
              _getLayerRecursive(l, final);
            });
          }
        }
      }

      // function _getLayerRecursive(currentLayer, theme) {
      //
      //
      //   if (!theme.layers) {
      //     theme.layers = [];
      //   }
      //
      //   if (angular.isArray(currentLayer.Layer) && currentLayer.Layer.length) {
      //
      //     if (angular.isDefined(theme)) {
      //       if (!angular.isArray(theme.theme)) {
      //         theme.theme = [];
      //       }
      //     }
      //
      //     angular.forEach(currentLayer.Layer, function(cl) {
      //        if (cl.Layer && angular.isArray(cl.Layer)) {
      //          theme.theme.push(processLayer(cl));
      //          _getLayerRecursive(cl, theme.theme[theme.theme.length-1]);
      //        } else {
      //          theme.layers.push(processLayer(cl));
      //        }
      //     });
      //   }
      //
      // }

      // console.log(capabilities);

      if (capabilities.Service.Abstract) {
        serverCapabilities.abstract = capabilities.Service.Abstract;
      }

      _getLayerRecursive(capabilities.Capability.Layer, serverCapabilities.content.theme);

      // console.log(serverCapabilities);

      d.resolve(serverCapabilities);

      return d.promise;
    };

    function processLayer(fetchedLayer) {

      var layer = angular.merge(angular.copy(arkeoMapTiles.layerStruct), {
        identifier: arkeoMapTiles.getValue(fetchedLayer.Name),
        title: arkeoMapTiles.getValue(fetchedLayer.Title),
        abstract: arkeoMapTiles.getValue(fetchedLayer.Abstract),
        image_format: self.selectedFormat
      });

      // BoundingBox

      var boundingBox = arkeoMapTiles.getAsArray(fetchedLayer.BoundingBox, true);

      var b;
      boundingBox.forEach(function(bbox) {
        if (bbox._CRS.match(/4326/)) {
          b = arkeoMap.getValidBoundingBox(bbox._minx, bbox._maxy, bbox._maxx, bbox._miny);
          return;
        }
      });

      if (!b) {
        console.error("No bounding box found for layer "+layer.title);
        return null;
      } else {
        layer.bounding_box = b;
      }

      // Queryable
      if (fetchedLayer._queryable === 1) {
         layer.queryable = true;
      }

      return layer;
    }

  }]);

})();
