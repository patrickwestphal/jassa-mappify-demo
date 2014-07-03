/**
 * Copyright (C) 2011, MOLE research group at AKSW,
 * University of Leipzig
 *
 * SpatialSemanticBrowsingWidgets is free software; you can redistribute
 * it and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * SpatialSemanticBrowsingWidgets is distributed in the hope that it will
 * be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
(function($) {
  $.widget('custom.ssbMap', {
    _create: function() {
      var self = this;

      this.wktParser = new OpenLayers.Format.WKT();

      var opts = this.options;
      this.idToBox = {};
      this.domElement = this.element.get(0);
      this.options.zoomLabel = 'Click to\nzoom in\non the\ndata';

      this.idToFeature = {}; //this.options.idToFeature;

      var panZoomBar = new OpenLayers.Control.PanZoomBar(null);
      panZoomBar = OpenLayers.Util.extend(panZoomBar, {
        draw: function(px) {
          // FIXME: fixed zoom bar position
          OpenLayers.Control.PanZoomBar.prototype.draw.apply(this, [new  OpenLayers.Pixel(250, 0)]);
          return this.div;
        }
      });

      var options = {
        projection: new OpenLayers.Projection('EPSG:900913'),
        displayProjection: new OpenLayers.Projection('EPSG:4326'),
        units: 'm',
        controls: [
          new OpenLayers.Control.Navigation(),
  //        new OpenLayers.Control.LayerSwitcher(),
          panZoomBar,
          new OpenLayers.Control.MousePosition(),
  //        new OpenLayers.Control.OverviewMap(),
  //        new OpenLayers.Control.PanZoomBar(),
          new OpenLayers.Control.ScaleLine(),
          new OpenLayers.Control.Attribution()
        ]
      };

      // TODO: fire event afterwards
      this.map = new OpenLayers.Map(this.domElement, options);

      /*
       * Renderer init (needed for outlines of labels)
       */

      var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
      renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

      /*
       * Style definitions
       */
      var defaultStyle = OpenLayers.Feature.Vector.style['default'];
      this.styles = {};
      this.styles.hoverStyle = OpenLayers.Util.extend(
        OpenLayers.Util.extend({}, defaultStyle), {
          fillColor: '#8080ff',
          fillOpacity: 0.4,
          stroke: true,
          strokeLinecap: 'round',
          strokeWidth: 1,
          strokeColor: '#5050a0',
          pointRadius: 12,
          label: self.options.zoomLabel,
          fontColor: '#8080ff', //'#ffffff',
          fontWeight: 'bold'
        }
      );

      this.styles.markerStyle = OpenLayers.Util.extend(
        OpenLayers.Util.extend({}, defaultStyle), {
          graphicOpacity: 0.8, //0.8,
          graphicWidth: 31,
          graphicHeight: 31,
          graphicYOffset: -31,
          graphicXOffset: -16,
          fillColor: '${fillColor}',
          strokeColor: '${strokeColor}',
          fontColor: '#0000FF',
          fontSize: '12px',
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          label: '',
          labelYOffset: 21
        }
      );

      this.styles.boxStyle = OpenLayers.Util.extend(
        OpenLayers.Util.extend({}, defaultStyle), {
          fillColor: '#8080ff',
          fillOpacity: 0.2,
          stroke: true,
          strokeLinecap: 'round',
          strokeWidth: 1,
          strokeColor: '#7070ff',
          pointRadius: 12,
          label: self.options.zoomLabel,
          fontColor: '#8080ff', //'#ffffff',
          fontWeight: 'bold'
        }
      );

      /*
       * Layer creation
       */
      // The layer for the massive instance indicator boxes
      this.boxLayer = new OpenLayers.Layer.Vector('Boxes', {
        projection: new OpenLayers.Projection('EPSG:4326'),
        visibility: true,
        displayInLayerSwitcher: true,
        renderers: renderer
      });

      // The layer for the actual features
      this.featureLayer = new OpenLayers.Layer.Vector('Features', {
        projection: new OpenLayers.Projection('EPSG:4326'),
        visibility: true,
        displayInLayerSwitcher: true,
        styleMap: new OpenLayers.StyleMap({'default': new OpenLayers.Style(this.styles.markerStyle)}),
        renderers: renderer
      });

      // TODO Make it easy to exchange the URL pattern
      var mapnikLayer = new OpenLayers.Layer.OSM(
          'Mapnik',
          'http://a.tile.openstreetmap.org/${z}/${x}/${y}.png',
          {numZoomLevels: 19}
      );

      this.map.addLayers([mapnikLayer, this.boxLayer, this.featureLayer]);


      /*
       * Forward some simple events
       */
      this.map.events.register('moveend', this, function(event) {
          self._trigger('mapevent', event, {'map': self.map});
      });

      this.map.events.register('zoomend', this, function(event) {
          self._trigger('mapevent', event, {'map': self.map});
      });

      // TODO Following example is probably how to do it the proper way:
      // http://openlayers.org/dev/examples/select-feature-multilayer.html

      this.highlightController = new OpenLayers.Control.SelectFeature(this.boxLayer, {
        hover: true,
        highlightOnly: true,
        //renderIntent: 'temporary',
        selectStyle: this.styles.hoverStyle,


        eventListeners: {
          beforefeaturehighlighted: function(event) {
            var feature = event.feature;
            var geometry = feature.geometry;

            if(geometry instanceof OpenLayers.Geometry.Point) {
                // Seems like we can abort the highlight by returning false here.
                // However, a seemingly cleaner solution would be to keep MII-boxes and features in separate layers
                return false;
            }

          }
        }
      });

      this.highlightController.handlers.feature.stopDown = false;
      this.map.addControl(this.highlightController);
      this.highlightController.activate();

      this.selectFeatureController = new OpenLayers.Control.SelectFeature([this.boxLayer, this.featureLayer], {
        onUnselect: function(feature) {
            var data = feature.data;
            var event = null;
            self._trigger('featureUnselect', event, data);
        },

        onSelect: function(feature) {
            var data = feature.data;
            var geometry = feature.geometry;

            // FIXME Find a better way to get the click coordinates; but it might not exists yet,
            // see http://trac.osgeo.org/openlayers/ticket/2089
            var xy = this.handlers.feature.evt.xy;

            if(data.zoomable && geometry instanceof OpenLayers.Geometry.Polygon) {
              /*
               * New method for zooming in onto the click position
               */
              var clickLonLat = self.map.getLonLatFromViewPortPx(xy);
              var currentZoom = self.map.getZoom();
              var nextZoom = currentZoom + 1;
              var numZoomLevels = self.map.getNumZoomLevels();

              if(nextZoom >= numZoomLevels) {
                nextZoom = numZoomLevels - 1;
              }

              self.map.setCenter(clickLonLat, nextZoom);
            }
            else {
              var event = null;
              self._trigger('featureSelect', event, data);
            }
        }
      });

      this.selectFeatureController.handlers.feature.stopDown = false;
      this.map.addControl(this.selectFeatureController);
      this.selectFeatureController.activate();

      // FIXME: fixed coordinates
      var center = new OpenLayers.LonLat(-3.56, 56.07);

      var tCenter = center.clone().transform(this.map.displayProjection, this.map.projection);

      this.map.setCenter(tCenter, 3);
      this.redraw();
    },

    getFeatureLayer: function() {
      return this.featureLayer;
    },

    /**
     * Calls .redraw() on all layers.
     *
     * Motivation: Workaround for an RDFauthor bug, where the map behaves strange after saving a resource.
     */
    redraw: function() {
      this.boxLayer.redraw();
      this.featureLayer.redraw();
    },

    addWkt: function(id, wktStr, attrs, visible) {
      var feature = this.wktParser.read(wktStr);
      feature.geometry.transform(this.map.displayProjection, this.map.projection);
      feature.data = attrs;

      this.idToFeature[id] = feature;
      this.featureLayer.addFeatures([feature]);
    },

    /**
     * Creates a feature for the given id.
     * By default they are not added to the map (i.e. invisible).
     *
     *
     * @param id
     * @param lonlat
     */
    addItem: function(id, lonlat, attrs, visible) {
      var feature = this.idToFeature[id];

      if(feature) {
        this.removeItem(id);
      }

      feature = this.createMarker(id, lonlat, attrs);
      this.idToFeature[id] = feature;
      if(visible) {
        this.featureLayer.addFeatures([feature]);
      }
    },

    setVisible: function(id, value) {
      var feature = this.idToFeature.get(id);
      if(!feature) {
        return;
      }

      if(value) {
        this.featureLayer.addFeatures([feature]);
      } else {
        this.featureLayer.removeFeatures([feature]);
      }
    },

    // Fixme: combine pos with attrs?
    addItems : function(idToPos, idToAttrs) {
      for(var id in idToLonlat) {
        var lonlat = idToLonlat[id];
        var attrs = idToAttrs[id];
        this.addItem(id, lonlat, attrs, true);
      }
    },

    clearItems: function() {
      this.removeItems(_(this.idToFeature).keys());
      this.removeBoxes(_(this.idToBox).keys());

      this.featureLayer.destroyFeatures();
      this.boxLayer.destroyFeatures();
    },

    removeItem : function(id) {
      var feature = this.idToFeature[id];
      if(feature) {
        this.featureLayer.removeFeatures([feature]);
        delete this.idToFeature[id];
      } else {
        console.log('[WARN] Id ' + id + ' requested for deletion, but not found in the ' +
          _.keys(this.idToFeature).length + ' available ones: ', this.idToFeature);
      }
    },

    removeItems : function(ids) {
      for(var i = 0; i < ids.length; ++i) {
        var id = ids[i];
        this.removeItem(id);
      }
    },

    _intersectBounds : function() {
    },

    addBox : function(id, bounds) {
      var self = this;

      var existingBox = this.idToBox[id];
      if(existingBox) {
        this.removeBox(id);
      }

      var limit = new OpenLayers.Bounds(-179.999, -85.0, 179.999, 85.0);
      var newBounds = new OpenLayers.Bounds(
          Math.max(bounds.left, limit.left),
          Math.max(bounds.bottom, limit.bottom),
          Math.min(bounds.right, limit.right),
          Math.min(bounds.top, limit.top));

      // Example: Convert the input WGS84 to EPSG:900913
      newBounds.transform(this.map.displayProjection, this.map.projection);

      var orig_ll_min = new OpenLayers.LonLat(newBounds.left, newBounds.bottom);
      var orig_ll_max = new OpenLayers.LonLat(newBounds.right, newBounds.top);

      var orig_px_min = this.map.getPixelFromLonLat(orig_ll_min);
      var orig_px_max = this.map.getPixelFromLonLat(orig_ll_max);

      var border_px = 10;
      var border_px_min = new OpenLayers.Pixel(orig_px_min.x + border_px, orig_px_min.y - border_px);
      var border_px_max = new OpenLayers.Pixel(orig_px_max.x - border_px, orig_px_max.y + border_px);

      var border_ll_min = this.map.getLonLatFromPixel(border_px_min);
      var border_ll_max = this.map.getLonLatFromPixel(border_px_max);

      var b = new OpenLayers.Bounds(
          border_ll_min.lon,
          border_ll_min.lat,
          Math.max(border_ll_min.lon, border_ll_max.lon),
          Math.max(border_ll_min.lat, border_ll_max.lat)
      );

      var boxFeature = new OpenLayers.Feature.Vector(b.toGeometry(), {
          zoomable: true
      }, this.styles.boxStyle);

      this.boxLayer.addFeatures([boxFeature]);
      this.idToBox[id] = boxFeature;
    },

    removeBoxes: function(ids) {
      var self = this;
      _(ids).each(function(id) {
        self.removeBox(id);
      });
    },

    removeBox : function(id) {
      var box = this.idToBox[id];
      if(box) {
        this.boxLayer.removeFeatures([box]);
      }
    },

    // TODO: remove
    _doBind: function() {
    },

    _pointToScreen: function(point) {
      return point.clone().transform(this.map.displayProjection, this.map.projection);
    },

    createMarker: function(id, point, attrs) {
      var tPoint = point.clone().transform(this.map.displayProjection, this.map.projection);
      var pt = new OpenLayers.Geometry.Point(tPoint.lon, tPoint.lat);
      var newAttrs = OpenLayers.Util.extend(
        OpenLayers.Util.extend({}, attrs), {
          point: point,
          nodeId: id,
          label: attrs.abbr,
          radius: 12
        }
      );

      return new OpenLayers.Feature.Vector(pt, newAttrs);;
    },

    getExtent: function() {
      return this.map.getExtent().transform(this.map.projection, this.map.displayProjection);
    },

    getState: function() {
      var map = this.map;
      var tmp = map.getCenter();
      var lonlat = tmp.transform(map.projection, map.displayProjection);
      var center = {lon: lonlat.lon, lat: lonlat.lat};
      var zoom = map.getZoom();

      var result = {
          center: center,
          zoom: zoom
      };

      return result;
    },

    loadState: function(state) {
      if(!state) {
        return;
      }

      var map = this.map;

      var c = state.center;
      var center;
      if(c) {
        var tmp = new OpenLayers.LonLat(state.center.lon, state.center.lat);
        center = tmp.transform(map.displayProjection, map.projection);
      } else {
        center = this.map.getCenter();
      }

      var zoom = state.zoom ? state.zoom : this.map.getZoom();
      this.map.setCenter(center, zoom, false, false);
    },

    getElement: function() {
      return this.domElement;
    }
  });

})(jQuery);
