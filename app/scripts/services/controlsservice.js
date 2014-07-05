'use strict';

angular.module('ui.jassa.openlayers.jassa-map-ol-styleable-config', [])
  .service('controlsService', function() {

    /*
     * general layout stuff for controls
     */
    this.layout = {
      top: '110px',
      left: '0px',
      height: 'calc(100% - 110px)',
      width: '23em'
    };

    /*
     * buttons for the initial and maximal bounding box of the map
     */
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

    /*
     * event handling and de-/activating of controls for bounbding box drawing
     */
    var mappifyCntrls = this;
    var toggleInitBoxDraw = function() {
      if (mappifyCntrls.activeBtn == mappifyCntrls.initBtn.id) {
        mappifyCntrls.activeBtn = null;
        mappifyCntrls.initBoxDrawControl.deactivate();
      } else {
        mappifyCntrls.activeBtn = mappifyCntrls.initBtn.id;
        mappifyCntrls.maxBoxDrawControl.deactivate();
        mappifyCntrls.initBoxDrawControl.activate();
      }
      if(!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    };

    var toggleMaxBoxDraw = function() {
      if (mappifyCntrls.activeBtn == mappifyCntrls.maxBtn.id) {
        mappifyCntrls.activeBtn = null;
        mappifyCntrls.maxBoxDrawControl.deactivate();
      } else {
        mappifyCntrls.activeBtn = mappifyCntrls.maxBtn.id;
        mappifyCntrls.initBoxDrawControl.deactivate();
        mappifyCntrls.maxBoxDrawControl.activate();
      }
      if(!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    };

    this.toggleBtn = function(btnName) {
      if (btnName == this.initBtn.id) {
        toggleInitBoxDraw();
      } else {
        toggleMaxBoxDraw();
      }
    };

    // event listener to prevent the drawing of multiple rectangles
    var featureRemover = function(event) {
      event.object.removeAllFeatures();
    };

    /*
     * initial bounding box layer
     */
    this.initBoxLayer = new OpenLayers.Layer.Vector('initial box', {
      styleMap: new OpenLayers.StyleMap({
        fillColor: '#00FF00', fillOpacity: 0.2 })
    });
    this.initBoxLayer.events.register('beforefeatureadded', this.initBoxLayer, featureRemover);

    /*
     * maximal bounding box layer
     */
    this.maxBoxLayer = new OpenLayers.Layer.Vector('maximal box', {
      styleMap: new OpenLayers.StyleMap({
        fillColor: '#FF0000', fillOpacity: 0.15 })
    });
    this.maxBoxLayer.events.register('beforefeatureadded', this.maxBoxLayer, featureRemover);

    /*
     * Open Layers control to draw the initial bounding box
     */
    this.initBoxDrawControl = new OpenLayers.Control.DrawFeature(this.initBoxLayer,
      OpenLayers.Handler.RegularPolygon,
      { handlerOptions: { sides: 4, irregular: true } }
    );
    this.initBoxLayer.events.register('featureadded', this.initBoxLayer, toggleInitBoxDraw);

    /*
     * Open Layers control to draw the maximal bounding box
     */
    this.maxBoxDrawControl = new OpenLayers.Control.DrawFeature(this.maxBoxLayer,
      OpenLayers.Handler.RegularPolygon,
      { handlerOptions: { sides: 4, irregular: true } }
    );
    this.maxBoxLayer.events.register('featureadded', this.maxBoxLayer, toggleMaxBoxDraw);

    // event listener to get the current values of the box coords
    var coordListener = function(event) {
      var geometry = event.feature.geometry;
      if (event.object.name === 'initial box') {
        mappifyCntrls.initBtn.coords = geometry;
      } else if (event.object.name === 'maximal box') {
        mappifyCntrls.maxBtn.coords = geometry;
      }
    };
    this.initBoxLayer.events.register('featureadded', this.initBoxLayer, coordListener);
    this.maxBoxLayer.events.register('featureadded', this.maxBoxLayer, coordListener);
  });