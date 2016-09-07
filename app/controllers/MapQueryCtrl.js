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

		 // this function is called when cliking on buttons to recursively select childrens
		 var characSubSelect = function(menuitem, states, inclorexcl) {
 			if (states !== _characbuttons.inclorexcl) return;
 		   if (!menuitem) menuitem = $scope.menuChronologies[0];
 		   if (!('menu' in menuitem)) return;

 		   menuitem.menu.forEach(function(menuItem) {
 //				console.log("z menu: ", menuItem);
 			   characSubSelect(menuItem, states, inclorexcl);
 			   if ('buttons' in menuItem && 'inclorexcl' in menuItem.buttons) {
 				   //console.log("paf : ", menuItem.value);
 				   if (inclorexcl === undefined) {
 					   if (menuItem.value in $scope.query.charac) {
 						   delete $scope.query.charac[menuItem.value];
 						   if (_.isEmpty($scope.query.charac[menuItem.value]))
 							   delete $scope.query.charac[menuItem.value];
 					   }
 				   } else {
 					   if (menuItem.value in $scope.query.charac) {
 						   $scope.query.charac[menuItem.value].inclorexcl = inclorexcl;
 					   } else {
 						   $scope.query.charac[menuItem.value] = { inclorexcl: inclorexcl };
 					   }
 				   }
 			   }
 		   });
 	   };

		function characElementToMenuElement(charac) {
			charac.value = charac.id;
			charac.text = charac.name;
			charac.buttons = _characbuttons;
			charac.onchange = characSubSelect;

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
					menu: roots,
					onchange: characSubSelect,
				}];
			})
		});

		/*
		 * menus init : chronologies
		 */

		 // this function is called when cliking on buttons to recursively select childrens
		 var chronoSubSelect = function(menuitem, states, inclorexcl) {
			 //console.log("plif", menuitem, states, inclorexcl);
 			if (!menuitem) menuitem = $scope.menuChronologies[0];
			if (!('menu' in menuitem)) return;

 			menuitem.menu.forEach(function(menuItem) {
 //				console.log("z menu: ", menuItem);
 				chronoSubSelect(menuItem, states, inclorexcl);
 				if ('buttons' in menuItem && 'inclorexcl' in menuItem.buttons) {
 					//console.log("paf : ", menuItem.value);
					if (inclorexcl === undefined) {
						if (menuItem.value in $scope.query.chronology) {
							delete $scope.query.chronology[menuItem.value];
							if (_.isEmpty($scope.query.chronology[menuItem.value]))
								delete $scope.query.chronology[menuItem.value];
						}
					} else {
						if (menuItem.value in $scope.query.chronology) {
							$scope.query.chronology[menuItem.value].inclorexcl = inclorexcl;
						} else {
 							$scope.query.chronology[menuItem.value] = { inclorexcl: inclorexcl };
						}
					}
 				}
 			});
 		};

		$scope.menuChronologies=[];

		function chronoElementToMenuElement(chrono) {
			//chrono.value = chrono.id;
			chrono.value = chrono.id+'#'+chrono.start_date+':'+chrono.end_date;
			chrono.text = chrono.name;
			chrono.buttons = _tributtons;

			if (chrono.content && chrono.content.length > 0) {
				chrono.menu = chrono.content;
				chrono.menu.forEach(chronoElementToMenuElement);
				chrono.onchange = chronoSubSelect;
			}
		}

		$http.get('/api/chronologies/'+$scope.project.chronologies[0].id, {
			params: {
				active: 1,
			},
		}).then(function(data) {
			console.log("chronologies: ", data.data);
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
						value: root.value,
						menu: root.menu,
						onchange: chronoSubSelect,
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

		function populateDatabasesMenu() {
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

			var promises=[];
			$scope.project.databases.forEach(function(database) {
				promises.push($http.get('/api/database/'+database.id).then(function(data) {

					var root = data.data;

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

				}));
			});

			$q.all(promises).then(function() {
				$scope.menuDatabases = [{
					text: "MAP.MENU_DATABASE.T_TITLE",
					buttons: [],
					value: 0,
					menu: menu,
				}];
			});

		}
		populateDatabasesMenu();

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

        /*
		 * query => map
		 */


		$scope.showMap = function() {
			arkeoQuery.do($scope.query);
		};



/****************************************************************************/

		$scope.params = {
			databases: [],
		};


		// rebuild all types of databases
		$scope.$watchCollection('params.databases', function() {
			$scope.databases_per_type = {};
			$scope.params.databases.forEach(function(elem) {
				var type_tr = 'MAP.MENU_DATABASE.T_UNDEFINED';
				switch(elem.type) {
					case 'inventory': type_tr = 'MAP.MENU_DATABASE.T_INVENTORY'; break;
					case 'research': type_tr = 'MAP.MENU_DATABASE.T_RESEARCH'; break;
					case 'literary-work': type_tr = 'MAP.MENU_DATABASE.T_LITERARYWORK'; break;
				}
				if (!(type_tr in $scope.databases_per_type))
					$scope.databases_per_type[type_tr] = [];

				var db = _.find(arkeoProject.get().databases, function(_db) {
					console.log("check: ", _db);
					if (_db.id == elem)
						return _db;
				});

				$scope.databases_per_type[type_tr].push(db);
			});
		});


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

		$scope.showDatabaseChooserDialog = function() {
			showDatabaseChooserDialog($scope.params);
		};

		function showDatabaseChooserDialog(params) {
			$mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {
						$scope.databases = arkeoProject.get().databases;
						$scope.selected_databases = params.databases;

						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.$watchCollection('selected_databases', function() {
							params.databases = $scope.selected_databases.map(function(elem) { return elem.id });
						});

						function init() {
							$scope.selected_databases=[];
							$scope.selected_databases = params.databases.map(function(id) {
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


	}]);
})();
