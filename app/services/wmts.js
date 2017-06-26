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
  ArkeoGIS.service('arkeoWMTS', ['$http', '$q', 'arkeoMap', 'arkeoMapTiles', function($http, $q, arkeoMap, arkeoMapTiles) {

    var self = this;

    var serverCapabilities = angular.merge(angular.copy(arkeoMapTiles.serverCapabilitiesStruct), {
      content: {
        theme: angular.copy(arkeoMapTiles.themeStruct)
      }
    });

    this.setURL = function(url) {
      self.url = url;
    };

    this.getCapabilities = function(url) {
      return arkeoMapTiles.getCapabilities('WMTS', url).then(self.parseCapabilities, function(rejection) {
        return rejection;
      });
    };

    this.parseCapabilities = function(fetchedServerCapabilities) {

      var capabilities = fetchedServerCapabilities.Capabilities;

      var d = $q.defer();

      // Check exceptions
      if (fetchedServerCapabilities.ExceptionReport) {
        var exception = arkeoMapTiles.getValue(fetchedServerCapabilities.ExceptionReport.Exception);
        d.reject(arkeoMapTiles.newError(2003, exception));
      } else {

        console.log(capabilities);

        var tms = processTileMatrixSets(capabilities.Contents.TileMatrixSet);

        if (!tms) {
          d.reject(arkeoMapTiles.newError(2004, 'Server does not offer tileMatrixSet in EPSG:3857'));
        }

        // Fetch abstract from server
        serverCapabilities.title = arkeoMapTiles.getValue(capabilities.ServiceIdentification.Title);
        serverCapabilities.abstract = arkeoMapTiles.getValue(capabilities.ServiceIdentification.Abstract);

        // Cycle trough layers
        angular.forEach(capabilities.Contents.Layer, function(layer) {
          var computedLayer = processLayer(layer, tms);
          if (computedLayer) {
            serverCapabilities.content.theme.layers.push(computedLayer);
          }
          // Link layer to theme
          // TODO
        });

        // console.log(serverCapabilities);

        d.resolve(serverCapabilities);

      }

      return d.promise;
    };

    function processLayer(fetchedLayer, tileMatrixSet) {

      // console.log(fetchedLayer);

      // Check if layer offers supported web image format

      var selectedFormat = null;

      var format = arkeoMapTiles.getAsArray(fetchedLayer.Format);

      format.forEach(function(imageFormat) {
        // Prefer png imgage
        if (imageFormat.match(/png/)) {
          selectedFormat = 'image/png';
        } else if (imageFormat.match(/jpeg/)) {
          selectedFormat = 'image/jpeg';
        } else if (imageFormat.match(/jpg/)) {
          selectedFormat = 'image/jpg';
        }
      });

      if (!selectedFormat) {
        return null;
      }

      // Verify if layer purposes a valid TileMatrixSetLink

      var tileMatrixSetLinks = arkeoMapTiles.getAsArray(fetchedLayer.TileMatrixSetLink, true);

      if (!tileMatrixSetLinks) {
        return null;
      }

      var foundValidTMSL = false;

      tileMatrixSetLinks.forEach(function(tmsl){
        if (arkeoMapTiles.getValue(tmsl.TileMatrixSet) === tileMatrixSet.identifier) {
          foundValidTMSL = true;
        }
      });

      if (!foundValidTMSL) {
        return null;
      }

      // console.log(tileMatrixSetIdentifier);
      // console.log(fetchedLayer);

      var layer = angular.merge(angular.copy(arkeoMapTiles.layerStruct), {
        identifier: arkeoMapTiles.getValue(fetchedLayer.Identifier),
        title: arkeoMapTiles.getValue(fetchedLayer.Title),
        abstract: arkeoMapTiles.getValue(fetchedLayer.Abstract),
        format: format,
        image_format: selectedFormat,
        infoFormat: arkeoMapTiles.getAsArray(fetchedLayer.InfoFormat, true),
        style: processStyle(arkeoMapTiles.getAsArray(fetchedLayer.Style, true)),
        tile_matrix_set: tileMatrixSet.identifier,
        tile_matrix_string: tileMatrixSet.tileMatrixString
      });

      // Keywords
      if (fetchedLayer.Keywords) {
        layer.keywords = arkeoMapTiles.getAsArray(fetchedLayer.Keywords.Keyword);
      }

      // WGS84BoundingBox
      var upper = fetchedLayer.WGS84BoundingBox.UpperCorner.toString().split(' ');
      var lower = fetchedLayer.WGS84BoundingBox.LowerCorner.toString().split(' ');
      layer.bounding_box = arkeoMap.getValidBoundingBox(lower[1], upper[0], upper[1], lower[0]);

      // Queryable
      if (layer.infoFormat.length) {
        layer.queryable = true;
      }

      // console.log(layer);

      return layer;
    }

    function processStyle(fetchedStyle) {

      var styles = [];

      angular.forEach(fetchedStyle, function(s) {

        // Style default properties

        var style = angular.merge(angular.copy(arkeoMapTiles.styleStruct), {
          identifier: arkeoMapTiles.getValue(s.Identifier),
          title: arkeoMapTiles.getValue(s.Title),
          isDefault: arkeoMapTiles.getValue(s._isDefault)
        });

        // Legend URL

        if (s.LegendURL) {
          style.legendURL = {
            format: arkeoMapTiles.getValue(s.LegendURL._format),
            width: arkeoMapTiles.getValue(s.LegendURL._width),
            height: arkeoMapTiles.getValue(s.LegendURL._height),
            href: arkeoMapTiles.getValue(s.LegendURL._href) || arkeoMapTiles.getValue(s.LegendURL['_xlink:href']),
          };
        }

        styles.push(style);
      });

      return styles;

    }

    function processTileMatrixSets(tileMatrixSets) {

      var selectedTileMatrixSet = null;

      tileMatrixSets.forEach(function(tms) {

        var supportedCRS = arkeoMapTiles.getValue(tms.SupportedCRS);

        var tileMatrixArray = [];

        // Only get EPSG:3857 tiles to be able to overlays them with OSM and Google ones
        if (supportedCRS.match(/3857/)) {
          selectedTileMatrixSet = {
            identifier: arkeoMapTiles.getValue(tms.Identifier),
            tileMatrixString: ''
          };
          tms.TileMatrix.forEach(function(tm) {
            // Get only tilematrix with size of 256 px
            if (tm.TileWidth === '256' && tm.TileHeight === '256') {
              tileMatrixArray.push(arkeoMapTiles.getValue(tm.Identifier));
            }
          });
          selectedTileMatrixSet.tileMatrixString = tileMatrixArray.join(',');
          return selectedTileMatrixSet;
        }

      });

      return selectedTileMatrixSet;

    }

    this.formatTileMatrixStringForLeaflet = function(tileMatrixString) {

      var outp = [];

      tileMatrixString.split(',').forEach(function(id) {

        outp.push({
          identifier: id,
          topLeftCorner : new L.LatLng(20037508.3428,-20037508.3428)
        });

      });

      return outp;

    };

  }]);

})();
