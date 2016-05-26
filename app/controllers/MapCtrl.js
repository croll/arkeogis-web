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
	ArkeoGIS.controller('MapCtrl', ['$scope', '$http', '$location', '$mdSidenav', '$mdComponentRegistry', 'arkeoService', 'leafletData',
	function($scope, $http, $location, $mdSidenav, $mdComponentRegistry, arkeoService, leafletData) {
		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $(".md-default-theme .md-toolbar-tools").height() - 65 +"px";
		};

		$(window).on('resize', resize);

		var urlParams = $location.search();

		var dbToGet =  (angular.isDefined(urlParams.id) && urlParams.id) ? urlParams.id : 15;

		// Leaflet init

		angular.extend($scope, {
			defaults: {
				zoomControlPosition: 'topright'
			},
			center: {
				lat: 48.58476,
				lng: 7.750576,
				zoom: 8
			},
		    layers: {
                baselayers: {
                    osm: {
	                    name: 'OpenStreetMap',
	                    url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	                    type: 'xyz'
                    },
					mapquest: {
						name: 'MapQuest',
						url: 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png',
						type: 'xyz'
					},
					googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
                    },
                    googleHybrid: {
	                    name: 'Google Hybrid',
	                    layerType: 'HYBRID',
	                    type: 'google'
	                },
                    googleRoadmap: {
                        name: 'Google Streets',
                        layerType: 'ROADMAP',
                        type: 'google'
                    }
                },
                overlays:{}
            },
			controls: {
				scale: {
					imperial: false,
					position: 'bottomright'
				},
				fullscreen: {
					position: 'topright'
				}
			}
	});
	// Get the countries geojson data from a JSON
        $http.get("/api/search/sites/"+dbToGet).success(function(data, status) {

			resize();

			var latlngs = [];

			var generateIcon = function(feature) {
				var iconClasses = "icon icon-site";
				if (feature.centroid) {
					iconClasses += " centroid";
				}

				var characInfos = analyzeCharacs(feature);

				iconClasses += " "+characInfos.iconSize;

				if (characInfos.exceptional) {
					iconClasses += " exceptional"
				}

				return L.divIcon({
					className: 'arkeo-icon-container',
					html: '<svg class="arkeo-icon arkeo-icon-site '+iconClasses+'"><use xlink:href="#arkeo-icon-site"></use></svg><span class="mls"></span>',
	    			iconAnchor: [12, 0]
				});
			}

			var analyzeCharacs = function(feature) {
				var ret = {exceptional: false, iconSize: 0};
				angular.forEach(feature.properties.site_ranges, function(site_range) {
					angular.forEach(site_range.characs, function(c) {
						if (c.exceptional) {
							ret.exceptional = true;
						}
						var memorized = 0;
						var current = 0;
						switch (c.knowledge_type) {
							case 'not_documented':
								current = 1;
								break;
							case 'literature':
								current = 2;
								break;
							case 'prospected_aerial':
								current = 3;
								break;
							case 'prospected_pedestrian':
								current = 4;
								break;
							case 'surveyed':
								current = 5;
								break;
							case 'dig':
								current = 6;
								break;
						}
						if (memorized < current) {
							memorized = current;
							ret.iconSize = 'size'+current;
						}
					});
				});
				return ret;
			}

	        angular.extend($scope.layers.overlays, {
                sites: {
                    name:'ArkeoGIS (A)',
                    type: 'geoJSONShape',
                    data: data,
                    visible: true,
					icon: generateIcon,
					layerOptions: {
						pointToLayer: function(feature, latlng) {
							return L.marker(latlng, { icon: generateIcon(feature) });
						},
						onEachFeature: function(feature, layer) {
							layer.bindPopup(feature.properties.infos.name+" ("+feature.properties.infos.code+")");
						}
					}
                }
            });

			angular.forEach(data.features, function(feature) {
				latlngs.push([parseFloat(feature.geometry.coordinates[0]), parseFloat(feature.geometry.coordinates[1])]);
			});
		});

		// sideNav

		$scope.sideNavLeftisOpen = function() { return false };
		$scope.sideNavRightisOpen = function() { return false };

		// Register bindnig function
		$mdComponentRegistry
		            .when("sidenav-left")
		            .then(function(sideNav) {
		                $scope.sideNavLeftisOpen = angular.bind(sideNav, sideNav.isOpen );
		});

		$mdComponentRegistry
		            .when("sidenav-right")
		            .then(function(sideNav) {
		                $scope.sideNavRightisOpen = angular.bind(sideNav, sideNav.isOpen );
		});


		$scope.$watch("sideNavLeftisOpen()",function(newValue,oldValue) {
			// save your changes here
			if (newValue == false) {
				$mdSidenav('sidenav-right').close();
			}
		},true);

		$scope.$watch("sideNavRightisOpen()",function (newValue,oldValue) {
			// save your changes here
			if (newValue == false) {
				$mdSidenav('sidenav-left').close();
			}
		},true);

		$scope.open_sides = function() {
			$mdSidenav('sidenav-left').open();
			$mdSidenav('sidenav-right').open();
		};

		/*
		 * characs init
		 */

		var _tributtons = {
			inclorexcl: [
				{
					icon: 'brightness_1'
				},
				{
					value: '+',
					icon: 'add_circle'
				},
				{
					value: '-',
					icon: 'remove_circle'
				},
			],
			exceptional: [
				{
					icon: 'check_box_outline_blank'
				},
				{
					value: true,
					icon: 'new_releases'
				},
			],
		};

		var _checkbox_buttons = {
			_: [
				{
					icon: 'check_box_outline_blank',
				},
				{
					value: true,
					icon: 'check_box',
				},
			]
		}

		arkeoService.loadCharacsAll().then(function(characs) {
			// construct a tree with characs
			var main={ value: 0, menu:[]};

			function addsub(c) {
				characs.forEach(function(sub) {
					if (sub.parent_id == c.value) {
						if (!('menu' in c)) c.menu=[];
						var item={
							value: sub.id,
							//text: sub.tr[0].name,
							text: sub.tr.name,
						};
						if (sub.parent_id != 0)
							item.buttons = _tributtons;
						c.menu.push(item);
						addsub(item); // recurse
					}
				})
			}

			addsub(main);
			$scope.characs = main;
		});

		$scope.menuCentroid = {
			text: 'MAP.MENU_CENTROID.T_TITLE',
			menu: [
				{
					value: 'centroid-include',
					text: 'MAP.MENU_CENTROID.T_YES',
					buttons: _checkbox_buttons,
				},
				{
					value: 'centroid-exclude',
					text: 'MAP.MENU_CENTROID.T_NO',
					buttons: _checkbox_buttons,
				},
			],
		};

		$scope.menuKnowledge = {
			text: 'MAP.MENU_KNOWLEDGE.T_TITLE',
			menu: [
				{
					value: 'not_documented',
					text: 'MAP.MENU_KNOWLEDGE.T_NOTDOCUMENTED',
					buttons: _checkbox_buttons,
				},
				{
					value: 'literature',
					text: 'MAP.MENU_KNOWLEDGE.T_LITERATURE',
					buttons: _checkbox_buttons,
				},
				{
					value: 'prospected_aerial',
					text: 'MAP.MENU_KNOWLEDGE.T_PROSPECTED_AERIAL',
					buttons: _checkbox_buttons,
				},
				{
					value: 'prospected_pedestrian',
					text: 'MAP.MENU_KNOWLEDGE.T_PROSPECTED_PEDESTRIAN',
					buttons: _checkbox_buttons,
				},
				{
					value: 'surveyed',
					text: 'MAP.MENU_KNOWLEDGE.T_SURVEYED',
					buttons: _checkbox_buttons,
				},
				{
					value: 'dig',
					text: 'MAP.MENU_KNOWLEDGE.T_DIG',
					buttons: _checkbox_buttons,
				},
			],
		};

		$scope.menuOccupation = {
			text: 'MAP.MENU_OCCUPATION.T_TITLE',
			menu: [
				{
					value: 'not_documented',
					text: 'MAP.MENU_OCCUPATION.T_NOTDOCUMENTED',
					buttons: _checkbox_buttons,
				},
				{
					value: 'single',
					text: 'MAP.MENU_OCCUPATION.T_SINGLE',
					buttons: _checkbox_buttons,
				},
				{
					value: 'continuous',
					text: 'MAP.MENU_OCCUPATION.T_CONTINUOUS',
					buttons: _checkbox_buttons,
				},
				{
					value: 'multiple',
					text: 'MAP.MENU_OCCUPATION.T_MULTIPLE',
					buttons: _checkbox_buttons,
				},
			],
		};

		$scope.menuZone = {
			text: 'MAP.MENU_SEARCHZONE.T_TITLE',
			menu: [
				{
					value: 'map',
					text: 'MAP.MENU_SEARCHZONE.T_MAP',
					buttons: _checkbox_buttons,
				},
				{
					value: 'rect',
					text: 'MAP.MENU_SEARCHZONE.T_RECT',
					buttons: _checkbox_buttons,
				},
				{
					value: 'disc',
					text: 'MAP.MENU_SEARCHZONE.T_DISC',
					buttons: _checkbox_buttons,
				},
				{
					value: 'polygon',
					text: 'MAP.MENU_SEARCHZONE.T_POLYGON',
					buttons: _checkbox_buttons,
				},
				{
					value: 'coordinates',
					text: 'MAP.MENU_SEARCHZONE.T_COORDINATES',
					buttons: _checkbox_buttons,
				},
			],
		};

		$scope.menuDatabase = {
			text: 'MAP.MENU_DATABASE.T_TITLE',
			menu: [
				{
					value: 'inventory',
					text: 'MAP.MENU_DATABASE.T_INVENTORY',
					menu: [],
				},
				{
					value: 'research',
					text: 'MAP.MENU_DATABASE.T_RESEARCH',
					menu: [],
				},
				{
					value: 'literary-work',
					text: 'MAP.MENU_DATABASE.T_LITERARYWORK',
					menu: [],
				},
			],
		};

		$scope.menuPeriod = {
			text: 'MAP.MENU_PERIOD.T_TITLE',
			menu: [
				{
					value: 'manual',
					text: 'MAP.MENU_PERIOD.T_MANUAL',
					buttons: _checkbox_buttons,
					menu: [],
				},
				{
					value: 'chronology',
					text: 'MAP.MENU_PERIOD.T_CHRONOLOGY',
					menu: [],
				},
			],
		};

		// the Query
		$scope.query = {
		};

		$scope.addInQuery = function(k, v, text) {
			if (!(k in $scope.query)) {
				$scope.query[k] = [];
			}
			$scope.query[k].push({
				k: k,
				v: v,
				text: text,
			})
		};

		$scope.removeFromQuery = function(k, v) {
			if (k in $scope.query) {
				for (var i in $scope.query[k]) {
					console.log("i: ", i);
					if ($scope.query[k][i].v == v) {
						$scope.query[k].splice(i, 1);
						if ($scope.query[k].length == 0) {
							delete $scope.query[k];
						}
						break;
					}
				}
			}
		};

		$scope.isEmptyObject = function(obj) {
			return $.isEmptyObject(obj);
		};

		$scope.menutolist = function(data, menu) {
			var res=[];
			var keys = $.map(data, function(v, k) { return k; });
			keys.forEach(function(key) {
				menu.forEach(function(item) {
					if (item.value == key)
						res.push(item);
				});
			});
			return res;
		};

	}]);
})();
