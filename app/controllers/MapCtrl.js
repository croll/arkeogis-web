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
	ArkeoGIS.controller('MapCtrl', ['$scope', '$http', '$mdSidenav', '$mdComponentRegistry', 'arkeoService', 'leafletData',
	function($scope, $http, $mdSidenav, $mdComponentRegistry, arkeoService, leafletData) {
		// Get map area to fit full screen
		var resize = function() {
			$scope.mapHeight = $(window).height() - $(".md-default-theme .md-toolbar-tools").height() - 65 +"px";
		};

		$(window).on('resize', resize);

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
        $http.get("/api/search/sites").success(function(data, status) {

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
                    name:'Major Cities (Awesome Markers)',
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
					value: '0',
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
					value: false,
					icon: 'check_box_outline_blank'
				},
				{
					value: true,
					icon: 'new_releases'
				},
			],
		};

		arkeoService.loadCharacsAll().then(function(characs) {
			// construct a tree with characs
			var main={ value: 0, menu:[]};

			function addsub(c) {
				characs.forEach(function(sub) {
					if (sub.parent_id == c.value) {
						if (!('menu' in c)) c.menu=[];
						var item={
							value: sub.id,
							text: sub.tr[0].name,
							buttons: _tributtons,
						};
						c.menu.push(item);
						addsub(item); // recurse
					}
				})
			}

			addsub(main);
			$scope.characs = main;
		});

		$scope.groink={};

		$scope.mymenu = {
			value: '0',
			text: 'Mon menu',
			buttons: _tributtons,
			menu: [
				{
					value: '1',
					text: 'First',
					buttons: _tributtons,
					menu: [
						{
							value: '1.1',
							text: 'Primary First',
							buttons: _tributtons,
						},
						{
							value: '1.2',
							text: 'Secondary First',
							buttons: _tributtons,
						}
					]
				},
				{
					value: '2',
					text: 'Second',
					buttons: _tributtons,
					menu: [
						{
							value: '2.1',
							text: 'Primary Second',
							buttons: _tributtons,
						},
						{
							value: '2.2',
							text: 'Secondary Second',
							buttons: _tributtons,
						}
					]
				}
			]
		};

		// the Query
		$scope.query = {
		}

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

	}]);
})();
