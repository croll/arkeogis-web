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
  ArkeoGIS.controller('MapEditorCtrl', ['$scope', '$state', '$filter', 'arkeoService', 'arkeoMap', 'arkeoWMS', 'arkeoWMTS', 'login', '$http', '$q', 'leafletData', 'Upload', 'layer', 'arkeoLang', function($scope, $state, $filter, arkeoService, arkeoMap, arkeoWMS, arkeoWMTS, login, $http, $q, leafletData, Upload, layer, arkeoLang) {

    angular.extend($scope, arkeoMap.config);

    removeAllLayers();

    this.defaultInfos = {
      authors: [{
        fullname: login.user.firstname + ' ' + login.user.lastname,
        id: login.user.id
      }],
      translations: {
        name: {
          en: ''
        },
        description: {
          en: ''
        }
      }
    };

    if (angular.isDefined(layer)) {
      $scope.infos = angular.copy(layer);
      $scope.hideFields = false;
      $scope.selectedLayer = layer;
      $scope.selectedLayer.title = $filter('arkTranslate')(layer.translations.name);
      if (angular.isDefined(layer.geographical_extent_geom.coordinates)) {
        $scope.selectedLayer.bounding_box = layer.geographical_extent_geom.coordinates[0];
      }
      $scope.type = layer.type;
      console.log($scope.infos);
      if (layer.type === 'shp') {
        leafletData.getMap().then(function(map) {
          $scope.geojsonLayer = L.geoJson($scope.infos.geojson).addTo(map);
          var bounds = $scope.geojsonLayer.getBounds();
          map.fitBounds(bounds);
        });
      } else if (layer.type === 'wms') {
        setWMSPreview();
      } else if (layer.type === 'wmts') {
        setWMTSPreview();
      }
    } else {
      $scope.infos = angular.copy(this.defaultInfos);
      $scope.hideFields = true;
    }

    arkeoLang.autoSetTranslationLang2FromDatas([$scope.infos.translations.description, $scope.infos.translations.name]);

    $scope.$watch('infos.translations.name.en', function(newVal) {
      if (!newVal || (newVal && newVal === '')) {
        $scope.lang2SelectDisabled = true;
        $scope.mapEditorForm.name2.$setValidity('english_required', false);
      } else {
        $scope.lang2SelectDisabled = false;
        $scope.mapEditorForm.name2.$setValidity('english_required', true);
      }
    }, true);

    $scope.$watch('infos.translations.description.en', function(newVal) {
      if (!newVal || (newVal && newVal === '')) {
        $scope.lang2SelectDisabled = true;
        $scope.mapEditorForm.description2.$setValidity('english_required', false);
      } else {
        $scope.lang2SelectDisabled = false;
        $scope.mapEditorForm.description2.$setValidity('english_required', true);
      }
    }, true);

    $scope.$watch('type', function(newVal) {
      if (newVal && newVal === 'wmts') {
      //  $scope.infos.url = 'http://wxs.ign.fr/b648puasvhkm1f46dk8hft4i/wmts';
        $scope.infos.url = 'https://www.cigalsace.org/geoserver/gwc/service/wmts';
      } else {
        // $scope.infos.url = 'http://demo.opengeo.org/geoserver/wms';

        $scope.infos.url = 'https://neo.sci.gsfc.nasa.gov/wms/wms';
      }
    }, true);

    $scope.remoteServerThemes = [];

    $scope.showWMInputs = false;

    $scope.type = 'wmts';

    $scope.selectLayer = function(layer) {
      $scope.infos.identifier = layer.identifier;
      $scope.infos.image_format = layer.image_format;
      $scope.infos.tile_matrix_set = layer.tile_matrix_set;
      $scope.infos.tile_matrix_string = layer.tile_matrix_string;
      $scope.hideFields = false;
      $scope.selectedLayer = layer;
      $scope.refreshPreview();
      // Select best image format
    };

    $scope.reset = function() {
      $scope.remoteServerThemes = [];
      $scope.hideFields = true;
      $scope.file = null;
      if ($scope.geojsonLayer) {
        leafletData.getMap().then(function(map) {
          map.removeLayer($scope.geojsonLayer);
        });
      }
    };

    $scope.delete = function() {
      if (!layer.id) {
        console.log("No layer id specified, unable to delete");
        return false;
      }
      $http({
        method: 'POST',
        url: '/api/layer/delete',
        data: {
          id: layer.id,
          type: layer.type
        }
      }).then(function() {
        arkeoService.showMessage('MAPEDITOR.MESSAGE.T_DELETE_OK');
        removeAllLayers();
        $state.go('arkeogis.mapeditor-list');
      }, function(err) {
        arkeoService.showMessage('MAPEDITOR.MESSAGE.T_DELETE_FAILED', 'error');
        console.log(err);
      });
    };

    $scope.getLayers = function() {

      $scope.remoteServerThemes = [];

      $scope.showWMInputs = false;

      if ($scope.infos.url.indexOf('?') === -1) {
      var service = ($scope.type === 'wms') ? eval('arkeoWMS') : eval('arkeoWMTS');
       var url = $scope.infos.url;
       if ($scope.infos.use_proxy && url.substring(0, 8) !== '/proxy/?') {
         url = '/proxy/?'+url;
       }
        service.getCapabilities(url).then(function(capas) {
          $scope.remoteServerThemes = capas.content;

          $scope.showWMInputs = true;
        }, function(err) {
          $scope.errorMsg = err.msg;
        });
      }

      /*
      if ($scope.type == 'wms') {
        if (angular.isDefined(capas.WMS_Capabilities.Capability.Layer.Layer) && angular.isDefined(capas.WMS_Capabilities.Capability.Layer.Layer)) {
            angular.forEach(capas.WMS_Capabilities.Capability.Layer.Layer, function(layer) {
                var l = {
                  title: layer.Title.toString(),
                  identifier: layer.Name.toString(),
                  boundingBox: processBoundingBox(layer.BoundingBox, 'wms')
                }
                if (l.boundingBox) {
                  $scope.wmsLayers.push(l);
                }
              });
            } else {
              d.reject();
              arkeoService.showMessage('MAPEDITOR.MESSAGE_GET_LAYER_LIST.T_ERROR', 'error')
              $scope.hideFields = false;
              return;
            }
          } else if ($scope.type == 'wmts') {
            if (angular.isDefined(capas.Capabilities) && angular.isDefined(capas.Capabilities.Contents.Layer)) {
              angular.forEach(capas.Capabilities.Contents.Layer, function(layer) {
                var l = {
                  style: "normal",
                  tilematrixSet: "PM",
                  title: layer.Title.toString(),
                  identifier: layer.Identifier.toString(),
                  //format: layer.Format.toString()
                }
                l.boundingBox = processBoundingBox(layer.WGS84BoundingBox, 'wmts');
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
          d.resolve()
        },
        function(err) {
          $scope.GetCapabilities = false;
          d.reject(err);
        });
        */
    };

    $scope.refreshPreview = function() {
      removeAllLayers();
      switch ($scope.type) {
        case 'wms':
          setWMSPreview();
          break;
        case 'wmts':
          setWMTSPreview();
          break;
      }
    };

    $scope.processSHP = function(file) {
      $scope.shpProcessingProgress = 0;
      if (!file) {
        return;
      }
      if (file.type.indexOf('zip') !== -1) {
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
            $scope.geojsonLayer = L.geoJson().addTo(map);
            $scope.geojsonLayer.addData($scope.infos.geojson);
            var bounds = $scope.geojsonLayer.getBounds();
            map.fitBounds(bounds);
            $scope.infos.geographical_extent_geom = L.rectangle(bounds).toGeoJSON().geometry;
            $scope.hideFields = false;
          }, function(err) {
            console.log(err);
            arkeoService.showMessage('MAPEDITOR.MESSAGE_SHP_LOADING.T_ERROR', 'error');
          });
        }, function(err) {
            console.log(err);
          arkeoService.showMessage('MAPEDITOR.MESSAGE_SHP_LOADING.T_ERROR', 'error');
        });
      };
      reader.onprogress = function(e) {
        $scope.shpProcessingProgress = parseInt(100.0 * e.loaded / e.total);
      };
      reader.readAsArrayBuffer(file);
    };

    $scope.setScale = function(lvl) {
      var level = lvl || 'min';
      leafletData.getMap().then(function(map) {
        $scope.infos[level + '_scale'] = map.getZoom();
      });
    };

    $scope.removeAuthor = function(user) {
      if (user.id === login.user.id) {
        arkeoService.showMessage('IMPORT_STEP3.AUTHORS.T_UNABLE_TO_REMOVE_MAIN_AUTHOR');
        $scope.infos.authors.unshift(user);
      }
    };

    $scope.searchUser = function(txt) {
      return $http.get('/api/users/' + txt).then(function(result) {
        return result.data;
      });
    };

    $scope.loadLicenses = function() {
      arkeoService.loadLicenses(true).then(function(l) {
        var licenses = [];
        angular.forEach(l, function(license) {
          licenses.push(license);
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
      dbObj.authors = [];
      angular.forEach($scope.infos.authors, function(author) {
        dbObj.authors.push(author.id);
      });
      dbObj.geographical_extent_geom = JSON.stringify($scope.infos.geographical_extent_geom);
      if ($scope.type === 'shp') {
        // Authors
        // geojson
        dbObj.geojson_with_data = JSON.stringify($scope.infos.geojson);
        dbObj.geojson = JSON.stringify(removeGeoJSONDatas($scope.infos.geojson));
        // Type of wm(t)s layer
      } else {
        // dbObj.type = $scope.type;
        // dbObj.identifier = $scope.infos.identifier;
        // dbObj.url = $scope.infos.url;
      }
      // translations
      delete dbObj.translations;
      angular.extend(dbObj, formatTranslation('description', $scope.infos.translations.description));
      angular.extend(dbObj, formatTranslation('name', $scope.infos.translations.name));
      var url = ($scope.type === 'shp') ? '/api/shpLayer' : '/api/wmLayer';
      console.warn(dbObj);
      if (form.$valid) {
        if ($scope.file) {
          Upload.upload({
            url: url,
            data: {
              csv: $scope.file,
              infos: Upload.json(dbObj)
            }
          }).then(function() {
            arkeoService.showMessage('MAPEDITOR.MESSAGE.SAVE_T_SUCCESS');
            removeAllLayers();
            $state.go('arkeogis.mapeditor-list');
          }, function(err) {
            arkeoService.showMessage('MAPEDITOR.MESSAGE.SAVE_T_FAILED');
            console.log(err);
          }, function(evt) {
            $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
          });
        } else {
          $http({
            url: url,
            method: 'POST',
            data: dbObj
          }).then(function() {
            arkeoService.showMessage('MAPEDITOR.MESSAGE_SAVE.T_SUCCESS');
            removeAllLayers();
            $state.go('arkeogis.mapeditor-list');
          }, function(err) {
            console.log(err);
            arkeoService.showMessage('MAPEDITOR.MESSAGE_SAVE.T_FAILED');
          });

        }
      }
    };

    function removeGeoJSONDatas(geojson) {
      for (var i = 0; i < geojson.features.length; i++) {
        delete geojson.features[i].properties;
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

    // Remove all layers except OSM tiles
    function removeAllLayers() {
      if (typeof($scope.layers.overlays) === 'object' && typeof($scope.layers.overlays.preview) === 'object') {
        $scope.layers.overlays.preview = {};
      }
    }

    function setWMSPreview() {
      var url = ($scope.infos.use_proxy) ? '/proxy/?'+$scope.infos.url : $scope.infos.url;
      setTimeout(function() {
        $scope.layers.overlays.preview = {
          name: $scope.selectedLayer.title,
          type: 'wms',
          url: url,
          visible: true,
          layerOptions: {
            layers: $scope.infos.identifier,
            format: $scope.infos.image_format,
            opacity: 0.70
          }
        };
        leafletData.getMap().then(function(map) {
          $scope.infos.geographical_extent_geom = L.rectangle($scope.selectedLayer.bounding_box).toGeoJSON().geometry;
          map.fitBounds($scope.selectedLayer.bounding_box);
        });
      }, 0);
    }

    function setWMTSPreview() {
      setTimeout(function() {

        var url = ($scope.infos.use_proxy) ? '/proxy/?'+$scope.infos.url : $scope.infos.url;

        var layer = new L.TileLayer.WMTS(url, {
          layer: $scope.infos.identifier,
          style: "normal",
          format: $scope.infos.image_format,
          tilematrixSet: $scope.selectedLayer.tile_matrix_set,
          matrixIds: arkeoWMTS.formatTileMatrixStringForLeaflet($scope.selectedLayer.tile_matrix_string),
          opacity: 0.70
        });

        leafletData.getMap().then(function(map) {
          map.addLayer(layer);
          $scope.infos.geographical_extent_geom = L.rectangle($scope.selectedLayer.bounding_box).toGeoJSON().geometry;
          map.fitBounds($scope.selectedLayer.bounding_box);
        });
      }, 0);
    }

  }]);
})();

(function() {
  'use strict';
  ArkeoGIS.controller('MapEditorListCtrl', ['$scope', 'layerService', 'arkeoMap', 'login', '$http', '$state', 'translations', function($scope, layerService, arkeoMap, login, $http, $state, translations) {

    $scope.filter = {
      show: false,
      options: {}
    };

    $scope.query = {
      filter: '',
      order: null,
      limitOptions: [10, 25, 50, {
        label: translations['GENERAL.TABLE_PAGINATION.T_ALL'],
        value: function() {
          return 10000;
        }
      }],
      limit: 20,
      page: 1
    };

    $scope.onOrderChange = function(order) {
      $scope.order = order;
    };

    $scope.removeFilter = function() {
      $scope.filter.show = false;
      $scope.query.filter = '';

      if ($scope.filter.form.$dirty) {
        $scope.filter.form.$setPristine();
      }
    };

    layerService.getLayers().then(function(layers) {
      $scope.mapLayers = layers;
    }, function(errorCode) {
      console.log("ERROR CODE: "+errorCode);
    });

    $scope.edit = function(type, id) {
      $state.go('arkeogis.mapeditor', {
        type: type,
        id: id
      });
    };

  }]);
})();
