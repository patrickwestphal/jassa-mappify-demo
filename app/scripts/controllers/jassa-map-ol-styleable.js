'use strict';

Jassa.setOlMapCenter = function(map, config) {
  var zoom = config.zoom;

  var center = config.center;
  var olCenter = null;
  if(center && center.lon != null && center.lat != null) {
    var lonlat = new OpenLayers.LonLat(center.lon, center.lat);
    olCenter = lonlat.clone().transform(map.displayProjection, map.projection);
  }

  if(olCenter != null) {
    map.setCenter(olCenter, zoom);
  } else if(zoom != null) {
    // FIXME: setZoom not defined
    map.setZoom(zoom);
  }
};

angular.module('ui.jassa.openlayers.jassa-map-ol-styleable', ['ui.jassa.openlayers.jassa-map-ol-styleable-config'])
  .controller('JassaMapOlStyleableCtrl', function($scope, mapConfigService) {
    $scope.mapConfig = mapConfigService;
    $scope.btnsConf = {
      top: '0px',
      left: '0px',
      height: '100px',
      width: '23em'
    };
    $scope.controlsConf = {
      top: '110px',
      left: '0px',
      height: 'calc(100% - 110px)',
      width: '23em'
    };

    // <stuffCopiedFromJassaMapOl>
    var refresh;

    var defaultViewStateFetcher = new Jassa.geo.ViewStateFetcher();
    $scope.ObjectUtils = Jassa.util.ObjectUtils;

    $scope.$watch('config', function(config, oldConfig) {
      if(!_(config).isEqual(oldConfig)) {
        Jassa.setOlMapCenter($scope.map, config);
      }
    }, true);

    var watchList = '[map.center, map.zoom, ObjectUtils.hashCode(sources)]';

    $scope.$watch(watchList, function() {
      refresh();
    }, true);

    refresh = function() {
      var mapWrapper = $scope.map.widget;
      mapWrapper.clearItems();
      var dataSources = $scope.sources;

      // FIXME: use fixed bounds of maxMapSection as bounds if this section is smaller than
      // Jassa.geo.openlayers.MapUtils.getExtent($scope.map)
      var bounds = Jassa.geo.openlayers.MapUtils.getExtent($scope.map);
      _(dataSources).each(function(dataSource){
        var viewStateFetcher = dataSource.viewStateFetcher || defaultViewStateFetcher;
        var sparqlService = dataSource.sparqlService;
        var mapFactory = dataSource.mapFactory;
        var conceptFactory = dataSource.conceptFactory;
        var concept = conceptFactory.createConcept();

        // TODO: do I need this?
        var quadTreeConfig = dataSource.quadTreeConfig;
        var promise = viewStateFetcher.fetchViewState(sparqlService, mapFactory, concept, bounds, quadTreeConfig);

        promise.done(function(viewState) {
          var nodes = viewState.getNodes();
          _(nodes).each(function(node) {
            if (!node.isLoaded) {
              mapWrapper.addBox('' + node.getBounds(), node.getBounds());
            }
            var data = node.data || {};
            var docs = data.docs || [];

            _(docs).each(function(doc) {
              var itemData = {
                id: doc.id,
                config: dataSource  // TODO: Make the dataSource object part of the marker's data
              };

              var wkt = doc.wkt.getLiteralLexicalForm();
              mapWrapper.addWkt(doc.id, wkt, itemData);  // // {fillColor: markerFillColor, strokeColor: markerStrokeColor});
            });
          });
        });
      });
    };
    // </stuffCopiedFromJassaMapOl>
  })
  .directive('jassaMapOlStyleable', function($parse) {
    return {
      restrict: 'EA',
      templateUrl: 'views/controls.html',
      controller: 'JassaMapOlStyleableCtrl',
      scope: {
        config: '=',
        sources: '=',
        onSelect: '&select',
        onUnselect: '&unselect'
      },
      link: function (scope, element, attrs) {
        var $el = jQuery(element).ssbMap();
        var widget = $el.data('custom-ssbMap');

        var map = widget.map;
        map.widget = widget;

        scope.map = map;

        Jassa.setOlMapCenter(scope.map, scope.config);

        var syncModel = function(event) {
          var tmp = scope.map.getCenter();
          var center = tmp.transform(scope.map.projection, scope.map.displayProjection);

          scope.config.center = {lon: center.lon, lat: center.lat};
          scope.config.zoom = scope.map.getZoom();

          if(!scope.$root.$$phase) {
            scope.$apply();
          }
        };

        $el.on('ssbmapfeatureselect', function(ev, data) {
          scope.onSelect({data: data});
        });

        $el.on('ssbmapfeatureunselect', function(ev, data) {
          scope.onUnselect({data: data});
        });

        map.events.register('moveend', this, syncModel);
        map.events.register('zoomend', this, syncModel);
      }
    };
  });
