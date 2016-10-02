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
	ArkeoGIS.controller('LangEditorCtrl', ['$scope', '$q', 'arkeoLang', 'Translates', 'login', '$timeout', function ($scope, $q, arkeoLang, Translates, Login, $timeout) {

        var self=this;

        $scope.forms = {};
		$scope.langs = [];
        $scope.domains = {};
        $scope.domain="LOGIN";
        $scope.src_lang="fr";
        $scope.dst_lang="en";
        $scope.translates_src = {};
        $scope.translates_dst = {};

		arkeoLang.getActiveLangs().then(function(langs) {
			$scope.langs = langs;
		});

        $scope.setSrcLang = function (newval) {
            $scope.src_lang=newval;
            Translates.twinload($scope.src_lang, $scope.domain).then(function(ret) {
                $scope.translates_src = ret;
            })
        };

        $scope.setDstLang = function (newval) {
            $scope.dst_lang=newval;
            Translates.twinload($scope.dst_lang, $scope.domain).then(function(ret) {
                $scope.translates_dst = ret;
                $scope.forms.langeditorForm.$setPristine();
            })
        };


        $scope.setDomain = function(domain) {
            console.log("domain : ", domain)
            $scope.domain=domain;
            Translates.twinload($scope.src_lang, $scope.domain).then(function(ret) {
                $scope.translates_src = ret;
            })
            Translates.twinload($scope.dst_lang, $scope.domain).then(function(ret) {
                $scope.translates_dst = ret;
                $scope.forms.langeditorForm.$setPristine();
            })
        };

        $scope.save = function() {
            return Translates.twinsave($scope.dst_lang, $scope.domain, $scope.translates_dst).then(function(ret) {
                $scope.forms.langeditorForm.$setPristine();
				$('div#arkeo_loading').show();
				$timeout(function() {
					$('div#arkeo_loading').hide();
				}, 6000);
            }, function(err) {
				$('div#arkeo_loading').show();
				$timeout(function() {
					$('div#arkeo_loading').hide();
				}, 6000);
            });
        };

        $scope.reload = function() {
            console.log("scope ", self);
            $scope.setDomain($scope.domain);
        }

        Translates.domains().then(function(d) {
            $scope.domains=d;
            $scope.setDomain($scope.domain);
        });

    }]);
})();
