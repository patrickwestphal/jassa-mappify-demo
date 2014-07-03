'use strict';

angular
  .module('ui.jassa.openlayers.jassa-map-ol-styleable-app', ['ui.bootstrap', 'ui.jassa.openlayers', 'ui.jassa.openlayers.jassa-map-ol-styleable'])
  //
  .controller('MainCtrl', function ($scope) {

    $scope.config = {
        center: { lon: 12.35, lat: 51.35 },
        zoom: 15
    };
    var sparqlService = new Jassa.service.SparqlServiceHttp('http://localhost/sparql', ['http://linkedgeodata.org/']);
//    var sparqlService = new Jassa.service.SparqlServiceHttp('http://localhost/sparql', ['http://dbpedia.org']);
    sparqlService = new Jassa.service.SparqlServiceCache(sparqlService);
    sparqlService = new Jassa.service.SparqlServicePaginate(sparqlService, 1000);

    $scope.dataSources = [{
      sparqlService: sparqlService,
      mapFactory: Jassa.geo.GeoMapFactoryUtils.wgs84MapFactory,
//      mapFactory: Jassa.geo.GeoMapFactoryUtils.createWktMapFactory('http://www.w3.org/2003/01/geo/wgs84_pos#geometry', 'bif:st_intersects', 'bif:st_geomFromText'),
      conceptFactory: new Jassa.facete.ConceptFactoryConst(
          Jassa.facete.ConceptUtils.createSubjectConcept(Jassa.rdf.NodeFactory.createVar('s'))),
      quadTreeConfig: {
          maxItemsPerTileCount: 1000,
          maxGlobalItemCount: 100
      }
    }];

    $scope.selectGeom = function(data) {
      alert(JSON.stringify(data));
    };
});