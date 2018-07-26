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

      var capabilities;
      var d = $q.defer();

      for (var c in fetchedServerCapabilities) {
        if (fetchedServerCapabilities.hasOwnProperty(c)) {
          if (c.indexOf('Capabilities') !== -1) {
            var capabilities = fetchedServerCapabilities[c];
          }
        }
      }

      if (!capabilities) {
        d.reject(arkeoMapTiles.newError(3001, 'This server does not offer a capability object'));
        return (d.promise)        
      }

      // Check if server offer data in CRS:3857

      var found3857 = false;

      var crsList = arkeoMapTiles.getAsArray(capabilities.Capability.Layer.CRS);
      var srsList = arkeoMapTiles.getAsArray(capabilities.Capability.Layer.SRS);

      /*if (!angular.isArray(crsList) || crsList.lenght == 0) {
        return d.promise;
      }*/

      crsList.forEach(function(crs) {
        if (crs.match(/3857/)) {
          found3857 = true;
        }
      });

      srsList.forEach(function(srs) {
        if (srs.match(/3857/)) {
          found3857 = true;
        }
      });

      if (!found3857) {
        d.reject(arkeoMapTiles.newError(3002, 'This server does not offers maps with EPSG:3857 CRS'));
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


/*
      function _getLayerRecursive(layer, final) {
        
        console.log('%c Wms::_getLayerRecursive', 'color: #000; background: yellow', layer);
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
*/

      function _getLayerRecursive(layer, final) {
        
        //console.log('%c Wms::_getLayerRecursive', 'color: #000; background: yellow', layer);
        if (angular.isObject(layer)) {
					// If layer is an object process it
         	if (!angular.isObject(layer.Layer)) {
					// Else add it
          	var pl = processLayer(layer);
          	if (pl) {
        			//console.log('%c Wms::_getLayerRecursive final', 'color: red; background: yellow', layer);
            	final.layers.push(pl);
          	}
					} else if (angular.isObject(layer.Layer) && !angular.isArray(layer.Layer)) {
						var t = typeof(layer.Layer);
          	var pl = processLayer(layer.Layer);
          	if (pl) {
            	final.layers.push(pl);
						}
					// Is layer is an array, recurse
          } else if (angular.isArray(layer.Layer) && layer.Layer.length) {
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

       //console.log('%c Wms::parseCapabilities', 'color: #000; background: yellow', capabilities);

      if (capabilities.Service.Abstract) {
        serverCapabilities.abstract = capabilities.Service.Abstract;
      }

      _getLayerRecursive(capabilities.Capability.Layer, serverCapabilities.content.theme);

      //console.log("%c retour", "background: yellow", serverCapabilities);
      d.resolve(serverCapabilities);
      return d.promise;
    };

    function processLayer(fetchedLayer) {

      //console.log('%c Wms::processLayer var fetchedLayer', 'color: #000; background: yellow', fetchedLayer);

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
        var crs = (bbox._CRS) ? bbox._CRS.toLowerCase() : bbox._SRS.toLowerCase();
				if (crs == 'epsg:4326') {
          b = arkeoMap.getValidBoundingBox(bbox._minx, bbox._maxy, bbox._maxx, bbox._miny);
				} else if (crs == 'crs:84') {
          b = arkeoMap.getValidBoundingBox(bbox._maxy, bbox._maxx, bbox._miny, bbox._miny);
          return;
        } else {
					console.warn("The layer "+layer.title+" does not offer CRS:84 or WGS84 projection. Skipping");
					return;
				}
      });

      if (!b) {
        console.warn("No bounding box found for layer "+layer.title);
        return null;
      } else {
        layer.bounding_box = b;
      }

      // Queryable
      if (fetchedLayer._queryable === 1) {
         layer.queryable = true;
      }

      //console.log('%c Wms::processLayer return', 'color: red; background: yellow', layer);

      return layer;
    }

  }]);

})();
