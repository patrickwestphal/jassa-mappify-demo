'use strict';

angular
  .module('ui.jassa.openlayers.jassa-map-ol-styleable-config')
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