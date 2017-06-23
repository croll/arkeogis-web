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

    var tilematrixSets = [];

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

        // Fetch abstract from server
        serverCapabilities.title = arkeoMapTiles.getValue(capabilities.ServiceIdentification.Title);
        serverCapabilities.abstract = arkeoMapTiles.getValue(capabilities.ServiceIdentification.Abstract);

        // Cycle trough layers

        angular.forEach(capabilities.Contents.Layer, function(layer) {
          console.log(layer);
          var computedLayer = processLayer(layer);
          serverCapabilities.content.theme.layers.push(computedLayer);
          // Link layer to theme
        });

        // Get server content

        console.log(serverCapabilities);

        d.resolve(serverCapabilities);

      }

      return d.promise;
    };

    function processLayer(fetchedLayer) {

      // console.log(fetchedLayer);

        var layer = angular.merge(angular.copy(arkeoMapTiles.layerStruct), {
          identifier: arkeoMapTiles.getValue(fetchedLayer.Identifier),
          title: arkeoMapTiles.getValue(fetchedLayer.Title),
          abstract: arkeoMapTiles.getValue(fetchedLayer.Abstract),
          format: arkeoMapTiles.getAsArray(fetchedLayer.Format, true),
          infoFormat: arkeoMapTiles.getAsArray(fetchedLayer.InfoFormat, true),
          style: parseStyle(arkeoMapTiles.getAsArray(fetchedLayer.Style, true))
        });

        // Keywords
        if (fetchedLayer.Keywords) {
          layer.keywords = arkeoMapTiles.getAsArray(fetchedLayer.Keywords.Keyword);
        }

        // WGS84BoundingBox
        var upper = fetchedLayer.WGS84BoundingBox.UpperCorner.toString().split(' ');
        var lower = fetchedLayer.WGS84BoundingBox.LowerCorner.toString().split(' ');
        layer.boundingBox = arkeoMap.getValidBoundingBox(lower[1], upper[0], upper[1], lower[0]);

        // Queryable
        if (layer.infoFormat.length) {
          layer.queryable = true;
        }

        // console.log(layer);

        return layer;
    }

    function parseStyle(fetchedStyle) {

      var styles = [];

      angular.forEach(fetchedStyle, function(s) {
        var style = angular.merge(angular.copy(arkeoMapTiles.styleStruct), {
          identifier: arkeoMapTiles.getValue(s.Identifier),
          title: arkeoMapTiles.getValue(s.Title),
          legendURL: {
            format: arkeoMapTiles.getValue(s.LegendURL._format),
            width: arkeoMapTiles.getValue(s.LegendURL._width),
            height: arkeoMapTiles.getValue(s.LegendURL._height),
            href: arkeoMapTiles.getValue(s.LegendURL._href) || arkeoMapTiles.getValue(s.LegendURL['_xlink:href']),
          },
          isDefault: arkeoMapTiles.getValue(s._isDefault)
        });

        styles.push(style);
      });

      return styles;

    }
  }]);

})();
