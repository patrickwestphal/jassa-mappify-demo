'use strict';

angular.module('ui.jassa.openlayers.jassa-map-ol-styleable-config', [])
  .service('controlsService', function() {
    this.layout = {
      top: '110px',
      left: '0px',
      height: 'calc(100% - 110px)',
      width: '23em'
    };

    this.btnsLayout = {
      top: '0px',
      left: '0px',
      height: '100px',
      width: '23em'
    };
    this.maxBtn = {
      id: 'max',
      layer: null
    };
    this.initBtn = {
      id: 'init',
      layer: null
    };

    this.activeBtn = null;
    this.toggleBtn = function(btnName) {
      if (this.activeBtn == btnName) {
        this.activeBtn = null;
      } else {
        this.activeBtn = btnName;
      }
    };
  });