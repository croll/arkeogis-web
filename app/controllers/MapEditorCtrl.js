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

    var self = this;

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
      },
      image_format: 'image/jpeg'
    };

    // Remove all layers except OSM tiles
    function removeAllLayers() {
      if (typeof($scope.layers.overlays) === 'object' && typeof($scope.layers.overlays.preview) === 'object') {
        $scope.layers.overlays.preview = {};
      }
      /*
           leafletData.getMap().then(function(map) {
              map.eachLayer(function (layer) {
                if (layer._url.indexOf('tile.openstreetmap.org') == -1) {
               	  map.removeLayer(layer);
		}
	      });
           });
	   */
    }

    function setWMSPreview() {
      setTimeout(function() {
        $scope.layers.overlays.preview = {
          name: $scope.selectedLayer.title,
          type: 'wms',
          url: $scope.infos.url,
          visible: true,
          layerOptions: {
            layers: $scope.infos.identifier,
            format: $scope.image_format,
            opacity: 0.70
          }
        };
        leafletData.getMap().then(function(map) {
          $scope.infos.geographical_extent_geom = L.rectangle($scope.selectedLayer.boundingBox).toGeoJSON().geometry;
          map.fitBounds($scope.selectedLayer.boundingBox);
        });
      }, 0);
    }

    function setWMTSPreview() {
      setTimeout(function() {
        var layer = new L.TileLayer.WMTS($scope.infos.url, {
          layer: $scope.infos.identifier,
          style: "normal",
          tilematrixSet: "PM",
          format: $scope.image_format,
          opacity: 0.70
        });
        leafletData.getMap().then(function(map) {
          map.addLayer(layer);
          $scope.infos.geographical_extent_geom = L.rectangle($scope.selectedLayer.boundingBox).toGeoJSON().geometry;
          map.fitBounds($scope.selectedLayer.boundingBox);
        });
      }, 0);
    }

    if (angular.isDefined(layer)) {
      $scope.infos = angular.copy(layer);
      $scope.hideFields = false;
      $scope.selectedLayer = layer;
      $scope.image_format = (layer.image_format !== '') ? layer.image_format : self.defaultInfos.image_format;
      $scope.selectedLayer.title = $filter('arkTranslate')(layer.translations.name);
      if (angular.isDefined(layer.geographical_extent_geom.coordinates)) {
        $scope.selectedLayer.boundingBox = layer.geographical_extent_geom.coordinates[0];
      }
      $scope.type = layer.type;
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
        $scope.infos.url = 'http://wxs.ign.fr/b648puasvhkm1f46dk8hft4i/wmts';
      } else {
        // $scope.infos.url = 'http://demo.opengeo.org/geoserver/wms';

        $scope.infos.url = 'https://neo.sci.gsfc.nasa.gov/wms/wms';
      }
    }, true);

    // Debug

    /*
    $scope.infos = angular.copy({
            authors: [{
                fullname: login.user.firstname + ' ' + login.user.lastname,
                id: login.user.id
            }],
            url: 'http://demo.opengeo.org/geoserver/wms',
            min_scale: 0,
            max_scale: 14,
            declared_creation_date: new Date(),
            max_usage_date: new Date(),
            start_date: -1200,
            end_date: 300,
            license: 'pouet license',
            attribution: 'atribution pouet',
            copyright: 'copyright pouet',
            translations: {
                description: {
                    fr: 'desc fr',
                    en: 'desc en',
                    es: 'desc es'
                },
                name: {
                    fr: 'name fr',
                    en: 'name en',
                    es: 'name es'
                }
            }
        },
        $scope.infos);

    $scope.type = 'wms';

    */

    // Fin debug

    $scope.remoteServerThemes = [];

    $scope.showWMInputs = false;

    // $scope.type = 'wmts';
    // $scope.infos.url = 'http://wxs.ign.fr/bfmer9u7qh0mmhdyqj2z0wst/geoportail/wmts';

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
        service.getCapabilities($scope.infos.url).then(function(capas) {
          console.log(capas);
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

    $scope.onLayerSelected = function() {
      angular.forEach($scope.remoteServerThemes, function(wl) {
        if ($scope.infos.identifier === wl.identifier) {
          $scope.selectedLayer = wl;
        }
      });

      $scope.refreshPreview();

      $scope.hideFields = false;
    };

    $scope.refreshPreview = function() {
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
        dbObj.type = $scope.type;
        dbObj.identifier = $scope.infos.identifier;
        dbObj.url = $scope.infos.url;
        dbObj.image_format = $scope.image_format;
      }
      // translations
      delete dbObj.translations;
      angular.extend(dbObj, formatTranslation('description', $scope.infos.translations.description));
      angular.extend(dbObj, formatTranslation('name', $scope.infos.translations.name));
      var url = ($scope.type === 'shp') ? '/api/shpLayer' : '/api/wmLayer';
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
