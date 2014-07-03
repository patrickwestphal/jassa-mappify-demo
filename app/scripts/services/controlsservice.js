'use strict';

angular.module('ui.jassa.openlayers.jassa-map-ol-styleable-config', [])
  .service('controlsService', function(){
    this.btnsLayout = {
      top: '0px',
      left: '0px',
      height: '100px',
      width: '23em'
    };
    this.layout = {
      top: '110px',
      left: '0px',
      height: 'calc(100% - 110px)',
      width: '23em'
    };
  });