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
     * Directive <ark-confirm/>
     * attributes :
     */
    ArkeoGIS.directive('arkConfirm', ['$mdDialog', '$translate', '$q', function($mdDialog, $translate, $q) {
        return {
            restrict: 'A',
            template: '',
            scope: {
                arkConfirm: '@',
                arkConfirmTitle: '@',
                arkConfirmOk: '@',
                arkConfirmCancel: '@',
                ngClick: '&',
            },
            link: function(scope, element, attrs) {

                var t_translate_done = false;
                var t_confirm = 'GENERAL.CONFIRM_DIALOG.T_CONTENT';
                var t_title = 'GENERAL.CONFIRM_DIALOG.T_TITLE';
                var t_ok = 'GENERAL.CONFIRM_DIALOG.T_OK';
                var t_cancel = 'GENERAL.CONFIRM_DIALOG.T_CANCEL';

                function showConfirmDialog(ev) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title(scope.arkConfirmTitle)
                        .textContent(scope.arkConfirm)
                        .targetEvent(ev)
                        .ok(scope.arkConfirmOk)
                        .cancel(scope.arkConfirmCancel);
                    $mdDialog.show(confirm).then(function() {
                        scope.ngClick();
                    }, function() {
                        // cancel
                    });
                }

                function showConfirm(ev) {
                    if (t_translate_done) {
                        showConfirmDialog(ev);
                    } else {
                        console.log("scope ", scope)
                        $q.allSettled([
                            $translate(scope.arkConfirm !== undefined ? scope.arkConfirm : t_confirm),
                            $translate(scope.arkConfirmTitle !== undefined ? scope.arkConfirmTitle : t_title),
                            $translate(scope.arkConfirmOk !== undefined ? scope.arkConfirmOk : t_ok),
                            $translate(scope.arkConfirmCancel !== undefined ? scope.arkConfirmCancel : t_cancel),
                        ]).then(function(trads) {
                            scope.arkConfirm=trads[0].state == 'fulfilled' ? trads[0].value : t_confirm;
                            scope.arkConfirmTitle=trads[1].state == 'fulfilled' ? trads[1].value : t_title;
                            scope.arkConfirmOk=trads[2].state == 'fulfilled' ? trads[2].value : t_ok;
                            scope.arkConfirmCancel=trads[3].state == 'fulfilled' ? trads[3].value : t_cancel;
                        }).finally(function() {
                            showConfirmDialog(ev);
                        });
                    }
                }


                element.unbind("click").bind("click", function($event) {
                    $event.preventDefault();
                    showConfirm($event);
                });
            },
        };
    }]);
})();
