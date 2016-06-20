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

	ArkeoGIS.controller('ChronoEditorCtrl', ['$scope', '$q', '$mdSidenav', 'arkeoLang', 'login', function ($scope, $q, $mdSidenav, arkeoLang, Login) {

		//if (!Login.requirePermission('langeditor', 'langeditor'))
        //    return;

        var self=this;

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

		$scope.arbo = {
			root: true,
			title: { fr: "Ma chrono", 'en': "My chrono" },
			begin: -1200,
			end: -800,
			content: [
				{
					title: { fr: "Chrono 1", en: "Crono 1" },
					begin: -1200,
					end: -800,
					content: [
						{
							title: { fr: "Chrono 1.1", en: "Crono 1.1" },
							begin: -1200,
							end: -800,
							content: [
								{
									title: { fr: "Chrono 1.1.1", en: "Crono 1.1.1" },
									begin: -1200,
									end: -800,
									content: [
										{
											title: { fr: "Chrono 1.1.1.1", en: "Crono 1.1.1.1" },
											begin: -1200,
											end: -800,
										},
									],
								},
							],
						},
					],
				},
				{
					title: { fr: "Chrono 2", en: "Crono 2" },
					begin: -800,
					end: 200,
					content: [
						{
							title: { fr: "Chrono 2.1", en: "Crono 2.1" },
							begin: -800,
							end: 200,
							content: [
								{
									title: { fr: "Chrono 2.1.1", en: "Crono 2.1.1" },
									begin: -800,
									end: 0,
									content: [
										{
											title: { fr: "Chrono 2.1.1.1", en: "Crono 2.1.1.1" },
										},
									],
								},
								{
									title: { fr: "Chrono 2.1.2", en: "Crono 2.1.2" },
									begin: 0,
									end: 200,
									content: [
										{
											title: { fr: "Chrono 2.1.2.1", en: "Crono 2.1.2.1" },
											begin: 0,
											end: 99,
											content: [],
										},
										{
											title: { fr: "Chrono 2.1.2.2", en: "Crono 2.1.2.2" },
											begin: 100,
											end: 200,
											content: [],
										},
									],
								},
							],
						},
					],
				},
			],
		};

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
			return 'rgb('+colors[idx][level][0]+','+colors[idx][level][1]+','+colors[idx][level][2]+')';
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
				if ((elem.end+1) != next.begin) {
					elem.end_err = true;
					next.begin_err = true;
					errcount++;
				}
			}

			// vérifie que les dates du parent collent avec debut et fin du premier et dernier element
			if (parent && !parent.root) {
				if (!previous) {
					if (elem.begin != parent.begin) {
						elem.begin_err = true;
						parent.begin_err = true;
						errcount++;
					}
				}
				if (!next) {
					if (elem.end != parent.end) {
						elem.end_err = true;
						parent.end_err = true;
						errcount++;
						console.log("aie", elem.end, parent.end);
					}
				}
			}

			// vérifie que 'end' est bien > a 'begin'
			if (!(elem.end > elem.begin)) {
				elem.begin_err = true;
				elem.end_err = true;
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
			delete elem.begin_err;
			delete elem.end_err;
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
				title: "",
				begin: 0,
				end: 0,
				//color: buildcolor(idx1, level+1),
				content: [],
			});
			colorize_all();
		};

		$scope.remove_arbo = function(elem, parent, idx1, idx, level) {
			parent.content.splice(idx, 1);
			colorize_all();
		};


		colorize_all();


		$scope.openLeftMenu = function() {
		    $mdSidenav('left').toggle();
		};


    }]); // controller ChronoEditorCtrl

})(); // all
