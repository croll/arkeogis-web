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


L.Control.Queries = L.Control.Layers.extend({});
