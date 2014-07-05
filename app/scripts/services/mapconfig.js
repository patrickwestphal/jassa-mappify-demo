'use strict';

angular
  .module('ui.jassa.openlayers.jassa-map-ol-styleable')
  .service('mapConfigService', function() {
    this.initialArea = {
      active: false,
      coords: null
    };
    this.maxArea = {
      active: false,
      coords: null
    };
  });