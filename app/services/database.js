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
    ArkeoGIS.service('databaseService', ['$http', '$q', function($http, $q) {

    var self = this;

  	this.scaleResolution = [
  		{ tr: 'DATABASE.SCALE_RESOLUTION_OBJECT.T_TITLE', id: 'object'},
  		{ tr: 'DATABASE.SCALE_RESOLUTION_SITE.T_TITLE', id: 'site'},
  		{ tr: 'DATABASE.SCALE_RESOLUTION_WATERSHED.T_TITLE', id: 'watershed'},
  		{ tr: 'DATABASE.SCALE_RESOLUTION_MICROREGION.T_TITLE', id: 'micro-region'},
  		{ tr: 'DATABASE.SCALE_RESOLUTION_REGION.T_TITLE', id: 'region'},
  		{ tr: 'DATABASE.SCALE_RESOLUTION_COUNTRY.T_TITLE', id: 'country'},
  		{ tr: 'DATABASE.SCALE_RESOLUTION_EUROPA.T_TITLE', id: 'europa'}
  	];

    this.geographicalExtent = [
      {tr : 'DATABASE.GEOGRAPHICAL_EXTENT_WORLD.T_TITLE', id: 'world'},
      {tr : 'DATABASE.GEOGRAPHICAL_EXTENT_CONTINENT.T_TITLE', id: 'continent'},
      {tr : 'DATABASE.GEOGRAPHICAL_EXTENT_COUNTRY.T_TITLE', id: 'country'}
    ];

    this.type = [
      {tr : 'DATABASE.TYPE_INVENTORY.T_TITLE', id: 'inventory'},
      {tr : 'DATABASE.TYPE_RESEARCH.T_TITLE', id: 'research'},
      {tr : 'DATABASE.TYPE_LITERARYWORK.T_TITLE', id: 'literary-work'}
    ];

    this.state = [
      {tr : 'DATABASE.STATE_INPROGRESS.T_TITLE', id: 'in-progress'},
      {tr : 'DATABASE.STATE_FINISHED.T_TITLE', id: 'finished'}
    ];

    this.context = [
      {tr : 'DATABASE.CONTEXT_TODO.T_TITLE', id: 'todo'}
    ];

    this.occupation = [
      {tr : 'DATABASE.SITE_OCCUPATION_NOTDOCUMENTED', id: 'not_documented'},
      {tr : 'DATABASE.SITE_OCCUPATION_SINGLE.T_TITLE', id: 'single'},
      {tr : 'DATABASE.SITE_OCCUPATION_CONTINUOUS.T_TITLE', id: 'continuous'},
      {tr : 'DATABASE.SITE_OCCUPATION_MULTIPLE.T_TITLE', id: 'multiple'}
    ];

    this.knowledgeType = [
      {tr : 'DATABASE.KNOWLEDGE_TYPE_NOTDOCUMENTED.T_TITLE', id: 'not_documented'},
      {tr : 'DATABASE.KNOWLEDGE_TYPE_LITERATURE.T_TITLE', id: 'literature'},
      {tr : 'DATABASE.KNOWLEDGE_TYPE_PROSPECTED_AERIAL.T_TITLE', id: 'prospected_aerial'},
      {tr : 'DATABASE.KNOWLEDGE_TYPE_PROSPECTED_PEDESTRIAN.T_TITLE', id: 'prospected_pedestrian'},
      {tr : 'DATABASE.KNOWLEDGE_TYPE_SURVEYED.T_TITLE', id: 'surveyed'},
      {tr : 'DATABASE.KNOWLEDGE_TYPE_DIG.T_TITLE', id: 'dig'}
    ];

  }]);
})()