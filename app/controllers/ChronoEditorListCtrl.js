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

	ArkeoGIS.controller('ChronoEditorCtrl', ['$scope', '$q', '$mdSidenav', 'arkeoLang', 'login', '$http', 'arkeoService', function ($scope, $q, $mdSidenav, arkeoLang, Login, $http, arkeoService) {

		//if (!Login.requirePermission('langeditor', 'langeditor'))
        //    return;

        var self=this;

		$scope.chooseemprise = false;
		$scope.chronolang="fr";

		$scope.chrono = {
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
		};

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
			var errcount=0;

			// vérifie que les dates se suivent
			if (next) {
				if ((elem.end_date+1) != next.start_date) {
					elem.end_date_err = true;
					next.start_date_err = true;
					errcount++;
				}
			}

			// vérifie que les dates du parent collent avec debut et fin du premier et dernier element
			if (parent && !parent.root) {
				if (!previous) {
					if (elem.start_date != parent.start_date) {
						elem.start_date_err = true;
						parent.start_date_err = true;
						errcount++;
					}
				}
				if (!next) {
					if (elem.end_date != parent.end_date) {
						elem.end_date_err = true;
						parent.end_date_err = true;
						errcount++;
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
					errcount += check_elem(sub_elem, sub_previous, sub_next, elem);
				}
			}
			return errcount;
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
			clear_elem_err($scope.arbo);
			var errcount = check_elem($scope.arbo, null, null, null);
			console.log("errcount: ", errcount);
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
				console.log("saved ", data);
				$scope.arbo = data.data;
				colorize_all();
			}, function(err) {
				arkeoService.showMessage("save failed : "+err.status+", "+err.statusText);
				console.error("saved", err);
			});

		};

		$scope.load = function() {
			var url = '/api/chronologies/'+217;
			$http.get(url).then(function(data) {
				console.log("loaded ", data);
				$scope.arbo = data.data;
				colorize_all();
			}, function(err) {
				arkeoService.showMessage("load failed : "+err.status+", "+err.statusText);
				console.error("loaded", err);
			})
		};

		$scope.$on('EmpriseMapChoosen', function(event, geojson) {
			$scope.arbo.geom = JSON.stringify(geojson.geometry);
			$scope.chooseemprise = false;
		});

		function init() {
			$scope.load();
		}
		init();

    }]); // controller ChronoEditorCtrl


	/*
	 * ChronoEditorMapCtrl Chrono Editor Map Controller (choix de l'emprise)
	 */

	ArkeoGIS.controller('ChronoEditorMapCtrl', ['$scope', 'mapService', 'leafletData', '$rootScope', function ($scope, mapService, leafletData, $rootScope) {

		angular.extend($scope, mapService.config);

		angular.merge($scope, {
			controls: {
				draw: {
					draw: {
						polyline: false,
						circle: false,
						marker: false,
						polygon: {
							showArea: true,
						},
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

		leafletData.getMap().then(function(map) {
			leafletData.getLayers().then(function(baselayers) {
			   var drawnItems = baselayers.overlays.draw;

			   map.on('draw:created', function (e) {
				 var layer = e.layer;
				 drawnItems.addLayer(layer);
				 layer.editing.enable();
				 console.log(JSON.stringify(layer.toGeoJSON()));
  		 		 $rootScope.$broadcast('EmpriseMapChoosen', layer.toGeoJSON());
			   });

			});
		});


	}]); // controller ChronoEditorMapCtrl

})(); // all
