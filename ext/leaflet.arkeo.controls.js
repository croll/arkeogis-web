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
