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
  ArkeoGIS.service('arkeoWMS', ['$http', '$q', 'arkeoMapTiles', function($http, $q, arkeoMapTiles) {

    var self = this;

    var serverCapabilities = {
      abstract: '',
      layers: {}
    };

    var imageFormats = [];

    this.setURL = function(url) {
      self.url = url;
    };

    this.getCapabilities = function(url) {
      return arkeoMapTiles.getCapabilities('WMS', url).then(self.parseCapabilities, function(rejection) {
        return rejection;
      });
    };

    this.parseCapabilities = function(capabilities) {

      var d = $q.defer();

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

          final.layers.push(l);

          if (angular.isArray(layer.Layer) && layer.Layer.length) {
            angular.forEach(layer.Layer, function(l) {
              _getLayerRecursive(l, final);
            });
          }

        }

      }

      console.log(capabilities);

      if (capabilities.WMS_Capabilities.Service.Abstract) {
        serverCapabilities.abstract = capabilities.WMS_Capabilities.Service.Abstract;
      }

      _getLayerRecursive(capabilities.WMS_Capabilities.Capability.Layer, serverCapabilities.layers);

      console.log(serverCapabilities);

      d.resolve(serverCapabilities);

      return d.promise;
    };

  }]);

})();
