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
  ArkeoGIS.service('arkeoMapTiles', ['$http', '$q', 'x2js', 'arkeoMap', function($http, $q, x2js, arkeoMap) {

    var self = this;

    this.getCapabilities = function(protocol, url) {
      var d = $q.defer();
      var request = (protocol.toLowerCase() === 'wms') ? '?request=GetCapabilities&service=WMS&version=1.3.0' : '?request=GetCapabilities&SERVICE=WMTS&version=1.0.0';
      if (!url) {
        d.reject();
      } else {
        $http.get(url+request).then(function(res) {
          var capas = x2js.xml_str2json(res.data);
          if (!capas) {
            d.reject(self.newError(2001, 'Unable to parse XML capabilities'));
          } else {
            d.resolve(capas);
          }
        }, function(err) {
          d.reject(self.newError(2002, 'Unable to fetch capabilities. HTTP status: '+err.status));
        });
      }
      return d.promise;
    };

    var errorStruct = {
      code: null,
      msg: null
    };

    this.serverCapabilitiesStruct = {
      title: '',
      abstract: '',
      content: {
        theme: []
      }
    };

    this.themeStruct = {
      identifier: null,
      title: 'MAPEDITOR.FIELD_ROOT_THEME.T_LABEL',
      layers: [],
      theme: null
    };

    this.layerStruct = {
      identifier: '',
      title: '',
      abstract: '',
      keywords: '',
      boundingBox:{},
      style: [],
      format: [],
      resourceURL: '',
      queryable: false, // In WMTS layer.infoFormat shall have at least one entry
      layers: null // Store layer tree
    };

    this.styleStruct = {
      identifier: '',
      title: '',
      legendURL: {
        format: 'png',
        minScale: 0,
        maxScale: 14,
        href: '',
        width: null,
        height: null
      },
      isDefault: false
    };

    this.newError = function(code, msg) {
      return angular.merge(angular.copy(errorStruct), {
        code: code,
        msg: msg
      });
    };

    this.getValue = function(o, preserveObject) {
      if (angular.isUndefined(o)) {
        return null;
      }
      if (angular.isString(o)) {
        return o;
      }
      if (angular.isObject(o)) {
        if (preserveObject) {
          return o;
        } else {
          return o.toString();
        }
      }
      if (angular.isArray(o)) {
        return o;
      }
      if (typeof o === 'boolean') {
        return o;
      }
      return this.newError(-666, "Unable to identify this thing");
    };

    this.getAsArray = function(o, preserveObject) {
      var val = this.getValue(o, preserveObject);
      if (!val) {
        return [];
      } else {
        return [val];
      }
    };

    this.asBool = function(o) {
      switch(o) {
        case 'true':
          return true;
        case 'false':
          return false;
      }
      return false;
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
