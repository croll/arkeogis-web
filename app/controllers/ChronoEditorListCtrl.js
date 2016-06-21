/* ArkeoGIS - The Geographic Information System for Archaeologists
 * Copyright (C) 2015-2016 CROLL SAS
 *
 * Authors :
 *  Nicolas Dimitrijevic <nicolas@croll.fr>
 *  Christophe Beveraggi <beve@croll.fr>
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

(function () {
	'use strict';

	/*
	 * ChronoEditorListCtrl Chrono Editor List Controller
	 */

	ArkeoGIS.controller('ChronoEditorListCtrl', ['$scope', '$q', 'arkeoLang', 'login', function ($scope, $q, arkeoLang, Login) {

		//if (!Login.requirePermission('langeditor', 'langeditor'))
        //    return;

        var self=this;

		$scope.chronolist = [
			{
				author: 'Bernard Loup',
				name: 'Âge du Bronze Vallée du Rhin',
				description: 'La chrono du loup est la meilleur de tout ArkeoGIS, et c\'est tout à fait objectif !',
				active: true,
				created_at: new Date('2015-11-23T22:00:00.000Z'),
				date_begin: -1800,
				date_end: -801,
				users: [
					{
						name: 'Loup Bernard'
					},
					{
						name: 'Plop Plip'
					}
				],
			},
			{
				author: 'Gérard Lambert',
				name: 'Banlieu rouge',
				description: 'La chrono de Gérard Lambert, même la mobylette du copain de renaud marche bien mieux qu\'une renault',
				active: true,
				created_at: new Date('1977-04-11T22:00:00.000Z'),
				date_begin: 1977,
				date_end: 2016,
				users: [
					{
						name: 'Gérard Lambert'
					},
					{
						name: 'Quelqu\'un d\'autre'
					}
				],
			},
			{
				author: 'Georges Brassens',
				name: 'Les copains d\'abord',
				description: "Il naviguait en pèr' peinard, Sur la grand-mare des canards, Et s'app'lait les Copains d'abord, Les Copains d'abord.",
				active: true,
				created_at: new Date('1921-09-22T22:00:00.000Z'),
				date_begin: 1921,
				date_end: 1981,
				users: [
					{
						name: 'Georges Brassens'
					},
					{
						name: 'Personne d\'autre'
					}
				],
			}
		];


    }]);  // controller ChronoEditorListCtrl



	/*
	 * ChronoEditorCtrl Chrono Editor Controller
	 */

	ArkeoGIS.controller('ChronoEditorCtrl', ['$scope', '$q', '$mdSidenav', 'arkeoLang', 'login', '$http', 'arkeoService', '$stateParams', '$rootScope', function ($scope, $q, $mdSidenav, arkeoLang, Login, $http, arkeoService, $stateParams, $rootScope) {

		//if (!Login.requirePermission('langeditor', 'langeditor'))
        //    return;

        var self=this;

		$scope.chooseemprise = false;
		$scope.publishable = false;
		$scope.arbo = {};

		var colors= [
			[[ 171, 171, 171], [ 171, 171, 171], [ 171, 171, 171], [ 171, 171, 171] ],
			[[ 22, 170, 239], [ 79, 188, 243], [ 111, 201, 246], [ 138, 214, 252] ],
			[[ 243, 147, 6], [ 241, 172, 6], [ 255, 190, 37], [ 254, 208, 71] ],
			[[ 167, 111, 189], [ 187, 126, 217], [ 202, 139, 235], [ 219, 156, 250] ],
			[[ 140, 176, 66], [ 160, 198, 76], [ 165, 215, 62], [ 180, 234, 59] ],
			[[ 248, 76, 72], [ 248, 101, 96], [ 238, 125, 122], [ 249, 153, 151] ],
			[[ 1, 181, 181], [ 24, 213, 210], [ 58, 231, 230], [ 149, 237, 237] ],
			[[ 212, 93, 183], [ 236, 111, 206], [ 245, 139, 218], [ 238, 165, 220] ],
			[[ 88, 130, 255], [ 114, 148, 246], [ 133, 160, 245], [ 162, 182, 239] ],
			[[ 129, 90, 78], [ 147, 110, 98], [ 159, 131, 122], [ 178, 161, 155] ],
			[[ 50, 173, 93], [ 77, 194, 118], [ 110, 219, 148], [ 138, 237, 174] ],
		];

		function buildcolor(idx, level) {
			idx=idx+1;
			level=level-1;
			//return 'rgb('+colors[idx][level][0]+','+colors[idx][level][1]+','+colors[idx][level][2]+')';
			function toHex(d) {
    			return ("0"+(Number(d).toString(16))).slice(-2);
			}
			return toHex(colors[idx][level][0])+toHex(colors[idx][level][1])+toHex(colors[idx][level][2]);
		}

		function colorize_all() {
			$scope.arbo.content.forEach(function(n1, idx1) {
				n1.color = buildcolor(idx1, 1);
				n1.content.forEach(function(n2, idx2) {
					n2.color = buildcolor(idx1, 2);
					n2.content.forEach(function(n3, idx3) {
						n3.color = buildcolor(idx1, 3);
						n3.content.forEach(function(n4, idx4) {
							n4.color = buildcolor(idx1, 4);
						});
					});
				});
			});
		}

		function check_elem(elem, previous, next, parent) {
			var ret={
				errcount: 0,
				elemcount: 1,
				tradscount: {},
			}

			// compte les traductions
			if ('name' in elem) {
				for (var isocode in elem.name) {
					if (elem.name[isocode].length > 0)
						ret.tradscount[isocode]=1;
				}
			}

			// vérifie que les dates se suivent
			if (next) {
				if ((elem.end_date+1) != next.start_date) {
					elem.end_date_err = true;
					next.start_date_err = true;
					ret.errcount++;
				}
			}

			// vérifie que les dates du parent collent avec debut et fin du premier et dernier element
			if (parent && !parent.root) {
				if (!previous) {
					if (elem.start_date != parent.start_date) {
						elem.start_date_err = true;
						parent.start_date_err = true;
						ret.errcount++;
					}
				}
				if (!next) {
					if (elem.end_date != parent.end_date) {
						elem.end_date_err = true;
						parent.end_date_err = true;
						ret.errcount++;
						console.log("aie", elem.end_date, parent.end_date);
					}
				}
			}

			// vérifie que 'end_date' est bien > a 'start_date'
			if (!(elem.end_date > elem.start_date)) {
				elem.start_date_err = true;
				elem.end_date_err = true;
			}

			if ('content' in elem) {
				for (var i=0; i<elem.content.length; i++) {
					var sub_elem = elem.content[i];
					var sub_previous = i > 0 ? elem.content[i-1] : null;
					var sub_next = i < (elem.content.length-1) ? elem.content[i+1] : null;
					var res = check_elem(sub_elem, sub_previous, sub_next, elem);
					ret.errcount += res.errcount;
					ret.elemcount += res.elemcount;
					for (var isocode in res.tradscount) {
						if (isocode in ret.tradscount)
							ret.tradscount[isocode] += res.tradscount[isocode];
						else
							ret.tradscount[isocode] = res.tradscount[isocode];
					}
				}
			}
			return ret;
		}

		function clear_elem_err(elem) {
			delete elem.start_date_err;
			delete elem.end_date_err;
			if ('content' in elem) {
				for (var i=0; i<elem.content.length; i++) {
					clear_elem_err(elem.content[i]);
				}
			}
		}

		$scope.check_all = function() {

			// hack root element (not visible) to have start_date / end_date of extremities
			$scope.arbo.start_date = $scope.arbo.content[0].start_date;
			$scope.arbo.end_date = $scope.arbo.content[$scope.arbo.content.length-1].end_date;

			// clear errors
			clear_elem_err($scope.arbo);

			// recursively check all elements
			var ret = check_elem($scope.arbo, null, null, null);
			console.log("ret: ", ret);

			// check if publishable
			var publishable = false;
			if (ret.errcount == 0) {
				var fulltrads=[];
				for (var isocode in ret.tradscount) {
					console.log("isocode: ", isocode, ret.tradscount[isocode]);
					if (ret.tradscount[isocode] == ret.elemcount)
						fulltrads.push(isocode);
				}
				if ((fulltrads.length >= 2) && (fulltrads.indexOf('en') != -1)) {
					publishable = true;
				}
				console.log("fulltrads", fulltrads, publishable);
			}
			if (!publishable)
				$scope.arbo.active = false;
			$scope.publishable = publishable;
		}

		$scope.add_arbo = function(elem, parent, idx1, idx, level) {
			elem.content.push({
				name: {},
				start_date: -1,
				end_date: +1,
				//color: buildcolor(idx1, level+1),
				content: [],
			});
			colorize_all();
			$scope.check_all();
		};

		$scope.remove_arbo = function(elem, parent, idx1, idx, level) {
			parent.content.splice(idx, 1);
			colorize_all();
		};

		$scope.openLeftMenu = function() {
		    $mdSidenav('left').toggle();
		};

		$scope.save = function() {
			var url = '/api/chronologies';
			/*
			var config = {
				responseType: "json",
				data: $scope.arbo,
			};*/
			$http.post(url, $scope.arbo).then(function(data) {
				arkeoService.showMessage("ok !");
				$scope.arbo = data.data;
				colorize_all();
				$scope.check_all();
			}, function(err) {
				arkeoService.showMessage("save failed : "+err.status+", "+err.statusText);
				console.error("saved", err);
			});

		};

		$scope.load = function() {
			var id = $stateParams.chronology_id || 0;
			if (id > 0) {
				var url = '/api/chronologies/'+id;
				$http.get(url).then(function(data) {
					$scope.arbo = data.data;
					colorize_all();
					$scope.check_all();
					$rootScope.$broadcast('EmpriseMapLayer', $scope.arbo.geom);
				}, function(err) {
					arkeoService.showMessage("load failed : "+err.status+", "+err.statusText);
					console.error("loaded", err);
				})
			} else {
				console.log("starting with a new empty chrono...");
			}
		};

		$scope.$on('EmpriseMapChoosen', function(event, geojson) {
			$scope.arbo.geom = JSON.stringify(geojson.geometry);
		});
		$scope.$on('EmpriseMapClose', function(event) {
			$scope.chooseemprise = false;
		});

		$scope.showemprise = function() {
			$scope.chooseemprise = true;
			$rootScope.$broadcast('EmpriseMapShow');
		};

		function init() {
			$scope.load();
		}
		init();

    }]); // controller ChronoEditorCtrl


	/*
	 * ChronoEditorMapCtrl Chrono Editor Map Controller (choix de l'emprise)
	 */

	ArkeoGIS.controller('ChronoEditorMapCtrl', ['$scope', 'mapService', 'leafletData', '$rootScope', '$timeout', function ($scope, mapService, leafletData, $rootScope, $timeout) {

		var resize = function() {
			$scope.mapHeight = ($(window).height() - $("#arkeo-main-toolbar").height() - $("#arkeo-chronoditor-toolbar").height())+"px";
		};

		$(window).on('resize', resize);
		$scope.$on('EmpriseMapShow', function(event) {
			$timeout(function() {
				leafletData.getMap().then(function(map) {
					map.invalidateSize();
				});
			}, 0);
		});
		resize();

		angular.extend($scope, mapService.config);

		angular.merge($scope, {
			controls: {
				draw: {
					draw: {
						polyline: false,
						circle: false,
						marker: false,
						polygon: {
							allowIntersection: false, // Restricts shapes to simple polygons
							showArea: true,
							shapeOptions: {
				                color: '#33f',
								weight: 5,
				            }
						},
						rectangle: {
							showArea: true,
							shapeOptions: {
				                color: '#33f',
								weight: 5,
				            }
						}
					}
				}
			},
			layers: {
				overlays: {
					draw: {
						name: 'draw',
						type: 'group',
						visible: true,
						layerParams: {
							showOnSelector: false
						}
					}
				}
			}
		});

		var curlayer = null;

		leafletData.getMap().then(function(map) {
			leafletData.getLayers().then(function(layers) {
			   var drawnItems = layers.overlays.draw;

			   map.on('draw:created', function (e) {
				   if (curlayer) {
					   drawnItems.removeLayer(curlayer);
					   curlayer = null;
				   }
				 	curlayer = e.layer;
				 	drawnItems.addLayer(curlayer);
				 	curlayer.editing.enable();
					console.log("curlayer", curlayer);

				 	console.log(JSON.stringify(curlayer.toGeoJSON()));
  		 		 	$rootScope.$broadcast('EmpriseMapChoosen', curlayer.toGeoJSON());
				 	//$rootScope.$broadcast('EmpriseMapClose');
			   });

			   map.on('draw:edited', function (e) {
				 	var layer = e.layer;

				 	console.log(JSON.stringify(layer.toGeoJSON()));
  		 		 	$rootScope.$broadcast('EmpriseMapChoosen', layer.toGeoJSON());
				 	//$rootScope.$broadcast('EmpriseMapClose');
			   });

			});
		});

		$scope.$on('EmpriseMapLayer', function(event, geom) {
			leafletData.getMap().then(function(map) {
				leafletData.getLayers().then(function(layers) {
					var drawnItems = layers.overlays.draw;

					if (curlayer) {
 					   drawnItems.removeLayer(curlayer);
 					   curlayer = null;
 				   }

				   geom = angular.fromJson(geom);
				   console.log("a...", geom);
			   		curlayer = L.geoJson(geom).addTo(drawnItems);
					console.log("curlayer", curlayer);
					//curlayer.editing.enable();
					console.log("b...", geom);

				});
			});
		});

		$scope.close = function() {
			$rootScope.$broadcast('EmpriseMapChoosen', curlayer.toGeoJSON());
			$rootScope.$broadcast('EmpriseMapClose');
		};


	}]); // controller ChronoEditorMapCtrl

})(); // all
