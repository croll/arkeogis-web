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
  ArkeoGIS.controller('MapEditorCtrl', ['$scope', '$state', '$filter', 'arkeoService', 'arkeoMap', 'arkeoWMS', 'arkeoWMTS', 'arkeoLang', 'login', '$http', '$q', 'leafletData', 'Upload', 'layer', function($scope, $state, $filter, arkeoService, arkeoMap, arkeoWMS, arkeoWMTS, arkeoLang, login, $http, $q, leafletData, Upload, layer) {

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
      use_proxy: true
    };

    if (angular.isDefined(layer)) {
      $scope.infos = angular.copy(layer);
      $scope.hideFields = false;
      $scope.selectedLayer = layer;
      $scope.selectedLayer.title = $filter('arkTranslate')(layer.translations.name);

			// Force proxy
      // $scope.infos.use_proxy = true;

      if (angular.isDefined(layer.geographical_extent_geom.coordinates)) {
        $scope.selectedLayer.bounding_box = L.geoJson(layer.geographical_extent_geom).getBounds();
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

    $scope.$watch('infos.url', function(url) {
      if (!url || (url && url === '')) {
        return;
      }
      if (url.indexOf('?') === -1) {
        return url;
      }
      var queryString = url.split('?')[1];
      if (!queryString) return;
      var query = {};
      var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      }
      var finalUrl = '';
      for (var prop in query) {
        if (query.hasOwnProperty(prop)) {
          var concatChar = (finalUrl === '') ? '?' : '&';
          if (['REQUEST'].indexOf(prop.toUpperCase()) !== -1) continue;
          finalUrl += concatChar + prop.toUpperCase() + '=' + query[prop];
        }
      }
      $scope.infos.url = url.split('?')[0] + finalUrl;

    }, true);

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

    // $scope.$watch('type', function(newVal) {
    //   if (newVal && newVal === 'wmts') {
    //   //  $scope.infos.url = 'http://wxs.ign.fr/b648puasvhkm1f46dk8hft4i/wmts';
    //       $scope.infos.url = 'https://www.cigalsace.org/geoserver/gwc/service/wmts';
    //   } else {
    //     // $scope.infos.url = 'http://demo.opengeo.org/geoserver/wms';
    //
    //     // $scope.infos.url = 'https://neo.sci.gsfc.nasa.gov/wms/wms';
    //
    //     $scope.infos.url = 'https://www.cigalsace.org/geoserver/cigal/ows';
    //
    //     // $scope.infos.url = 'http://ogc.bgs.ac.uk/cgi-bin/BGS_GSI_EN_Bedrock_and_Structural_Geology/ows';
    //   }
    // }, true);

    $scope.remoteServerThemes = [];

    $scope.showWMInputs = false;

		// debug
    // $scope.type = 'wms';
		//$scope.infos.url = 'https://www.cigalsace.org/geoserver/PAIR/ows';
		//$scope.infos.url = 'https://www.cigalsace.org/geoserver/ARAA/ows';
    // $scope.infos.url = 'http://geoservices.crige-paca.org/geoserver/cd84/wms';
		// debug

    $scope.selectLayer = function(layer) {
      //console.log('%c MapEditor::selectLayer', 'color: #000; background: yellow', layer);
      $scope.infos.identifier = layer.identifier;
      $scope.infos.image_format = layer.image_format;
      $scope.infos.tile_matrix_set = layer.tile_matrix_set;
      $scope.infos.tile_matrix_string = layer.tile_matrix_string;
      $scope.hideFields = false;
      $scope.selectedLayer = layer;
      $scope.refreshPreview();

      // If it's a new layer
      if (!$scope.infos.id) {
        $scope.infos.translations.description[arkeoLang.getUserLang(1)] = {description: layer.title};
        var translatedDescription = {};
        translatedDescription[arkeoLang.getUserLang(1)] = layer.title;
        //var lang2 = (arkeoLang.getUserLang(1) === 'en') ? arkeoLang.getUserLang(2) : 'en';
        //translatedDescription[lang2] = layer.title;

        angular.extend($scope.infos.translations, {description: translatedDescription});
      }

    };

    $scope.reset = function() {
      $scope.remoteServerThemes = [];
      $scope.hideFields = true;
      $scope.file = null;
      if ($scope.type === 'wms') {
        // $scope.infos.url = 'http://demo.opengeo.org/geoserver/wms';
        // $scope.infos.url = 'https://neo.sci.gsfc.nasa.gov/wms/wms';
        // $scope.infos.url = 'http://ogc.bgs.ac.uk/cgi-bin/BGS_GSI_EN_Bedrock_and_Structural_Geology/ows';
        $scope.infos.url = 'https://www.cigalsace.org/geoserver/cigal/ows';
      } else if ($scope.type === 'wmts') {
      //  $scope.infos.url = 'http://wxs.ign.fr/b648puasvhkm1f46dk8hft4i/wmts';
      //    $scope.infos.url = 'https://www.cigalsace.org/geoserver/gwc/service/wmts';
          $scope.infos.url = 'https://wxs.ign.fr/bfmer9u7qh0mmhdyqj2z0wst/wmts';
      }
      if ($scope.geojsonLayer) {
        leafletData.getMap().then(function(map) {
          map.removeLayer($scope.geojsonLayer);
        });
      }
    };

    $scope.delete = function() {
      if (!layer.id) {
        console.error("No layer id specified, unable to delete");
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
        console.error(err);
      });
    };

    $scope.getLayers = function() {

      removeAllLayers();
      $scope.remoteServerThemes = [];

      $scope.showWMInputs = false;

      var service = ($scope.type === 'wms') ? eval('arkeoWMS') : eval('arkeoWMTS');
       var url = $scope.infos.url;
       if ($scope.infos.use_proxy && url.substring(0, 8) !== '/proxy/?') {
         url = '/proxy/?'+url;
       }
        service.getCapabilities(url).then(function(capas, err) {
          $scope.attribution = capas.abstract || capas.title;
					$scope.infos.attribution = $scope.attribution || $scope.infos.attribution;
          $scope.remoteServerThemes = capas.content;
          $scope.showWMInputs = true;
        }, function(err) {
          $scope.errorMsg = err.msg;
        });

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
            console.error(err);
            arkeoService.showMessage('MAPEDITOR.MESSAGE_SHP_LOADING.T_ERROR', 'error');
          });
        }, function(err) {
            console.error(err);
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
      // Authors
      dbObj.authors = [];
      angular.forEach($scope.infos.authors, function(author) {
        dbObj.authors.push(author.id);
      });
      dbObj.geographical_extent_geom = JSON.stringify($scope.infos.geographical_extent_geom);
      if ($scope.type === 'shp') {
        // geojson
        dbObj.geojson_with_data = JSON.stringify($scope.infos.geojson);
        dbObj.geojson = JSON.stringify(removeGeoJSONDatas($scope.infos.geojson));
        // Type of wm(t)s layer
      } else {
        dbObj.type = $scope.type;
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
            console.error(err);
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
            console.error(err);
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

      leafletData.getMap().then(function(map) {
        var i = 0;
        map.eachLayer(function (layer) {
          if (i > 0) {
            map.removeLayer(layer);
          }
          i++;
        });
      });
    }

    function setWMSPreview() {

      setTimeout(function() {
        var url = ($scope.infos.use_proxy) ? '/proxy/?'+$scope.infos.url : $scope.infos.url;

        var preview = L.tileLayer.wms(url, {
          layers: $scope.selectedLayer.identifier,
          tiled: true,
          format: 'image/png',
          transparent: true,
          continuousWorld: true
        });

        /*
        var preview = L.tileLayer(url, {
          name: $scope.selectedLayer.identifier,
          type: 'wms',
          url: url,
          visible: true,
          layerOptions: {
            layers: $scope.infos.identifier,
            format: $scope.infos.image_format,
            opacity: 0.70
          }
        });
        var toBeMerged = {overlays: {preview: preview}};

        $scope.layers = angular.merge($scope.layers, toBeMerged);
        */

        leafletData.getMap().then(function(map) {
          map.addLayer(preview);
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
  ArkeoGIS.controller('MapEditorListCtrl', ['$scope', 'layerService', 'arkeoMap', 'arkeoLang', 'login', '$http', '$state', 'translations', function($scope, layerService, arkeoMap, arkeoLang, login, $http, $state, translations) {

    $scope.filter = {
      show: false,
      options: {}
    };

    $scope.query = {
      filter: '',
      order: '',
      limitOptions: [10, 25, 50, {
        label: translations['GENERAL.TABLE_PAGINATION.T_ALL'],
        value: function() {
          return 10000;
        }
      }],
      limit: 20,
      page: 1
    };

    function compare(a,b) {
      if (a.id > b.id)
    	  return -1;
      if (a.id < b.id)
        return 1;
      return 0;
    }


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
      $scope.mapLayers = layers.sort(compare);
				layers.forEach(function(layer) {
					layer.name = arkeoLang.getMappedTranslation(layer.name);
					layer.attribution = arkeoLang.getMappedTranslation(layer.attribution);
					layer.copyright = arkeoLang.getMappedTranslation(layer.copyright);
					layer.description = arkeoLang.getMappedTranslation(layer.description);
				});
    }, function(errorCode) {
      console.error("ERROR CODE: "+errorCode);
    });

    $scope.edit = function(type, id) {
      $state.go('arkeogis.mapeditor', {
        type: type,
        id: id
      });
    };

  }]);
})();
