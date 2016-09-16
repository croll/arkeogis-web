L.Control.ClusterRadius = L.Control.extend({

    options: {
        position: 'topright',
        minRadius: 20,
        maxRadius: 120,
        callback: function() {}
    },

    onAdd: function (map) {
        var self = this;
        this._currentRadius = this.options.maxRadius;
        var mainContainer = L.DomUtil.create('div', 'leaflet-control-cluster-radius-container');
         L.DomEvent
            .addListener(mainContainer, 'click', L.DomEvent.stopPropagation)
            .addListener(mainContainer, 'click', L.DomEvent.preventDefault)
            .addListener(mainContainer, 'click', function() {
                self._currentRadius = (self._currentRadius == self.options.minRadius) ? self.options.maxRadius : self.options.minRadius;
                self.options.callback();
                self._updateIcon();
            });

        this.controlUI = L.DomUtil.create('div', 'leaflet-control-cluster-radius', mainContainer);
        this._updateIcon()
        return mainContainer;
    },

    getCurrentRadius: function() {
        return this._currentRadius;
    },

    _updateIcon: function() {
        this.controlUI.innerHTML = '['+this._currentRadius+']';
    }
});


L.Control.LayerDynamic = L.Control.Layers.extend({
    onAdd: function(map) {
        this._map = map;
        map.on('zoomend', this._update, this);
        return L.Control.Layers.prototype.onAdd.call(this, map);
    },

    onRemove: function(map) {
        map.off('zoomend', this._update, this);
        L.Control.Layers.prototype.onRemove.call(this, map);
    },

    _addItem: function(obj){
        var item = L.Control.Layers.prototype._addItem.call(this, obj);

        var currentZoom = this._map.getZoom();

        if (_.has(obj.layer.options, 'minZoom')) {
            if (currentZoom < obj.layer.options.minZoom) {
                $(item).find('input').prop('disabled', true);
            }
        }

        if (_.has(obj.layer.options, 'maxZoom')) {
            if (currentZoom > obj.layer.options.maxZoom) {
                $(item).find('input').prop('disabled', true);
            }
        }

        return item;
    }
})


L.Control.Queries = L.Control.Layers.extend({

    options: {
      letter: '',
      title: 'Query'
    },

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {
			L.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle queries', container);
			link.href = '#';
			link.title = 'Layers';
            link.innerHTML = '<span class="letter">'+this.options.letter+'</a>';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
		} else {
			this._expand();
		}

        var titleContainer = L.DomUtil.create('div', 'className' + '-base', form);
        titleContainer.innerHTML = "<a style='padding: 3px'>"+this.options.title+"</a>";
        L.DomEvent
            .addListener(titleContainer, 'click', L.DomEvent.stopPropagation)
            .addListener(titleContainer, 'click', L.DomEvent.preventDefault)
            .addListener(titleContainer, 'click', function() {
                    $(this).parent().find('input[type=checkbox]').each(function() {
                        $(this).click();
                    });
                });

		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

});
