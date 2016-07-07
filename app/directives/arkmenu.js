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
    ArkeoGIS.directive('arkMenu', function($compile, $timeout) {

		return {
			restrict: 'E',
			template: '<div class="ark-menu md-whiteframe-4dp md-whiteframe-z2">'
            +          '<ark-menu-item'
            +          ' ng-model="ngModel"'
            +          ' ng-repeat="item in arkTree"'
            +          ' class="ark-menu-item-{{$index}}"'
            +          ' ark-item="item"'
            +          ' ark-is-submenu="true">'
            +          '</ark-menu-item>'
            +         '</div>',
            scope: {
                arkTree: '=',
                ngModel: '=?',
            },
            link: function(scope, element, attrs) {
                $timeout(function() {
                    element.addClass("ark-menu-show");
                }, 0);

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
			template: '<div class="ark-menu-item noselect" ng-click="click($event)" ng-mouseover="hover($event)">'
            +          '<span class="tributtons">'
            +           '<ark-tri-button ng-repeat="(name, tribut) in arkItem.buttons" ark-menu-item-model="arkItem" states="tribut" ng-model="buttons[name]"></ark-tri-button>'
            +          '</span> <span ark-get-translation ark-translations="arkItem.text"></span>'
            +          '<md-icon ng-show="arkItem.menu != undefined" class="ark-menu-have-submenu">chevron_right</md-icon>'
            +         '</div>',
            scope: {
                arkItem: '=',
                arkIsSubmenu: '=?',
                ngModel: '=?',
            },
            link: function(scope, element, attrs) {
                var subopened=false;
                var bigdiv=false;

                if (typeof scope.ngModel !== 'object')
                    scope.ngModel={};

                if (!('arkItem' in scope) || scope.arkItem === undefined) {
                    console.error("ark-item must be defined in a <ark-menu-item />!")
                    return;
                }


                if (('value' in scope.arkItem) && scope.arkItem.value !== undefined) {

                    if (!(scope.arkItem.value in scope.ngModel))
                        scope.ngModel[scope.arkItem.value]={};

                    if ('buttons' in scope.arkItem) {
                        if ('_' in scope.arkItem.buttons)
                            scope.buttons={ '_' : scope.ngModel[scope.arkItem.value] };
                        else
                            scope.buttons=scope.ngModel[scope.arkItem.value];
                    }
                }

                if ('buttons' in scope.arkItem) {
                    scope.$watchCollection('buttons', function(newval) {
                        var val={};

                        for (var k in scope.arkItem.buttons) {
                            if ((k in scope.buttons) && scope.buttons[k] !== undefined)
                                val[k]=scope.buttons[k];
                        }

                        if (('_' in scope.arkItem.buttons) && ('_' in val))
                            val=val._;

                        if ((typeof val == "object" && $.isEmptyObject(val)) || val === undefined)
                            delete scope.ngModel[scope.arkItem.value];
                        else
                            scope.ngModel[scope.arkItem.value] = val;

                        if (subopened) {
                            subopened.remove();
                            subopened = false;
                            renderSubMenu();
                        }

                    });
                }

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
                    subopened = $compile("<ark-menu ng-model='ngModel' ark-tree=\"arkItem.menu\" style='position: absolute; left: "+position.left+"px; top: "+position.top+"px;'></ark-menu>")(scope);
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
