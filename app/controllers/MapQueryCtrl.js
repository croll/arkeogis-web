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

(function() {
	'use strict';
	ArkeoGIS.controller('MapQueryCtrl', ['$scope', '$http', '$location', '$mdSidenav', '$mdComponentRegistry', '$q', '$timeout', '$mdDialog', 'arkeoService', 'arkeoProject', 'arkeoQuery',
	function($scope, $http, $location, $mdSidenav, $mdComponentRegistry, $q, $timeout, $mdDialog, arkeoService, arkeoProject, arkeoQuery) {

		$scope.params = {
			database: [],
			characs: {},
		};

		$scope.showMap2 = function() {
			arkeoQuery.do($scope.params);
		};


		$scope.toggle_query_element = function(elemname) {
			var html_elem_icon = $('.query-element-'+elemname+' .query-element-show-icon');
			var html_elem_content = $('.query-element-'+elemname+' .query-element-content');
			if (html_elem_icon.hasClass('query-element-icon-hide')) {
				html_elem_icon.removeClass("query-element-icon-hide");
				html_elem_content.removeClass("query-element-content-hide");
			} else {
				html_elem_icon.addClass("query-element-icon-hide");
				html_elem_content.addClass("query-element-content-hide");
			}
		}




		/************
		 * databases
		 ************/

		// cache databases by id
		var databases_by_id = null;
		function getDatabaseById(id) {
			if (databases_by_id == null) {
				databases_by_id = {};
				var databasesAll = arkeoProject.get().databases;
				function fillCache(content) {
					_.each(content, function(database) {
						databases_by_id[parseInt(database.id)]=database;
					});
				}
				fillCache(databasesAll);
			}
			return databases_by_id[parseInt(id)];
		}

		// rebuild all types of databases
		$scope.$watchCollection('params.database', function() {
			$scope.databases_per_type = {};
			$scope.params.database.forEach(function(database_id) {
				/*
								var db = _.find(arkeoProject.get().databases, function(_db) {
									console.log("check: ", _db);
									if (_db.id == database_id)
										return _db;
								});
				*/
				var db = getDatabaseById(database_id);
				var type_tr = 'MAP.MENU_DATABASE.T_UNDEFINED';
				switch(db.type) {
					case 'inventory': type_tr = 'MAP.MENU_DATABASE.T_INVENTORY'; break;
					case 'research': type_tr = 'MAP.MENU_DATABASE.T_RESEARCH'; break;
					case 'literary-work': type_tr = 'MAP.MENU_DATABASE.T_LITERARYWORK'; break;
				}
				if (!(type_tr in $scope.databases_per_type))
					$scope.databases_per_type[type_tr] = [];
				$scope.databases_per_type[type_tr].push(db);
			});
		});

		$scope.showDatabaseChooserDialog = function() {
			showDatabaseChooserDialog($scope.params);
		};

		function showDatabaseChooserDialog(params) {
			$mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {
						$scope.databases = arkeoProject.get().databases;
						$scope.selected_databases = params.database;

						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.$watchCollection('selected_databases', function() {
							params.database = $scope.selected_databases.map(function(elem) { return elem.id });
						});

						function init() {
							$scope.selected_databases=[];
							$scope.selected_databases = params.database.map(function(id) {
								return _.find($scope.databases, function(elem) {
									if (elem.id == id) return elem;
								})
							});
						}

						init();

					},
					templateUrl: 'partials/query/databaseschooser.html',
					parent: angular.element(document.body),
					clickOutsideToClose: true,
				})
				.then(function(answer) {
					$scope.status = 'You said the information was "' + answer + '".';
				}, function() {
					$scope.status = 'You cancelled the dialog.';
				});
		};

		function init_database() {
			$scope.params.database = [];
			arkeoProject.get().databases.forEach(function(database) {
				$scope.params.database.push(database.id);
			});
		}


		/************
		 * area
		 ************/


		$scope.showAreaChooserDialog = function() {
			showAreaChooserDialog($scope.params);
		};

		function showAreaChooserDialog(params) {
			$mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {

						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.toDecimal_lat = function() {
							$scope.area.lat.numeric = Math.round(toDecimal($scope.area.lat.deg,
																		   $scope.area.lat.min,
																		   $scope.area.lat.sec)*1000)/1000;
						}

						$scope.toDecimal_lng = function() {
							$scope.area.lng.numeric = Math.round(toDecimal($scope.area.lng.deg,
																$scope.area.lng.min,
																$scope.area.lng.sec)*1000)/1000;
						}

						$scope.fromDecimal_lat = function() {
							var r = fromDecimal($scope.area.lat.numeric);
							$scope.area.lat.deg=r.d;
							$scope.area.lat.min=r.m;
							$scope.area.lat.sec=Math.round(r.s);
						}

						$scope.fromDecimal_lng = function() {
							var r = fromDecimal($scope.area.lng.numeric);
							$scope.area.lng.deg=r.d;
							$scope.area.lng.min=r.m;
							$scope.area.lng.sec=Math.round(r.s);
						}

						function toDecimal(d, m, s) {
							return Math.sign(d) * (Math.abs(d) + (m / 60.0) + (s / 3600.0));
						}

						function fromDecimal(dd) {
							var r={};
							r.d = Math.floor(dd);  // Truncate the decimals
							var t1 = (dd - r.d) * 60;
							r.m = Math.floor(t1);
							r.s = (t1 - r.m) * 60;
							return r;
						}

						function init() {
							if (angular.isObject(params.area) && angular.isObject(params.area.lat) && angular.isObject(params.area.lng)) {
								if (angular.isNumber($scope.area.lat.deg) && angular.isNumber($scope.area.lat.min) && angular.isNumber($scope.area.lat.sec)
									&& angular.isNumber($scope.area.lng.deg) && angular.isNumber($scope.area.lng.min) && angular.isNumber($scope.area.lng.sec)) {
										$scope.area = params.area;
										$scope.fromDecimal_lat();
										$scope.fromDecimal_lng();
								} else if (angular.isNumber($scope.area.lat.numeric) && angular.isNumber($scope.area.lng.numeric)) {
									$scope.area = params.area;
									$scope.toDecimal_lat();
									$scope.toDecimal_lng();
								} else {
									$scope.area = { type: 'free', lat: {}, lng: {}};
								}
							} else {
								$scope.area = { type: 'free', lat: {}, lng: {}};
							}
						}
						init();

					},
					templateUrl: 'partials/query/areachooser.html',
					parent: angular.element(document.body),
					clickOutsideToClose: true,
				})
				.then(function(answer) {
					$scope.status = 'You said the information was "' + answer + '".';
				}, function() {
					$scope.status = 'You cancelled the dialog.';
				});
		};


		/************
		 * characs
		 ************/


		$scope.showCharacChooserDialog = function() {
			showCharacChooserDialog($scope.params);
		};

		function showCharacChooserDialog(params) {
			$mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {
						$scope.characs = arkeoProject.get().characs;
						$scope.selection = [{content: $scope.characs},null,null,null,null];
						$scope.selected_characs = params.characs;

						$scope.hide = function() {
							$mdDialog.hide();
						};

/*
						$scope.$watchCollection('selected_characs', function() {
							params.characs = $scope.selected_characs.map(function(elem) { return elem.id });
						});
*/

						function setCharacSelect(charac, sel) {
							if (sel != '')
								$scope.selected_characs[charac.id]=sel;
							else {
								_.unset($scope.selected_characs, charac.id);
							}

							if (_.has(charac, 'content') && charac.content.length > 0) {
								charac.content.forEach(function(subcharac) {
									setCharacSelect(subcharac, sel);
								})
							}
						}

						$scope.toggleButton = function(charac) {
							if (_.has($scope.selected_characs, charac.id)) {
								var sel = $scope.selected_characs[charac.id];
								if (sel == '+')
									setCharacSelect(charac, '!');
								else if (sel == '!')
									setCharacSelect(charac, '-');
								else if (sel == '-')
									setCharacSelect(charac, '');
							} else {
								setCharacSelect(charac, '+');
							}
						};

						$scope.getButtonState = function(charac) {
							if (_.has($scope.selected_characs, charac.id)) {
								return $scope.selected_characs[charac.id];
							} else {
								return '';
							}
						};

						$scope.haveSubContent = function(charac) {
							if (_.has(charac, 'content') && charac.content.length > 0)
								return true;
							else
								return false;
						};

						$scope.characSelect = function(col, charac) {
							$scope.selection[col]=charac;
							for (var i=col+1; i<5; i++) {
								$scope.selection[i]=null;
							}
						};

						function init() {
							if (!angular.isObject($scope.selected_characs))
								$scope.selected_characs={};
							console.log("scope.characs : ", $scope.characs);
						}
						init();
					},
					templateUrl: 'partials/query/characschooser.html',
					parent: angular.element(document.body),
					clickOutsideToClose: true,
				})
				.then(function(answer) {
					$scope.status = 'You said the information was "' + answer + '".';
				}, function() {
					$scope.status = 'You cancelled the dialog.';
				});
		};

		// cache characs by id
		var characs_by_id = null;
		function getCharacById(id) {
			if (characs_by_id == null) {
				characs_by_id = {};
				var characsAll = arkeoProject.get().characs;
				function fillCache(content) {
					_.each(content, function(charac) {
						characs_by_id[parseInt(charac.id)]=charac;
						if (_.has(charac, 'content'))
							fillCache(charac.content);
					});
				}
				fillCache(characsAll);
			}
			return characs_by_id[parseInt(id)];
		}

		function testSubCharacsSelection(selecteds, charac, concerneds) {
			concerneds.push(charac.id);
			if (selecteds.indexOf(charac.id) != -1) {
				var ok = true;
				if (_.has(charac, 'content')) {
					_.each(charac.content, function(subcharac) {
						if (!testSubCharacsSelection(selecteds, subcharac, concerneds))
							ok=false;
					});
				}
				return ok;
			}
			return false;
		}

		function characsSelectionToStrings() {
			var chraracsAll = arkeoProject.get().characs;
			var selecteds = $scope.params.characs;

			var selecteds_include = [];
			var selecteds_exceptional = [];
			var selecteds_exclude = [];

			_.each(selecteds, function(selected, id) {
				id=parseInt(id);
				if (selected == '+')
					selecteds_include.push(id);
				else if (selected == '!')
					selecteds_exceptional.push(id);
				else if (selected == '-')
					selecteds_exclude.push(id);
			});

			function buildPath(charac, selecteds, sel) {

				// check if the parent is in selection, so we build the path from the parent before.
				if (angular.isObject(charac.parent) && selecteds.indexOf(charac.parent.id) !== -1)
					return buildPath(charac.parent);

				// check if all childrends are also in selection, or not
				var concerneds = [];
				var withChildrens = false;
				if (testSubCharacsSelection(selecteds, charac, concerneds)) {
					// this charac have all it's childrends selecteds.

					if (concerneds.length > 1)
						withChildrens = true;

					// remove all concerneds from selecteds, because theses are childrens
					_.remove(selecteds, function(id) {
						return concerneds.indexOf(id) != -1;
					});

				} else {
					// this charac do NOT have all it's childrends selecteds.

					withChildrens = false;

					// remove only this charac, not childrens
					var i=selecteds.indexOf(charac.id);
					if (i > -1) selecteds.splice(i, 1);
				}

				// now build the full path
				var c=charac;
				var path="";
				while(angular.isObject(c)) {
					path=c.name.fr+(path != '' ? ' / '+path : '');
					c=c.parent;
				}
				if (withChildrens) path+='*';
				return path;
			}

			function buildPaths(selecteds, sel) {
				var paths=[];
				while (selecteds.length > 0) {
					paths.push(buildPath(getCharacById(selecteds[0]), selecteds, sel));
				}
				return paths;
			}

			$scope.characs_selecteds_include = buildPaths(selecteds_include, '+');
			$scope.characs_selecteds_exceptional = buildPaths(selecteds_exceptional, '!');
			$scope.characs_selecteds_exclude = buildPaths(selecteds_exclude, '-');

			console.log("$scope.characs_selecteds_include", $scope.characs_selecteds_include, $scope.characs_selecteds_exceptional, $scope.characs_selecteds_exclude);
		}

		$scope.$watchCollection('params.characs', function() {
			characsSelectionToStrings();
		});


		init_database();
	}]);
})();
