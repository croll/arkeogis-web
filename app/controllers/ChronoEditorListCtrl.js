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


    }]);
})();
