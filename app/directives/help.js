/* ArkeoGIS - The Geographic Information System for Archaeologists
 * Copyright (C) 2015-2016 CROLL SAS
 *
 * Authors :
 *  Christophe Beveraggi <beve@croll.fr>
 *  Nicolas Dimitrijevic <nicolas@croll.fr>
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
    ArkeoGIS.directive('arkHelp', function() {
		return {
			restrict: 'E',
			replace: true,
			template: '',
			link: function(scope, element) {
				var el = element.prev()[0];
				var tags = ['input', 'textarea', 'md-select', 'md-chips', 'md-date-picker', 'md-switch'];
				var tagName = el.tagName.toLowerCase();
				var sel;
				var attr;
				if (tagName === 'md-input-container') {
					$(el).children().each(function(){
						var subTagName = this.tagName.toLowerCase();
						if (tags.indexOf(subTagName) !== -1) {
							sel = subTagName;
						}
					});
				} else if (tags.indexOf(tagName)) {
					sel = tagName;
				}
				if (sel) {
					if (sel.match(/^md-.*/)) {
						attr = sel.split('md-')[1];
					} else {
						attr = sel;
					}
				}
				element.addClass(attr);
			}	
		};
    });
})();
