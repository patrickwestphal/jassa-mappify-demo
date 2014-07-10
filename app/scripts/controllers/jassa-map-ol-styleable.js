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

angular.module('ui.jassa.openlayers.jassa-map-ol-styleable', ['ui.bootstrap', 'ngGrid', 'ui.jassa', 'ui.slimscroll'])
  .controller('JassaMapOlStyleableCtrl', function($scope, controlsService, conceptConfigsService, mapConfigService) {
    $scope.conceptConfigs = conceptConfigsService;
    $scope.mapConfig = mapConfigService;
    $scope.controls = controlsService;

    // wire layers and buttons to set up initial and maximum map sections
    $scope.$on('jassa-map-created', function(event) {
      event.stopPropagation();

      $scope.map.addLayer($scope.controls.initBoxLayer);
      $scope.map.addLayer($scope.controls.maxBoxLayer);

      $scope.map.addControl($scope.controls.initBoxDrawControl);
      $scope.map.addControl($scope.controls.maxBoxDrawControl);
    });

    $scope.facetTreeConfig = new Jassa.facete.FacetTreeConfig();
    $scope.path = null;
    $scope.selectFacet = function(path) {
      //alert('Selected Path: [' + path + ']');
      $scope.path = path;
    };

    /*
     * mappify concepts stuff
     */
    $scope.conceptCounter = 1;
    $scope.selectedConcept = null;
    $scope.mappifyConcepts = [];

    var conceptWillChangeHandler = function(futureSelection) {
      var entity = futureSelection.entity;
      // TODO: do something meaningful here
    };
    $scope.controls.registerConceptSelectionWillChangeHandler(conceptWillChangeHandler);

    var conceptChangedHandler = function(selection) {
      var entity = selection.entity;
      $scope.selectedConcept = entity;
    };
    $scope.controls.registerConceptSelectionChangedHandler(conceptChangedHandler);

    $scope.deleteConcept = function() {
      var idx = $scope.mappifyConcepts.indexOf($scope.selectedConcept);
      $scope.selectedConcept = null;
      $scope.mappifyConcepts.splice(idx, 1);
    };

    $scope.createConcept = function() {
      $scope.mappifyConcepts.push({
        name: 'Concept ' + $scope.conceptCounter++,
      });
    };

    // <stuffCopiedFromJassaMapOl> ###################################################################################
//    var refresh;
//
//    var defaultViewStateFetcher = new Jassa.geo.ViewStateFetcher();
//    $scope.ObjectUtils = Jassa.util.ObjectUtils;
//
//    $scope.$watch('config', function(config, oldConfig) {
//      if(!_(config).isEqual(oldConfig)) {
//        Jassa.setOlMapCenter($scope.map, config);
//      }
//    }, true);
//
//    var watchList = '[map.center, map.zoom, ObjectUtils.hashCode(sources)]';
//
//    $scope.$watch(watchList, function() {
//      refresh();
//    }, true);
//
//    refresh = function() {
//      var mapWrapper = $scope.map.widget;
//      mapWrapper.clearItems();
//      var dataSources = $scope.sources;
//
//      // FIXME: use fixed bounds of maxMapSection as bounds if this section is smaller than
//      // Jassa.geo.openlayers.MapUtils.getExtent($scope.map)
//      var bounds = Jassa.geo.openlayers.MapUtils.getExtent($scope.map);
//      _(dataSources).each(function(dataSource){
//        var viewStateFetcher = dataSource.viewStateFetcher || defaultViewStateFetcher;
//        var sparqlService = dataSource.sparqlService;
//        var mapFactory = dataSource.mapFactory;
//        var conceptFactory = dataSource.conceptFactory;
//        var concept = conceptFactory.createConcept();
//
//        // TODO: do I need this?
//        var quadTreeConfig = dataSource.quadTreeConfig;
//        var promise = viewStateFetcher.fetchViewState(sparqlService, mapFactory, concept, bounds, quadTreeConfig);
//
//        promise.done(function(viewState) {
//          var nodes = viewState.getNodes();
//          _(nodes).each(function(node) {
//            if (!node.isLoaded) {
//              mapWrapper.addBox('' + node.getBounds(), node.getBounds());
//            }
//            var data = node.data || {};
//            var docs = data.docs || [];
//
//            _(docs).each(function(doc) {
//              var itemData = {
//                id: doc.id,
//                config: dataSource  // TODO: Make the dataSource object part of the marker's data
//              };
//
//              var wkt = doc.wkt.getLiteralLexicalForm();
//              mapWrapper.addWkt(doc.id, wkt, itemData);  // // {fillColor: markerFillColor, strokeColor: markerStrokeColor});
//            });
//          });
//        });
//      });
//    };
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
        onSelect: '&select'
//        onUnselect: '&unselect'
      },
      link: function (scope, element, attrs) {
        var $el = jQuery(element).ssbMap();
        var widget = $el.data('custom-ssbMap');

        var map = widget.map;
        map.widget = widget;

        scope.map = map;
        if (scope.sources.length > 0) {
          scope.sparqlService = scope.sources[0].sparqlService;
        } else {
          scope.sparqlService = null;
        }

        Jassa.setOlMapCenter(scope.map, scope.config);
        scope.$emit('jassa-map-created');

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
