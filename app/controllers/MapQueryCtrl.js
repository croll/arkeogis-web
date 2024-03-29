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

	//'use strict';
	ArkeoGIS.controller('MapQueryCtrl', ['$scope', '$http', '$location', '$mdSidenav', '$mdComponentRegistry', '$q', '$timeout', '$mdDialog', '$translate', '$filter', '$rootScope', 'arkeoService', 'arkeoProject', 'arkeoQuery', 'arkeoMap',
	function($scope, $http, $location, $mdSidenav, $mdComponentRegistry, $q, $timeout, $mdDialog, $translate, $filter, $rootScope, arkeoService, arkeoProject, arkeoQuery, arkeoMap) {
            /*
             * menus init : buttons styles
             */
        arkeoMap.initPromise();

        arkeoQuery.reset();

		var my_databases = [];

        var shapeOptions = {
            stroke: true,
            color: '#ff9800',
            weight: 4,
            opacity: 0.5,
            fill: true,
            fillColor: null,
            fillOpacity: 0.2,
        };

		init_database();

		$scope.params = {area: {type:'map'}};
		$scope.query = arkeoQuery.add(newParams());
		$scope.editing_chronology = null;

		var layerDraw, drawnItems;

		function newParams() {
			return {
				database: my_databases,
				characs: {},
				chronologies: [],
				area: {type: 'map', lat: 0, lng: 0, radius: 0, geojson: arkeoProject.get().geojson},
				others: {
					text_search: '',
					text_search_in: ["site_name", "city_name", "bibliography", "comment"],
					occupation: [],
					knowledges: [],
					characs_linked: "at-least-one",
					centroid: '',
				},
			};
		}

		/*
		$scope.$watch('query', function(new_query) {
			console.log("watch query ....", new_query);
			if (new_query.done)
				$scope.params = angular.copy(new_query.params);
			else
				$scope.params = new_query.params;
		});
		*/

		var hack_inhibit_watch_params = false;

		$scope.$watch(function() { return angular.toJson($scope.params); }, function(a, b) {
			if (hack_inhibit_watch_params) {
				hack_inhibit_watch_params = false;
				return;
			}
			if ($scope.query.done) {
				arkeoQuery.add($scope.params);
			}
		});

		$scope.$watch(function() { return arkeoQuery.getCurrent() }, function(new_query, old_query) {
			console.info("new query: ", new_query);
			if (new_query !== undefined && 'params' in new_query && new_query.params) {
				if (new_query.params === $scope.params) { // we are making a new query because we had modifed the current one
						// so here, we don't copy again the $scope.params
					$scope.query = new_query;
				} else {
					$scope.query = new_query;
					if (new_query.done) {
						hack_inhibit_watch_params = true;
						$scope.params = angular.copy(new_query.params);
					} else {
						$scope.params = new_query.params;
					}
				}
				// Redraw area for mod or archived queries
				if (new_query.letter != old_query.letter) {
					redrawArea();
				}
			} else {
				arkeoQuery.add(newParams());
			}
		});

		function updateParamsArea(redraw) {

				console.info("UPDATE PARAMS AREA");

                switch ($scope.params.area.type) {
                    case 'disc':
						var center = layerDraw.getBounds().getCenter();
	                    $scope.params.area.lat = center.lat;
	                    $scope.params.area.lng = center.lng;
	                    $scope.params.area.radius = layerDraw.getRadius();
                    	break;
                    default:
		                $scope.params.area.lat = 0;
		                $scope.params.area.lng = 0;
		                $scope.params.area.radius = 0;
		                $scope.params.area.geojson = layerDraw.toGeoJSON();
                }
				if (redraw) {
					redrawArea();
				}
		}

		function updateMapArea() {
			if (!$scope.params.area || $scope.params.area.type != 'map') {
				return;
			}
			arkeoMap.getMap().then(function(map) {
	        	$scope.params.area.geojson = L.rectangle(map.getBounds()).toGeoJSON();
			}, function(err) {
				console.log("Error getting map");
			});
		}

		function redrawArea() {
			arkeoMap.getMap().then(function(map) {

				if (layerDraw) {
					map.removeLayer(layerDraw);
					layerDraw = null;
				}

				switch($scope.params.area.type) {
					case 'disc':
						layerDraw = L.circle([$scope.params.area.lat, $scope.params.area.lng], $scope.params.area.radius, shapeOptions).addTo(drawnItems);
					break;
					case 'rect':
						layerDraw = L.rectangle(L.geoJson($scope.params.area.geojson).getBounds(), shapeOptions).addTo(drawnItems);
					break;
					case 'free':
						L.geoJson($scope.params.area.geojson, {
						 	  onEachFeature: function (feature, layer) {
						  	    layerDraw = layer.addTo(drawnItems);
							},
							style: shapeOptions
						});
					break;
				}
				if (layerDraw) {
                	layerDraw.editing.enable();
					recenterMapFromQuery($scope.query);
				}
			});

		}

		function recenterMapFromQuery(query) {
			arkeoMap.getMap().then(function(map) {
				if (query.params.area.type == 'disc') {
					map.fitBounds(L.circle([query.params.area.lat, query.params.area.lng], query.params.area.radius).getBounds());
				} else {
					map.fitBounds(L.geoJson(angular.fromJson(query.params.area.geojson)).getBounds());
				}
			});
		}

		$scope.showMap = function() {
				$mdSidenav('sidenav-left').close();
				//$scope.params = angular.copy($scope.query.params);
				$scope.query.params = angular.copy($scope.params);
				arkeoQuery.do($scope.query).then(function(q) {
					if (angular.isUndefined(q.data.features) || q.data.features.length == 0) {
						arkeoService.showMessage('MAP.MESSAGE_QUERY_RESULT.T_NORESULT');
						$mdSidenav('sidenav-left').open();
					}
				}, function(err) {
					if (typeof err === 'string' || err instanceof String)
						arkeoService.showMessage(err);
					else
						arkeoService.showMessage('MAP.MESSAGE_QUERY_RESULT.T_SERVERERROR');
					$mdSidenav('sidenav-left').open();
				})
		};

		$scope.initQuery = function() {
			$scope.query = arkeoQuery.add(newParams());
			arkeoMap.getMap().then(function(map) {
				recenterMapFromQuery($scope.query);
			});
		};

		$scope.helpAndSaveBeve = function() {
			if (!('beve' in $scope.params))
				$scope.params.beve = 0;
			$scope.params.beve++;
			console.log("beve smacked ", $scope.params.beve, "time(s) !");
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

		// usefull for debugging
		$scope.getHostname = function() {
			return window.location.hostname;
		};



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
			_.each($scope.params.database, function(database_id) {
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
						console.log("databases: ", $scope.databases);
						$scope.query={
							filter: '',
			                limit: 20,
			                page: 1,
							order: "(type_tr | translate) + name"
						}

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
			my_databases = [];
			arkeoProject.get().databases.forEach(function(database) {
				my_databases.push(database.id);
			});
		}


            /************
             * area
             ************/

            arkeoMap.getMap().then(function(map) {

                drawnItems = new L.FeatureGroup().addTo(map);

				map.on('moveend', function() {
					updateMapArea();
				});

				map.on('load', function() {
					updateMapArea();
				});

                map.on('draw:drawstart', function(e) {
                    // if (layerDraw) {
                    //     drawnItems.removeLayer(layerDraw);
					// 	layerDraw = null;
                    // }
                    $mdSidenav('sidenav-left').close();
                });

                map.on('draw:created', function(e) {
                    layerDraw = e.layer;
                    drawnItems.addLayer(layerDraw);
                    layerDraw.editing.enable();
					$scope.params.area.redraw = true;
					updateParamsArea();
                });

                map.on('draw:editvertex', function(e) {
					$scope.params.area.redraw = true;
					updateParamsArea();
                });

                map.on('draw:editresize', function(e) {
					updateParamsArea();
				});

                map.on('draw:editmove', function(e) {
					updateParamsArea();
				});

                $scope.initDraw = function() {

                    $rootScope.showDrawButtons = true;
                    drawnItems.removeLayer(layerDraw);
					layerDraw = null;
                    switch ($scope.params.area.type) {
                        case 'rect':
                            new L.Draw.Rectangle(map, {
                                shapeOptions: shapeOptions
                            }).enable();
                            break;
                        case 'disc':
                            new L.Draw.Circle(map, {
                                shapeOptions: shapeOptions,
                                allowIntersection: false
                            }).enable();
                            break;
                        case 'free':
                            new L.Draw.Polygon(map, {
                                shapeOptions: shapeOptions,
                                allowIntersection: false,
                                showArea: true
                            }).enable();
                            break;
                    }
                }

                $scope.cancelDraw = function() {
                    $rootScope.showDrawButtons = false;
                    drawnItems.removeLayer(layerDraw);
					layerDraw = null;
                    $scope.params.area = {
                        type: 'map',
                        lat: 0,
                        lng: 0,
                        radius: 0,
                        geojson: {}
                    }
                    $mdSidenav('sidenav-left').open();
                }

                $scope.validDraw = function() {
                    $rootScope.showDrawButtons = false;
                    $mdSidenav('sidenav-left').open();
					// updateParamsArea(true);
                }

                $scope.showAreaChooserDialog = function(params) {
                    $mdDialog.show({
                            controller: function($scope, $mdDialog, arkeoService) {

                                $scope.area = params.area;

								$scope.latInDeg = {};
								$scope.lngInDeg = {};

                                $scope.hide = function() {
                                    switch ($scope.area.type) {
                                        case 'custom':
											$scope.area.geojson = {};
                                            var score = 0;
                                            if ($scope.area.lat != "" && $scope.area.lat != null) {
                                                score++;
                                            }
                                            if ($scope.area.lng != "" && $scope.area.lng != null) {
                                                score++;
                                            }
                                            if ($scope.area.radius != "" && $scope.area.radius != null && $scope.area.radius > 0) {
                                                score++;
                                            }
                                            if (score < 3) {
                                                $scope.showAreaCustomError = true;
                                                return
                                            }
                                            break;
                                        case 'map':
                                            $scope.area.lat = 0;
                                            $scope.area.lng = 0;
                                            $scope.area.radius = 0;
                                            arkeoMap.getMap().then(function(map) {
                                                $scope.area.geojson = L.rectangle(map.getBounds()).toGeoJSON();
                                            });
                                            break;
                                    }
                                    $mdDialog.hide();
                                };

                                $scope.toDecimal_lat = function() {
									if ($scope.latInDeg.deg == null || $scope.latInDeg.min == null || $scope.latInDeg.sec == null) {
										return;
									}
                                    $scope.area.lat = Math.round(toDecimal($scope.latInDeg.deg,
                                        $scope.latInDeg.min,
                                        $scope.latInDeg.sec) * 1000) / 1000;
                                }

                                $scope.toDecimal_lng = function() {
									if ($scope.lngInDeg.deg == null || $scope.lngInDeg.min == null || $scope.lngInDeg.sec == null) {
										return;
									}
                                    $scope.area.lng = Math.round(toDecimal($scope.lngInDeg.deg,
                                        $scope.lngInDeg.min,
                                        $scope.lngInDeg.sec) * 1000) / 1000;
                                }

                                if (angular.isNumber($scope.area.lat) && angular.isNumber($scope.area.lng)) {
                                    $scope.toDecimal_lat();
                                    $scope.toDecimal_lng();
                                }

                                $scope.fromDecimal_lat = function() {
                                    var r = fromDecimal($scope.area.lat);
                                    $scope.latInDeg.deg = r.d;
                                    $scope.latInDeg.min = r.m;
                                    $scope.latInDeg.sec = Math.round(r.s);
                                }

                                $scope.fromDecimal_lng = function() {
                                    var r = fromDecimal($scope.area.lng);
                                    $scope.lngInDeg.deg = r.d;
                                    $scope.lngInDeg.min = r.m;
                                    $scope.lngInDeg.sec = Math.round(r.s);
                                }

                                function toDecimal(d, m, s) {
                                    return Math.sign(d) * (Math.abs(d) + (m / 60.0) + (s / 3600.0));
                                }

                                function fromDecimal(dd) {
                                    var r = {};
                                    r.d = Math.floor(dd); // Truncate the decimals
                                    var t1 = (dd - r.d) * 60;
                                    r.m = Math.floor(t1);
                                    r.s = (t1 - r.m) * 60;
                                    return r;
                                }

                            },
                            templateUrl: 'partials/query/areachooser.html',
                            parent: angular.element(document.body),
                            clickOutsideToClose: false,
                        })
                        .then(function() {
                            if ('rect-disc-free'.indexOf($scope.params.area.type) != -1) {
                                $scope.initDraw();
                            } else {
								if (layerDraw) {
                    				drawnItems.removeLayer(layerDraw);
									layerDraw = null;
								}
							}
                        });
                };
            });



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

						function setCharacSelect(charac, selected, include, exceptional) {
							if (selected)
								$scope.selected_characs[charac.id]={
									include: include,
									exceptional: exceptional,
									root_id: arkeoProject.getCharacRoot(charac).id,
								};
							else {
								_.unset($scope.selected_characs, charac.id);
							}

							if (_.has(charac, 'content') && charac.content.length > 0) {
								charac.content.forEach(function(subcharac) {
									setCharacSelect(subcharac, selected, include, exceptional);
								})
							}
						}

						$scope.toggleButton = function(charac) {
							if (_.has($scope.selected_characs, charac.id)) {
								var sel = $scope.selected_characs[charac.id];
								if (sel.include && !sel.exceptional) // include => exclude
									setCharacSelect(charac, true, false);
								else if (!sel.include) // exclude => exceptional
									setCharacSelect(charac, true, true, true);
								else if (sel.include && sel.exceptional) // exceptional => unselected
									setCharacSelect(charac, false);
							} else { // unselected => include
								setCharacSelect(charac, true, true, false);
							}
						};

						$scope.getButtonState = function(charac) {
							if (_.has($scope.selected_characs, charac.id)) {
								var sel=$scope.selected_characs[charac.id];
								if (sel.include && !sel.exceptional) return '+';
								else if (sel.include && sel.exceptional) return '!';
								else if (!sel.include) return '-';
								return '';
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
				if (selected.include && !selected.exceptional)
					selecteds_include.push(id);
				else if (selected.include && selected.exceptional)
					selecteds_exceptional.push(id);
				else if (!selected.include)
					selecteds_exclude.push(id);
			});

			function buildPath(charac, selecteds) {

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
					path=$filter('arkTranslate')(c.name)+(path != '' ? ' / '+path : '');
					c=c.parent;
				}
				if (withChildrens) path+='*';
				return path;
			}

			function buildPaths(selecteds) {
				var paths=[];
				while (selecteds.length > 0) {
					var charac = arkeoProject.getCharacById(selecteds[0]);
					if (charac)
						paths.push(buildPath(charac, selecteds));
					else {
						console.warn("a charac doesn't exist anymore, id: ", selecteds[0])
						selecteds.splice(0, 1);
					}
				}
				return paths;
			}

			$scope.characs_selecteds_include = buildPaths(selecteds_include);
			$scope.characs_selecteds_exceptional = buildPaths(selecteds_exceptional);
			$scope.characs_selecteds_exclude = buildPaths(selecteds_exclude);
		}

		$scope.$watchCollection('params.characs', function() {
			characsSelectionToStrings();
		});



		/************
		 * chronologies
		 ************/


		$scope.showChronologyChooserDialog = function(params) {
			if (params)
				showChronologyChooserDialog(params, $scope.params.chronologies);
			else {
				params = {
					start_date: 2147483647,
					end_date: -2147483648,
					existence_inside_include: '+',
					existence_inside_part: 'partly',
					existence_inside_sureness: 'potentially',
					existence_outside_include: '',
					existence_outside_sureness: 'potentially',
				}
				$scope.params.chronologies.push(params);
				showChronologyChooserDialog(params, $scope.params.chronologies);
			}
		};

		function showChronologyChooserDialog(chrono_params, all_chronos) {
			$scope.editing_chronology = chrono_params;
			$mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {
						$scope.chronologies = arkeoProject.get().chronologies;
						$scope.selection = [{content: $scope.chronologies},$scope.chronologies[0],null,null,null];
						$scope.params = chrono_params;
						$scope.error_select_period = false;

						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.remove = function() {
							var index = all_chronos.indexOf(chrono_params);
							if (index >= 0) {
							  all_chronos.splice( index, 1 );
							  $mdDialog.hide();
							}
						}

						$scope.toggle_display = function(elemname) {
							var html_elem_icon = $('.'+elemname+'-show-icon');
							var html_elem_content = $('.'+elemname+'-content');
							if (html_elem_icon.hasClass('display-icon-hide')) {
								html_elem_icon.removeClass("display-icon-hide");
								html_elem_content.removeClass("display-content-hide");
							} else {
								html_elem_icon.addClass("display-icon-hide");
								html_elem_content.addClass("display-content-hide");
							}
						}

						$scope.toggleButton = function(chronology) {
							if ($scope.params.start_date == 2147483647 && $scope.params.end_date == -2147483648) { // special case for undetermined
								$scope.params.start_date = chronology.start_date;
								$scope.params.end_date = chronology.end_date;
								return;
							}

							if ((chronology.start_date >= $scope.params.start_date) && (chronology.end_date <= $scope.params.end_date)) {
								// the user has clicked on an already selected checkbox, so we reset to undetermined
								$scope.params.start_date = 2147483647;
								$scope.params.end_date = -2147483648;
							} else {
								if (chronology.start_date < $scope.params.start_date) {
									$scope.params.start_date = chronology.start_date;
								}
								if (chronology.end_date > $scope.params.end_date) {
									$scope.params.end_date = chronology.end_date;
								}
							}
						};

						$scope.getButtonState = function(chronology) {
							if ($scope.params.start_date == 2147483647 && $scope.params.end_date == -2147483648) { // special case for undetermined
								if (chronology.start_date == 2147483647 && chronology.end_date == -2147483648) return '+';
								else return '';
							}

							if ((chronology.start_date >= $scope.params.start_date) && (chronology.end_date <= $scope.params.end_date)) {
								return '+';
							} else {
								if ($scope.params.end_date >= chronology.start_date && $scope.params.start_date <= chronology.end_date) {
									return '.'
								} else {
									return ''
								}
							}
						};

						$scope.haveSubContent = function(chronology) {
							if (_.has(chronology, 'content') && chronology.content.length > 0)
								return true;
							else
								return false;
						};

						$scope.chronologySelect = function(col, chronology) {
							$scope.selection[col]=chronology;
							for (var i=col+1; i<5; i++) {
								$scope.selection[i]=null;
							}
						};

					},
					templateUrl: 'partials/query/chronologieschooser.html',
					parent: angular.element(document.body),
					clickOutsideToClose: false,
				})
				.then(function(answer) {
					$scope.editing_chronology = null;
				}, function() {
					$scope.editing_chronology = null;
				});
		};

		// cache chronologies by id
		var chronologies_by_id = null;
		function getChronologyById(id) {
			if (chronologies_by_id == null) {
				chronologies_by_id = {};
				var chronologiesAll = arkeoProject.get().chronologies;
				function fillCache(content) {
					_.each(content, function(chronology) {
						chronologies_by_id[parseInt(chronology.id)]=chronology;
						if (_.has(chronology, 'content'))
							fillCache(chronology.content);
					});
				}
				fillCache(chronologiesAll);
			}
			return chronologies_by_id[parseInt(id)];
		}

		$scope.$watch(function() { return angular.toJson($scope.params.chronologies); }, function() {
		//$scope.$watchCollection('params.chronologies', function() {
			var trads = {
				'QUERY_CHRONOLOGIES.SENTENSE.T_ALL' : "EXISTENCE_INSIDE_INCLUDE les sites ayant EXISTENCE_INSIDE_SURENESS une existence EXISTENCE_INSIDE_PART durant la période PERIOD. Ces sites EXISTENCE_OUTSIDE_INCLUDE EXISTENCE_OUTSIDE_SURENESS avoir existé en dehors de cette période.",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_INCLUDE.T_INCLUDE' : "Inclure",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_INCLUDE.T_EXCLUDE' : "Exclure",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_PART.T_PARTLY' : "partielle",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_PART.T_FULL'   : "intégrale",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_SURENESS.T_POTENTIALLY_ONLY' : "uniquement potentiellement",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_SURENESS.T_POTENTIALLY' : "potentiellement",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_SURENESS.T_CERTAINLY' : "assurément",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_INCLUDE.T_POSSIBLY' : "peuvent",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_INCLUDE.T_MUST' : "doivent",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_INCLUDE.T_MUSTNOT' : "ne peuvent pas",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_SURENESS.T_POTENTIALLY_ONLY' : "uniquement potentiellement",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_SURENESS.T_POTENTIALLY' : "potentiellement",
				'QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_SURENESS.T_CERTAINLY' : "assurément",
			};

			var q={};
			for (var t in trads)
				q[t]=$translate(t);

			$q.all(q).then(function(translateds) {
				trads = translateds;
			}, function(err) {
				console.log(err);
			}).then(function() {
				$scope.chronologies_lines = [];
				_.each($scope.params.chronologies, function(p) {

					var str = trads['QUERY_CHRONOLOGIES.SENTENSE.T_ALL'];

					var w='BUG';
					switch(p.existence_inside_include) {
						case '+':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_INCLUDE.T_INCLUDE'];
							break;
						case '-':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_INCLUDE.T_EXCLUDE'];
							break;
					}
					str = str.replace('EXISTENCE_INSIDE_INCLUDE', w);

					w='BUG';
					switch(p.existence_inside_part) {
						case 'partly':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_PART.T_PARTLY'];
							break;
						case 'full':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_PART.T_FULL'];
							break;
					}
					str = str.replace('EXISTENCE_INSIDE_PART', w);

					w='BUG';
					switch(p.existence_inside_sureness) {
						case 'potentially-only':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_SURENESS.T_POTENTIALLY_ONLY'];
							break;
						case 'potentially':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_SURENESS.T_POTENTIALLY'];
							break;
						case 'certainly':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_INSIDE_SURENESS.T_CERTAINLY'];
							break;
					}
					str = str.replace('EXISTENCE_INSIDE_SURENESS', w);

					w='BUG';
					switch(p.existence_outside_include) {
						case '':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_INCLUDE.T_POSSIBLY'];
							break;
						case '+':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_INCLUDE.T_MUST'];
							break;
						case '-':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_INCLUDE.T_MUSTNOT'];
							break;
					}
					str = str.replace('EXISTENCE_OUTSIDE_INCLUDE', w);


					w='BUG';
					switch(p.existence_outside_sureness) {
						case 'potentially-only':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_SURENESS.T_POTENTIALLY_ONLY'];
							break;
						case 'potentially':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_SURENESS.T_POTENTIALLY'];
							break;
						case 'certainly':
							w = trads['QUERY_CHRONOLOGIES.SENTENSE_EXISTENCE_OUTSIDE_SURENESS.T_CERTAINLY'];
							break;
					}
					str = str.replace('EXISTENCE_OUTSIDE_SURENESS', w);

					var chrono_name = "X";
					var chrono = arkeoProject.getChronologyByDates(p.start_date, p.end_date);
					if (chrono) {
						chrono_name = $filter('arkTranslate')(chrono.name);
					} else {
						var chrono1 = arkeoProject.getChronologyByStartDate(p.start_date);
						var chrono2 = arkeoProject.getChronologyByEndDate(p.end_date);
						if (chrono1 && chrono2)
							chrono_name = $filter('arkTranslate')(chrono1.name)+' - '+$filter('arkTranslate')(chrono2.name);
						else {
							chrono_name = $filter('arkYear')(p.start_date)+' / '+$filter('arkYear')(p.end_date);
						}
					}
					str = str.replace('PERIOD', chrono_name);


					$scope.chronologies_lines.push(str);
				});

			});

		});

		/************
		 * others
		 ************/

		$scope.showOthersChooserDialog = function() {
			showOthersChooserDialog($scope.params);
		};

		function showOthersChooserDialog(params) {
			$mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {
						$scope.others = params.others;

						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.checkbox_toggle = function(arr, elem) {
							if (arr.indexOf(elem) > -1)
								arr.splice(arr.indexOf(elem), 1);
							else
								arr.push(elem);
						};

						$scope.checkbox_ischecked = function(arr, elem) {
							return arr.indexOf(elem) > -1;
						};

					},
					templateUrl: 'partials/query/otherschooser.html',
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
		 * query save
		 ************/

/*
		$scope.showQuerySaveDialog = function() {
			showQuerySaveDialog($scope.query);
		};
*/
		$scope.$parent.showQuerySaveDialog = function (query) {
			return showQuerySaveDialog(query);
		};

		function showQuerySaveDialog(query) {
			return $mdDialog.show({
					controller: function($scope, $mdDialog, arkeoService) {
						$scope.name = query.name;

						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.save = function() {
							return $http.post("/api/query", {
								project_id: arkeoProject.get().id,
								name: $scope.name,
								params: angular.toJson(query.params),
							}).then(function(result) {
								$mdDialog.hide();
								arkeoService.showMessage('MAP.MESSAGE_QUERY_SAVED.T_CONTENT');
								init_saved_queries();
				            }, function(err) {
				                arkeoService.fieldErrorDisplay(err);
				                console.error(err);
				            });
						};

					},
					templateUrl: 'partials/query/savequery.html',
					parent: angular.element(document.body),
					clickOutsideToClose: true,
				})
				.then(function(answer) {
					$scope.status = 'You said the information was "' + answer + '".';
				}, function() {
					$scope.status = 'You cancelled the dialog.';
				});
		};


		function init_saved_queries() {
			return $http.get("/api/query/"+arkeoProject.get().id).then(function(data) {
				$scope.saved_queries = data.data;
			}, function(err) {
				console.error("getting project saved queries failed : ", err);
			});

		}

		$scope.deleteSavedQuery = function(saved_query) {
			return $http.delete("/api/query", {
				params: {
					project_id: arkeoProject.get().id,
					name: saved_query.name,
				}
			}).then(function(data) {
				$scope.saved_queries = data.data;
				arkeoService.showMessage('MAP.MESSAGE_QUERY_DELETED.T_CONTENT');
			}, function(err) {
				console.error("getting project saved queries failed : ", err);
			});
		};

		$scope.showSavedQuery = function(new_saved_query) {
			if (new_saved_query != undefined && new_saved_query.name.length > 0) {
				// load this saved query
				arkeoQuery.add(angular.fromJson(new_saved_query.params), new_saved_query.name);
				$scope.cur_saved_query = undefined;
			}
		};

		$scope.$watch("cur_saved_query", function(new_saved_query) {
			if (new_saved_query != undefined && new_saved_query.name.length > 0) {
				// load this saved query
				arkeoQuery.add(angular.fromJson(new_saved_query.params), new_saved_query.name);
				$scope.cur_saved_query = undefined;
			}
		});

		init_saved_queries();

	}]);
})();
