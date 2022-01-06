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
	 * CharacEditorListCtrl Charac Editor List Controller
	 */

	ArkeoGIS.controller('CharacEditorListCtrl', ['$scope', '$q', '$http', 'arkeoLang', 'login', function ($scope, $q, $http, arkeoLang, Login) {

        var self=this;

		$scope.characlist = [];
		$scope.query = {
			page: 1,
			limit: 10,
		};

		function init() {
			$http.get('/api/characs').then(function(data) {
				$scope.characlist = data.data;
			}, function(err) {
				arkeoService.showMessage("load failed : "+err.status+", "+err.statusText);
				console.error("loaded", err);
			})
		}
		init();

    }]);  // controller CharacEditorListCtrl



	/*
	 * CharacEditorCtrl Charac Editor Controller
	 */

	ArkeoGIS.controller('CharacEditorCtrl', ['$scope', '$q', '$mdSidenav', 'arkeoLang', 'login', '$http', 'arkeoService', '$stateParams', '$state', 'user', '$mdDialog', function ($scope, $q, $mdSidenav, arkeoLang, Login, $http, arkeoService, $stateParams, $state, User, $mdDialog) {

        var self=this;

		$scope.mdsidenav_opened = !($stateParams.charac_id > 0);
		$scope.publishable = false;
		$scope.errstatus = {};
		$scope.arbo = {
			name: {},
			content: [],
		};

		$scope.gotolist = function() {
			$state.go('arkeogis.characeditor-list');
		}

		function check_elem(elem, previous, next, parent) {
			var ret={
				errcount: 0,
				elemcount: 1,
				tradscount: {},
			}

			if ('order' in elem) {
				elem.order=parseInt(elem.order);
			} else {
				elem.order=0;
			}

			// compte les traductions
			if ('name' in elem) {
				for (var isocode in elem.name) {
					if (elem.name[isocode].length > 0)
						ret.tradscount[isocode]=1;
				}
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

		$scope.check_all = function() {

			// hack root element (not visible) to have start_date / end_date of extremities
			if ($scope.arbo.content.length >= 1) {
				$scope.arbo.start_date = $scope.arbo.content[0].start_date;
				$scope.arbo.end_date = $scope.arbo.content[$scope.arbo.content.length-1].end_date;
			}

			// recursively check all elements
			var ret = check_elem($scope.arbo, null, null, null);
			console.log("ret: ", ret);

			// check if publishable
			$scope.errstatus = ret;

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
				$scope.errstatus.fulltrads = fulltrads;
				//console.log("fulltrads", fulltrads, publishable);
				fulltrads.sort();
				$scope.arbo.cached_langs = fulltrads.join(',');
			}

			if (!publishable)
				$scope.arbo.active = false;
			$scope.publishable = publishable;
		}

		$scope.add_arbo = function(elem, parent, idx1, idx, level) {
			elem.content.push({
				name: {},
				content: [],
			});
			$scope.check_all();
		};

		$scope.remove_arbo = function(elem, parent, idx1, idx, level) {
			parent.content.splice(idx, 1);
			$scope.check_all();
		};

		$scope.openLeftMenu = function() {
		    $mdSidenav('left').toggle();
			 $scope.check_all()
		};

		$scope.delete_button = function() {
			$scope.showConfirm = function(ev) {
			   // Appending dialog to document.body to cover sidenav in docs app
			   var confirm = $mdDialog.confirm()
			         .title('Would you like to delete your debt?')
			         .textContent('All of the banks have agreed to forgive you your debts.')
			         .ariaLabel('Lucky day')
			         .targetEvent(ev)
			         .ok('Please do it!')
			         .cancel('Sounds like a scam');
			   $mdDialog.show(confirm).then(function() {
			     $scope.status = 'You decided to get rid of your debt.';
			   }, function() {
			     $scope.status = 'You decided to keep your debt.';
			   });
			 };
		};

		$scope.save = function() {
			var url = '/api/characs';
			/*
			var config = {
				responseType: "json",
				data: $scope.arbo,
			};*/

			// copie author user id from the autocomplete input
			if (('author' in $scope.arbo) && ($scope.arbo.author != null) && ('id' in $scope.arbo.author))
				$scope.arbo.author_user_id = $scope.arbo.author.id;

			$http.post(url, $scope.arbo).then(function(data) {
				arkeoService.showMessage("ok !");
				$scope.arbo = data.data;
				$scope.check_all();
			}, function(err) {
				arkeoService.showMessage("save failed : "+err.status+", "+err.statusText);
				console.error("saved", err);
			});

		};

		$scope.load = function() {
			var id = $stateParams.charac_id || 0;
			if (id > 0) {
				var url = '/api/characs/'+id;
				$http.get(url).then(function(data) {
					$scope.arbo = data.data;
					$scope.check_all();
				}, function(err) {
					arkeoService.showMessage("load failed : "+err.status+", "+err.statusText);
					console.error("loaded", err);
				})
			} else {
				console.log("starting with a new empty charac...");
			}
		};

		$scope.delete_charac = function() {
			var url = '/api/characs/'+$scope.arbo.id;
			$http.delete(url).then(function(data) {
				arkeoService.showMessage("deleted !");
				$scope.arbo = {
					name: {},
					start_date: 0,
					end_date: 0,
					content: [],
				};
				$scope.check_all();
				$state.go('arkeogis.characeditor-list');
			}, function(err) {
				arkeoService.showMessage("delete failed : "+err.status+", "+err.statusText);
				console.error("delete", err);
			});
		};

		$scope.download_csv = function() {
			var downloadLink = angular.element('<a></a>');
            //downloadLink.attr('href', '/api/characs/csv?name='+$scope.arbo.name_cur+'&isocode='+arkeoLang.getTranslationLang()+'&dl=1');
            downloadLink.attr('href', '/api/characs/csv?id='+$scope.arbo.id+'&isocode='+arkeoLang.getTranslationLang()+'&dl=1');
            downloadLink.attr('download', $scope.arbo.name_cur+'.csv');
                var event = new MouseEvent('click', {
                  'view': window,
                  'bubbles': true,
                  'cancelable': true
                });
                downloadLink[0].dispatchEvent(event);
		}

		$scope.$watch('file', function () {
			if ($scope.file == null) return;
			arkeoService.showMessage("uploading...");

			$scope.file.arrayBuffer().then(buf => {
				var url = '/api/characszip';

				var data={
					characId: $scope.arbo.id,
					zipContent: Array.from(new Uint8Array(buf)),
				};
	
				$http.post(url, data).then(function(data) {
					arkeoService.showMessage("ok !");
					$scope.arbo = data.data;
					$scope.check_all();
				}, function(err) {
					console.log("err status : ", err.status);
					if (err.status == 400) {
						arkeoService.showMessage("save failed : "+err.data.errors[0].error_string);
					} else {
						arkeoService.showMessage("save failed : "+err.status+", "+err.statusText);
						console.error("not saved :", err);	
					}
				});
			});

		});

/*
		$scope.$watch('file', function () {
			if ($scope.file != null) {
				$scope.file.arrayBuffer().then(buf => {
					if (!("TextDecoder" in window)) {
						alert("Sorry, this browser does not support TextDecoder...");
						return;
					}
					var enc = new TextDecoder("utf-8");
					var characs = enc.decode(buf);

					characs.split("\n").forEach((line, i) => {
						if (i==0) {
							// header
						} else {
							var elems = line.split(";");
							importCsvLine(elems, arkeoLang.getTranslationLang());
						}
					});
					//$scope.arbo = arbo;
				});
			}
		});

		function importCsvLine(line, lang) {
			var elem = {
				id: parseInt(line[0]),
				ark_id: line[1],
				author_user_id: 0,
				name: { },
			};

			if (elem.id > 0) {
				var path=[];
				var found=getArboElemById(elem.id, path);
				if (found) {
					console.log("path: ", path);
				} else {
					console.log("ELEM NOUT FOUND : ", elem);
				}
			} else {
				console.log("import: elem without id : ", elem);
			}
		}

		// recursive search arbo element by id
		function getArboElemById(id, path, content = $scope.arbo.content) {
			return content.find(elem => {
				if (parseInt(elem.id) == id) {
					path.push(elem);
					return true;
				}
				if (elem.content) {
					var found = getArboElemById(id, path, elem.content);
					if (found) {
						path.push(elem);
					}
					return found;
				}
				return false;
			});
		}
*/

		function lock_header() {
			var fixmeTop = $('.fixme').offset().top;       // get initial position of the element

			$(window).scroll(function() {                  // assign scroll event listener

    			var currentScroll = $(window).scrollTop(); // get current position

    			if (currentScroll >= fixmeTop) {           // apply position: fixed if you
        			$('.fixme').css({                      // scroll to that element or below it
            			position: 'fixed',
            			top: '0',
            			left: '0'
        			});
    			} else {                                   // apply position: static
        			$('.fixme').css({                      // if you scroll above it
            			position: 'static'
        			});
    			}
			});
		}

		function init() {
			$scope.load();
			lock_header();
		}
		init();

    }]); // controller CharacEditorCtrl

})(); // all
