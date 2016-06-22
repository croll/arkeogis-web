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
    ArkeoGIS.directive('arkConfirm', function($mdDialog, $translate, $q) {
        return {
            restrict: 'A',
            template: '',
            scope: {
                arkTitle: '=?',
                arkConfirm: '=?',
                arkConfirmOk: '=?',
                arkConfirmCancel: '=?',
                ngClick: '&',
            },
            link: function(scope, element, attrs) {

                function showConfirm(ev) {
                    $q.all([
                        $translate('GENERAL.CONFIRM_DIALOG.T_CONTENT'),
                        $translate('GENERAL.CONFIRM_DIALOG.T_TITLE'),
                        $translate('GENERAL.CONFIRM_DIALOG.T_OK'),
                        $translate('GENERAL.CONFIRM_DIALOG.T_CANCEL'),
                    ]).then(function(trads) {
                        scope.arkConfirm = trads[0];
                        scope.arkTitle = trads[1];
                        scope.arkConfirmOk = trads[2];
                        scope.arkConfirmCancel = trads[3];
                    }, function(err1, err2, err3) {
                        scope.arkConfirm = 'GENERAL.CONFIRM_DIALOG.T_CONTENT';
                        scope.arkTitle = 'GENERAL.CONFIRM_DIALOG.T_TITLE';
                        scope.arkConfirmOk = 'GENERAL.CONFIRM_DIALOG.T_OK';
                        scope.arkConfirmCancel = 'GENERAL.CONFIRM_DIALOG.T_CANCEL';
                    }).finally(function() {
                        // Appending dialog to document.body to cover sidenav in docs app
                        var confirm = $mdDialog.confirm()
                            .title(scope.arkTitle)
                            .textContent(scope.arkConfirm)
                            .targetEvent(ev)
                            .ok(scope.arkConfirmOk)
                            .cancel(scope.arkConfirmCancel);
                        $mdDialog.show(confirm).then(function() {
                            scope.ngClick();
                        }, function() {
                            // cancel
                        });
                    });
                }


                element.unbind("click").bind("click", function($event) {
                    $event.preventDefault();
                    showConfirm($event);
                });
            },
        };
    });
})();
