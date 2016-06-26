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
	ArkeoGIS.controller('MapCtrl', ['$scope', '$http', '$location', '$mdSidenav', '$mdComponentRegistry', '$q', 'arkeoService', 'leafletData', 'mapService',
	function($scope, $http, $location, $mdSidenav, $mdComponentRegistry, $q, arkeoService, leafletData, mapService) {

		$scope.PROJECT = {
			project_id: 0,
			chronology_id: 217,
		}


		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $("#arkeo-main-toolbar").height() +"px";
		};
		resize();

		$(window).on('resize', resize);

		var urlParams = $location.search();

		var dbToGet =  (angular.isDefined(urlParams.id) && urlParams.id) ? urlParams.id : 12;

		// Leaflet init

		angular.extend($scope, mapService.config);

		// function to display a map

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

			/*
			return L.divIcon({
				className: 'arkeo-marker-container',
				html: '<svg class="arkeo-marker arkeo-marker-drop'+iconClasses+'"><use xlink:href="#arkeo-marker-drop"></use></svg><span class="mls"></span>',
				iconAnchor: [12, 0]
			});
			*/
			return L.divIcon({
				className: 'arkeo-marker-container',
				html: '<div>PLOP</div>',
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

		function displayMapResults(data) {
			var latlngs = [];

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

			resize();
		}



		/*
		 * sideNav
		 */

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
		 * menus init : buttons styles
		 */

		 var _characbuttons = {
 			inclorexcl: [
 				{
 					icon: 'brightness_1'
 				},
 				{
 					value: true,
 					icon: 'add_circle'
 				},
 				{
 					value: false,
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

		var _tributtons = {
			inclorexcl: [
				{
					icon: 'brightness_1'
				},
				{
					value: true,
					icon: 'add_circle'
				},
				{
					value: false,
					icon: 'remove_circle'
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

		/*
		 * menus init : characs
		 */

		function characElementToMenuElement(charac) {
			charac.value = charac.id;
			charac.text = charac.name;
			charac.buttons = _characbuttons;

			if (charac.content && charac.content.length > 0) {
				charac.menu = charac.content;
				charac.menu.forEach(characElementToMenuElement);
			}
		}

		$http.get('/api/characs', {
		}).then(function(data) {
			var roots = data.data;
			var promises=[];
			roots.forEach(function(root) {
				promises.push($http.get('/api/characs/'+root.id, {}).then(function(data) {
					root.content = data.data.content;
					characElementToMenuElement(root)
				}));
			})
			$q.all(promises).then(function(res) {
				$scope.menuCharacs = [{
					text: "MAP.MENU_CHARACS.T_TITLE",
					buttons: [],
					value: 0, // value never used, there is no buttons
					menu: roots
				}];
			})
		});

		/*
		 * menus init : chronologies
		 */

		$scope.menuChronologies=[];

		function chronoElementToMenuElement(chrono) {
			chrono.value = chrono.id;
			chrono.text = chrono.name;
			chrono.buttons = _tributtons;

			if (chrono.content && chrono.content.length > 0) {
				chrono.menu = chrono.content;
				chrono.menu.forEach(chronoElementToMenuElement);
			}
		}

		$http.get('/api/chronologies/'+$scope.PROJECT.chronology_id, {
				params: {
					active: 1,
				},
			}).then(function(data) {
			var root = data.data;
			chronoElementToMenuElement(root)

			$scope.menuChronologies = [{
				text: "MAP.MENU_CHRONO.T_TITLE",
				buttons: [],
				value: 0, // value never used, there is no buttons
				menu: [
					{
						text: "MAP.MENU_CHRONO.T_MANUAL",
						buttons: _checkbox_buttons,
					},
					{
						text: "MAP.MENU_CHRONO.T_CHRONOLOGY",
						buttons: _tributtons,
						value: $scope.PROJECT.chronology_id,
						menu: root.menu,
					},
				]
			}];

			console.log("menu: ", $scope.menuChronologies );

		}, function(err) {
			arkeoService.fieldErrorDisplay(err)
			console.error(err);
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

		/*
		 * menus init : databases
		 */

		function databaseElementToMenuElement(database) {
			database.value = database.id;
			database.text = database.name;
			database.buttons = _tributtons;
		}

		$http.get('/api/database', {
			active: true,
		}).then(function(data) {
			console.log("databases", data.data);

			var roots = data.data;

			var menu = [{
				text: "MAP.MENU_DATABASE.T_INVENTORY",
				menu: [],
				buttons: _tributtons,
				value: 'type:inventory',
			},{
				text: "MAP.MENU_DATABASE.T_RESEARCH",
				menu: [],
				buttons: _tributtons,
				value: 'type:research',
			},{
				text: "MAP.MENU_DATABASE.T_LITERARYWORK",
				menu: [],
				buttons: _tributtons,
				value: 'type:literary-work',
			},{
				text: "MAP.MENU_DATABASE.T_UNDEFINED",
				menu: [],
				buttons: _tributtons,
				value: 'type:undefined',
			}];

			roots.forEach(function(root) {
				databaseElementToMenuElement(root);
				switch(root.type) {
					case 'inventory':
						menu[0].menu.push(root);
					break;
					case 'research':
						menu[1].menu.push(root);
					break;
					case 'literary-work':
						menu[2].menu.push(root);
					break;
					default:
						menu[3].menu.push(root);
					break;
				}
			});

			$scope.menuDatabases = [{
				text: "MAP.MENU_DATABASE.T_TITLE",
				buttons: [],
				value: 0,
				menu: menu,
			}];

			console.log("menu database : ", $scope.menuDatabases);
		});

/*
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
*/
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

		$scope.showMap = function() {
			var params = $scope.query;
			$http.post("/api/map/search", params).then(function(data) {
				console.log("data", data);
				displayMapResults(data.data);
			}, function(err) {
				arkeoService.fieldErrorDisplay(err)
				console.error(err);
			});
		};

	}]);
})();
