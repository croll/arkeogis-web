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

    /*
     * Directive <ark-menu/>
     * attributes :
     *  ark-tree: the menu tree. Here is an exemple :
     *            [ { value: '1', text: 'First',
     *                menu: [ { value: '1.1', text: 'Primary First' } ]
     *              }, { value '2', text: 'Second' } ]
     *  ng-model: the model, an array of active selections
     */
    ArkeoGIS.directive('arkMenu', function($compile) {

		return {
			restrict: 'E',
			template: '<div class="ark-menu"><ark-menu-item ng-repeat="item in arkTree" class="ark-menu-item-{{$index}}" ark-item="item" ark-is-submenu="true"></ark-menu-item>',
            scope: {
                arkTree: '=',
                ngModel: '=?',
            },
            link: function(scope, element, attrs) {
                scope.closeAllButMe = function(item) {
                    var childs = element.children().children();
                    for (var i=0; i<childs.length; i++) {
                        var child = $(childs[i]);
                        var childscope = $(child.children()).scope();
                        if (item !== childscope.arkItem)
                            childscope.close();
                    }
                };
			},
        };
    });

    /*
     * Directive <ark-menu-item/>
     * attributes :
     *  ark-item: the menu item. Here is an exemple :
     *            { value: '1', text: 'First',
     *                menu: [ { value: '1.1', text: 'Primary First' } ] }
     *  ark-is-submenu: boolean, used internaly
     *  ng-model: the model
     */
    ArkeoGIS.directive('arkMenuItem', function($compile) {

		return {
			restrict: 'E',
			template: '<div class="ark-menu-item" ng-click="click($event)" ng-mouseover="hover($event)"><span class="tributtons"><ark-tri-button ng-repeat="tribut in arkItem.buttons" states="tribut"></ark-tri-button></span> {{arkItem.text}}<md-icon ng-show="arkItem.menu != undefined" class="ark-menu-have-submenu">chevron_right</md-icon>',
            scope: {
                arkItem: '=',
                arkIsSubmenu: '=?',
                ngModel: '=?',
            },
            link: function(scope, element, attrs) {
                var subopened=false;
                var bigdiv=false;

                if (scope.arkIsSubmenu === undefined)
                    scope.arkIsSubmenu=false;

                function close() {
                    if (subopened) {
                        subopened.remove();
                        subopened = false;
                    }
                    if (bigdiv) {
                        bigdiv.remove();
                        bigdiv = false;
                    }
                };

                // called by bigdiv, or by menu container closeAllButMe()
                scope.close = function(event) {
                    if (!event) {
                        close();
                    } else if (bigdiv && $(event.target).hasClass('ark-menu-bigdiv'))
                        close();
                };

                element.on('$destroy', function() {
                    close();
                });

                function renderSubMenu() {
                    // if we are the first button, create a big div for closing the menu in case of outside click
                    if (!scope.arkIsSubmenu) {
                        bigdiv=$compile("<div class='ark-menu-bigdiv' style='position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 998;' ng-click='close($event)'>")(scope);
                        $(document.body).append(bigdiv);
                    }


                    var position = element.offset();
                    position.left+= 250;
                    subopened = $compile("<ark-menu ark-tree=\"arkItem.menu\" style='position: absolute; left: "+position.left+"px; top: "+position.top+"px;'></ark-menu>")(scope);
                    $(document.body).append(subopened);
                }

                function clickover() {
                    if (subopened) return;

                    close(); // not really usefull due to the precedent test

                    if (!('menu' in scope.arkItem)) return;

                    if (scope.arkIsSubmenu)
                        scope.$parent.closeAllButMe(scope.arkItem);

                    renderSubMenu();
                }

                scope.hover = function(event) {
                    if (scope.arkIsSubmenu)
                        clickover(event);
                }

                scope.click = function(event) {
                    if (!scope.arkIsSubmenu)
                        clickover(event);
                };
			},
        };
    });


})();
