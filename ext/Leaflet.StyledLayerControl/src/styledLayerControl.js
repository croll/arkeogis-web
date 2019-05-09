L.Control.StyledLayerControl = L.Control.Layers.extend({
    options: {
        collapsed: true,
        position: 'topright',
        autoZIndex: true,
        autoScroll: true,
        buttons: []
    },

    initialize: function(baseLayers, groupedOverlays, options) {
        var i,
            j;
        L.Util.setOptions(this, options);

        this._layerControlInputs = [];
        this._layers = [];
        this._lastZIndex = 0;
        this._handlingClick = false;
        this._groupList = [];
        this._domGroups = [];
        this.removableGroupsNum = 0;
        this._buttonList = [];

        for (i in baseLayers) {
            for (var j in baseLayers[i].layers) {
                this._addLayer(baseLayers[i].layers[j], j, baseLayers[i], false);
            }
        }

        for (i in groupedOverlays) {
            for (var j in groupedOverlays[i].layers) {
                this._addLayer(groupedOverlays[i].layers[j], j, groupedOverlays[i], true);
            }
        }


    },

    onAdd: function(map) {
        this._initLayout();
        this._initCustomLayout();

        // Create top buttons
        if (this.options.buttons.length) {
            for (i in this.options.buttons) {
                this._addButton(this.options.buttons[i]);
            }
        }

        this._update();

        map
            .on('layeradd', this._onLayerChange, this)
            .on('layerremove', this._onLayerChange, this)
            .on('zoomend', this._onZoomEnd, this);

        return this._container;
    },

    onRemove: function(map) {
        map
            .off('layeradd', this._onLayerChange)
            .off('layerremove', this._onLayerChange);
    },

    addBaseLayer: function(layer, name, group) {
        this._addLayer(layer, name, group, false);
        this._update();
        return this;
    },

    addOverlay: function(layer, name, group) {
        this._addLayer(layer, name, group, true);
        this._update();
        // only open last query and toggle other groups
        // Close main layers
        document.getElementById('ac0').checked = false;
        var groupElements = document.querySelectorAll('.leaflet-control-layers-overlays > div');
        _.each(groupElements, function(el) {
            // Do not evaluate first element, it's project layers group
            var id = parseInt(el.id.split('-').pop());
            var inputID = 'ac'+id;

            if (id < groupElements.length) {
                if (document.getElementById('ac'+id).checked) {
                    document.getElementById('ac'+id).checked = false;
                }
            }
        });
        return this;
    },

    replaceOverlay: function(layer, name) {
        var id = L.stamp(layer);
        for (lid in this._layers) {
          if (this._layers[lid].name == name) {
            this._map.removeLayer(this._layers[lid].layer);
            this._layers[lid].layer._layers = layer._layers;
            this._map.addLayer(this._layers[lid].layer);
          }
        }
    },

    removeLayer: function(layer) {
        var id = L.Util.stamp(layer);
        delete this._layers[id];
        this._update();
        return this;
    },

    removeGroup: function(group_Name, del) {
        for (group in this._groupList) {
            if (this._groupList[group].groupName == group_Name) {
                for (layer in this._layers) {
                    if (this._layers[layer].group && this._layers[layer].group.name == group_Name) {
                        if (del) {
                            this._map.removeLayer(this._layers[layer].layer);
                        }
                        if (this._layers[layer].group.removeCallback && typeof(this._layers[layer].group.removeCallback) == 'function') {
                            this._layers[layer].group.removeCallback();
                        }
                        delete this._layers[layer];
                    }
                }
                delete this._groupList[group];
                this._update();
                break;
            }
        }
        this.removableGroupsNum--;
        this._map.fire('groupRemoved', group_Name);
    },

    removeAllGroups: function(del) {
        for (group in this._groupList) {
            for (layer in this._layers) {
                if (this._layers[layer].group && this._layers[layer].group.removable) {
                    if (del) {
                        this._map.removeLayer(this._layers[layer].layer);
                    }
                    delete this._layers[layer];
                    this.removableGroupsNum--;
                }
            }
            delete this._groupList[group];
        }
        this._update();
        this._map.fire('groupRemoved');
    },

    selectLayer: function(layer) {
        this._map.addLayer(layer);
        this._update();
    },

    unSelectLayer: function(layer) {
        this._map.removeLayer(layer);
        this._update();
    },

    selectGroup: function(group_Name) {
        this.changeGroup(group_Name, true)
    },

    unSelectGroup: function(group_Name) {
        this.changeGroup(group_Name, false)
    },

    changeGroup: function(group_Name, select) {
        for (group in this._groupList) {
            if (this._groupList[group].groupName == group_Name) {
                for (layer in this._layers) {
                    if (this._layers[layer].group && this._layers[layer].group.name == group_Name) {
                        if (select) {
                            this._map.addLayer(this._layers[layer].layer);
                        } else {
                            this._map.removeLayer(this._layers[layer].layer);
                        }
                    }
                }
                break;
            }
        }
        this._update();
    },


    _initCustomLayout: function() {
        var className = 'leaflet-control-layers',
            container = this._container = L.DomUtil.create('div', className);

        //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
        container.setAttribute('aria-haspopup', true);

        if (!L.Browser.touch) {
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'wheel', L.DomEvent.stopPropagation);
        } else {
            L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
        }

        // Buttons container
        if (this.options.buttons.length) {
            this._buttonsContainer = L.DomUtil.create('div', className + '-buttons', container);
        }

        // Layers container
        var section = document.createElement('section');
        section.className = 'ac-container ' + className + '-list';

        var form = this._form = L.DomUtil.create('form', '');

        section.appendChild(form);

        if (this.options.collapsed) {
            if (!L.Browser.android) {
                L.DomEvent
                    .on(container, 'mouseover', this._expand, this)
                    .on(container, 'mouseout', this._collapse, this);
            }
            var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
            link.href = '#';
            link.title = 'Layers';

            if (L.Browser.touch) {
                L.DomEvent
                    .on(link, 'click', L.DomEvent.stop)
                    .on(link, 'click', this._expand, this);
            } else {
                L.DomEvent.on(link, 'focus', this._expand, this);
            }

            this._map.on('click', this._collapse, this);
            // TODO keyboard accessibility

        } else {
            this._expand();
        }

        this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
        this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

        container.appendChild(section);

        // process options of ac-container css class - to options.container_width and options.container_maxHeight
        for (var c = 0; c < (containers = container.getElementsByClassName('ac-container')).length; c++) {
            if (this.options.container_width) {
                containers[c].style.width = this.options.container_width;
            }

            // set the max-height of control to y value of map object
            this._default_maxHeight = this.options.container_maxHeight ? this.options.container_maxHeight : (this._map.getSize().y - 70);
            containers[c].style.maxHeight = this._default_maxHeight;

        }

        window.onresize = this._on_resize_window.bind(this);

    },

    _on_resize_window: function() {
        // listen to resize of screen to reajust de maxHeight of container
        for (var c = 0; c < containers.length; c++) {
            // input the new value to height
            containers[c].style.maxHeight = (window.innerHeight - 90) < this._removePxToInt(this._default_maxHeight) ? (window.innerHeight - 90) + "px" : this._removePxToInt(this._default_maxHeight) + "px";
        }
    },

    // remove the px from a css value and convert to a int
    _removePxToInt: function(value) {
        if (typeof value === 'string') {
            return parseInt(value.replace("px", ""));
        }
        return value;
    },

    _addLayer: function(layer, name, group, overlay) {
        var id = L.Util.stamp(layer);

        this._layers[id] = {
            layer: layer,
            name: name,
            overlay: overlay
        };

        if (group) {
            var groupId = this._groupList.indexOf(group);

            // if not find the group search for the name
            if (groupId === -1) {
                for (g in this._groupList) {
                    if (this._groupList[g].groupName == group.groupName) {
                        groupId = g;
                        break;
                    }
                }
            }

            if (groupId === -1) {
                groupId = this._groupList.push(group) - 1;
            }

            this._layers[id].group = {
                name: group.groupName,
                id: groupId,
                expanded: group.expanded,
                removable: group.removable,
                togglable: group.togglable,
                buttons: group.buttons
            };

            if (group.removable) {
                this.removableGroupsNum++;
                this._map.fire('groupAdded');
            }
        }

        if (this.options.autoZIndex && layer.setZIndex) {
            this._lastZIndex++;
            layer.setZIndex(this._lastZIndex);
        }
    },

    _update: function() {
        if (!this._container) {
            return;
        }

        this._baseLayersList.innerHTML = '';
        this._overlaysList.innerHTML = '';

        this._domGroups.length = 0;

        this._layerControlInputs = [];

        var baseLayersPresent = false,
            overlaysPresent = false,
            i,
            obj;

        for (i in this._layers) {
            obj = this._layers[i];
            this._addItem(obj);
            overlaysPresent = overlaysPresent || obj.overlay;
            baseLayersPresent = baseLayersPresent || !obj.overlay;
        }

        if (this.options.autoScroll) {
            var section = this._container.getElementsByTagName('section')[0]
            section.scrollTop = section.scrollHeight
        }

    },

    _onLayerChange: function(e) {
        var obj = this._layers[L.Util.stamp(e.layer)];

        if (!obj) {
            return;
        }

        if (!this._handlingClick) {
            this._update();
        }

        var type = obj.overlay ?
            (e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
            (e.type === 'layeradd' ? 'baselayerchange' : null);

        this._checkIfDisabled();

        if (type) {
            this._map.fire(type, obj);
        }
    },

    _onZoomEnd: function(e) {
        this._checkIfDisabled();
    },

    _checkIfDisabled: function(layers) {
        var currentZoom = this._map.getZoom();

        for (layerId in this._layers) {
            if (this._layers[layerId].layer.options && (this._layers[layerId].layer.options.minZoom || this._layers[layerId].layer.options.maxZoom)) {
                var el = document.getElementById('ac_layer_input_' + this._layers[layerId].layer._leaflet_id);
                if (currentZoom < this._layers[layerId].layer.options.minZoom || currentZoom > this._layers[layerId].layer.options.maxZoom) {
                    el.disabled = 'disabled';
                } else {
                    el.disabled = '';
                }
            }
        }
    },

    // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
    _createRadioElement: function(name, checked) {

        var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
        if (checked) {
            radioHtml += ' checked="checked"';
        }
        radioHtml += '/>';

        var radioFragment = document.createElement('div');
        radioFragment.innerHTML = radioHtml;

        return radioFragment.firstChild;
    },

    _addItem: function(obj) {
        var label = document.createElement('div'),
            input,
            checked = this._map.hasLayer(obj.layer),
            id = 'ac_layer_input_' + obj.layer._leaflet_id,
            container,
            self = this;

        if (obj.overlay) {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'leaflet-control-layers-selector';
            input.defaultChecked = checked;
            label.className = "menu-item-checkbox";
            input.id = id;
        } else {
            input = this._createRadioElement('leaflet-base-layers', checked);
            label.className = "menu-item-radio";
            input.id = id;
        }

        this._layerControlInputs.push(input);
        input.layerId = L.Util.stamp(obj.layer);

        L.DomEvent.on(input, 'click', this._onInputClick, this);

        var name = document.createElement('label');
        name.innerHTML = '<label for="' + id + '">' + obj.name + '</label>';

        label.appendChild(input);
        label.appendChild(name);

        if (obj.layer.StyledLayerControl) {

            // configure the delete button for layers with attribute removable = true
            if (obj.layer.StyledLayerControl.removable) {
                var bt_delete = document.createElement("input");
                bt_delete.type = "button";
                bt_delete.className = "bt_delete";
                L.DomEvent.on(bt_delete, 'click', this._onDeleteClick, this);
                label.appendChild(bt_delete);
            }

            // configure the visible attribute to layer
            if (obj.layer.StyledLayerControl.visible) {
                this._map.addLayer(obj.layer);
            }

        }

        if (obj.overlay) {
            container = this._overlaysList;
        } else {
            container = this._baseLayersList;
        }

        var groupContainer = this._domGroups[obj.group.id];

        if (!groupContainer) {

            groupContainer = document.createElement('div');
            groupContainer.id = 'leaflet-control-accordion-layers-' + obj.group.id;

            // verify if group is expanded
            var s_expanded = obj.group.expanded ? ' checked = "true" ' : '';

            // verify if type is exclusive
            var s_type_exclusive = this.options.exclusive ? ' type="radio" ' : ' type="checkbox" ';

            // verify if group is removable
            if (obj.group.removable) {
                groupContainer.className += 'removable';
            }

            inputElement = '<input id="ac' + obj.group.id + '" class="menu" ' + s_expanded + s_type_exclusive + '/>';
            inputLabel = '<label class="section-label" for="ac' + obj.group.id + '">' + obj.group.name + '</label>';

            article = document.createElement('article');
            article.className = 'ac-large';

            // process options of ac-large css class - to options.group_maxHeight property
            if (this.options.group_maxHeight) {
                article.style.maxHeight = this.options.group_maxHeight;
            }

            // Group label
            groupContainer.innerHTML = inputElement + inputLabel;

            // Buttons 
            if (obj.overlay && obj.group.buttons && obj.group.buttons.length) {

                var bn = 0;
                // Buttons container
                var buttonsContainer = L.DomUtil.create('div', 'group-buttons-container', groupContainer);

                // Link delete group
                obj.group.buttons.forEach(function(btn) {
                    var cont = L.DomUtil.create('div', 'cb-group-button-container', buttonsContainer);
                    var link = L.DomUtil.create('a', 'cb-button-container-icon '+btn.class, cont);
                    link.href = '#';
                    link.title = btn.label;

                    link.setAttribute("data-group-name", obj.group.name);

                    var btnEvent;

                    if (L.Browser.touch) {
                        btnEvent = L.DomEvent.on(link, 'click', L.DomEvent.stop)
                    } else {
                        btnEvent = L.DomEvent.on(link, 'click', L.DomEvent.stop)
                    }

                    if (btn.trigger) {
                        switch (btn.trigger) {
                            case 'removeGroup':
                                btnEvent = L.DomEvent.on(link, 'click', self._onRemoveGroup, self);
                                break;
                        }
                    }

                    if (btn.callback) {
                        btnEvent.on(link, 'click', btn.callback, this);
                    }

                    // Separator
                    if (bn < obj.group.buttons.length - 1 && btn.separator) {
                        var separator = L.DomUtil.create('span', 'group-toggle-divider', buttonsContainer);
                        separator.innerHTML = ' / ';
                    }
                    bn++;
                });
            }

            groupContainer.appendChild(article);

            // Link to toggle all layers
            if (obj.overlay && obj.group.togglable && this.options.group_toggler.show) {

                // Toggler container
                var togglerContainer = L.DomUtil.create('div', 'group-toggle-container gtc' + obj.group.id);

                // Link All
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'leaflet-toggler-checkbox';
                checkbox.id = 'checkboxAll' + obj.group.id;

                //L.DomEvent.on(togglerContainer, 'click', this._onToggleGroup, this);
                var self = this;
                checkbox.addEventListener("click", function() {
                    self._onToggleGroup(this, obj.group.name)
                }, false);

                togglerContainer.appendChild(checkbox);

                checkboxLabel = document.createElement('label');
                checkboxLabel.innerHTML = this.options.group_toggler.label;
                checkboxLabel.setAttribute('for', 'checkboxAll' + obj.group.id)
                togglerContainer.appendChild(checkboxLabel);

                article.appendChild(togglerContainer);
            }

            // Add the layer
            article.appendChild(label);

            container.appendChild(groupContainer);

            this._domGroups[obj.group.id] = groupContainer;
        } else {
            groupContainer.getElementsByTagName('article')[0].appendChild(label);
        }

        this._checkTogglerCheckbox(obj);

        return label;
    },

    _checkTogglerCheckbox: function(obj) {
        var el = this._domGroups[obj.group.id].querySelector('.leaflet-toggler-checkbox');
        if (!el) return;
        el.checked = true;
        for (var index in this._layers) {
            if (this._layers.hasOwnProperty(index)) {
                if (this._layers[index].group.togglable && this._layers[index].group.name == obj.group.name) {
                    if (!this._map.hasLayer(this._layers[index].layer)) {
                        el.checked = false;
                    }
                }
            }
        }
        var articleEl = this._domGroups[obj.group.id].getElementsByTagName('article')[0];
        if (articleEl.children.length <= 2) {
            this._domGroups[obj.group.id].querySelector('.group-toggle-container.gtc' + obj.group.id).style.display = 'none';
        } else {
            this._domGroups[obj.group.id].querySelector('.group-toggle-container.gtc' + obj.group.id).style.display = 'block';
        }
    },

    _groupHasAllLayersVisible: function(group_Name) {
        for (group in this._groupList) {
            if (this._groupList[group].groupName == group_Name) {
                for (layer in this._layers) {
                    if (this._layers[layer].group && this._layers[layer].group.name == group_Name) {
                        if (!this._map.hasLayer(this._layers[layer])) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    },

    _onInputClick: function() {
        var i,
            input,
            obj,
            inputs = this._form.getElementsByTagName('input'),
            inputsLen = inputs.length;

        this._handlingClick = true;

        for (i = 0; i < inputsLen; i++) {
            input = inputs[i];
            obj = this._layers[input.layerId];

            if (!obj) {
                continue;
            }

            if (input.checked && !this._map.hasLayer(obj.layer)) {
                this._map.addLayer(obj.layer);
                this._checkTogglerCheckbox(obj);
            } else if (!input.checked && this._map.hasLayer(obj.layer)) {
                this._map.removeLayer(obj.layer);
                this._checkTogglerCheckbox(obj);
            }
        }


        this._handlingClick = false;
    },

    _onDeleteClick: function(obj) {
        var node = obj.target.parentElement.childNodes[0];
        n_obj = this._layers[node.layerId];

        // verify if obj is a basemap and checked to not remove
        if (!n_obj.overlay && node.checked) {
            return false;
        }

        if (this._map.hasLayer(n_obj.layer)) {
            this._map.removeLayer(n_obj.layer);
        }

        obj.target.parentNode.remove();

        return false;
    },

    _onToggleGroup: function(e, groupName) {
        if (e.checked) {
            this.selectGroup(groupName);
        } else {
            this.unSelectGroup(groupName);
        }
    },

    _onSelectGroup: function(e) {
        this.selectGroup(e.target.getAttribute("data-group-name"));
    },

    _onUnSelectGroup: function(e) {
        this.unSelectGroup(e.target.getAttribute("data-group-name"));
    },

    _onRemoveGroup: function(e) {
        this.removeGroup(e.target.getAttribute("data-group-name"), true);
    },

    _expand: function() {
        L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
    },

    _collapse: function() {
        this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
    },

    _addButton: function(button) {

        var self = this;

        var className = 'cb-button-container';

        button.element = L.DomUtil.create('div', className + (button.enabled ? ' enabled' : ''), this._buttonsContainer);
        var icon = L.DomUtil.create('a', 'cb-button-container-icon '+button.class, button.element);
        icon.title = button.label;

        L.DomEvent
            .addListener(icon, 'click', L.DomEvent.stop)
            .addListener(icon, 'click', function() {
                if (button.togglable) {
                    button.element.className = (button.element.className.indexOf('enabled') == -1) ? className + ' enabled' : className;
                }
                button.callback(button, this);
            });

        if (typeof(button.events) == 'object') {
            for (var eventName in button.events) {
                if (!button.events.hasOwnProperty(eventName)) continue;
                this._map.on(eventName, function() {
                    button.events[eventName](button, self);
                })
            }
        }

        this._buttonList[button.name] = button;

    }
});

L.Control.styledLayerControl = function(baseLayers, overlays, options) {
    return new L.Control.StyledLayerControl(baseLayers, overlays, options);
};
