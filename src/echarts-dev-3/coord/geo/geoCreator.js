define(function (require) {

    require('./GeoModel');

    var Geo = require('./Geo');

    var layout = require('../../util/layout');
    var zrUtil = require('zrender/core/util');

    var mapDataStores = {};

    /**
     * Resize method bound to the geo
     * @param {module:echarts/coord/geo/GeoModel|module:echarts/chart/map/MapModel} geoModel
     * @param {module:echarts/ExtensionAPI} api
     */
    function resizeGeo (geoModel, api) {
        var rect = this.getBoundingRect();

        var width = geoModel.get('width');
        var height = geoModel.get('height');

        var viewRect = layout.parsePositionInfo({
            x: geoModel.get('x'),
            y: geoModel.get('y'),
            x2: geoModel.get('x2'),
            y2: geoModel.get('y2'),
            width: width,
            height: height,
            // 0.75 rate
            aspect: rect.width / rect.height * 0.75
        }, {
            width: api.getWidth(),
            height: api.getHeight()
        });

        var width = viewRect.width;
        var height = viewRect.height;

        var x = viewRect.x + (width - viewRect.width) / 2;
        var y = viewRect.y + (height - viewRect.height) / 2;
        this.setViewRect(x, y, width, height);

        var roamDetailModel = geoModel.getModel('roamDetail');

        var panX = roamDetailModel.get('x') || 0;
        var panY = roamDetailModel.get('y') || 0;
        var zoom = roamDetailModel.get('zoom') || 1;

        this.setPan(panX, panY);
        this.setZoom(zoom);
    }

    /**
     * @param {module:echarts/coord/Geo} geo
     * @param {module:echarts/model/Model} model
     * @inner
     */
    function setGeoCoords(geo, model) {
        zrUtil.each(model.get('geoCoord'), function (geoCoord, name) {
            geo.addGeoCoord(name, geoCoord);
        });
    }

    var geoCreator = {

        create: function (ecModel, api) {
            var geoList = [];

            // FIXME Create each time may be slow
            ecModel.eachComponent('geo', function (geoModel, idx) {
                var name = geoModel.get('map');
                var mapData = mapDataStores[name];
                // if (!mapData) {
                    // Warning
                // }
                var geo = new Geo(
                    name + idx, name,
                    mapData && mapData.geoJson, mapData && mapData.specialAreas,
                    geoModel.get('nameMap')
                );
                geoList.push(geo);

                setGeoCoords(geo, geoModel);

                geoModel.coordinateSystem = geo;
                geo.model = geoModel;

                // Inject resize method
                geo.resize = resizeGeo;

                geo.resize(geoModel, api);
            });

            ecModel.eachSeries(function (seriesModel) {
                var coordSys = seriesModel.get('coordinateSystem');
                if (coordSys === 'geo') {
                    var geoIndex = seriesModel.get('geoIndex') || 0;
                    seriesModel.coordinateSystem = geoList[geoIndex];
                }
            });

            // If has map series
            var mapModelGroupBySeries = {};

            ecModel.eachSeriesByType('map', function (seriesModel) {
                var mapType = seriesModel.get('map');

                mapModelGroupBySeries[mapType] = mapModelGroupBySeries[mapType] || [];

                mapModelGroupBySeries[mapType].push(seriesModel);
            });

            zrUtil.each(mapModelGroupBySeries, function (mapSeries, mapType) {
                var mapData = mapDataStores[mapType];
                // if (!mapData) {
                    // Warning
                // }

                var nameMapList = zrUtil.map(mapSeries, function (singleMapSeries) {
                    return singleMapSeries.get('nameMap');
                });
                var geo = new Geo(
                    mapType, mapType,
                    mapData && mapData.geoJson, mapData && mapData.specialAreas,
                    zrUtil.mergeAll(nameMapList)
                );
                geoList.push(geo);

                // Inject resize method
                geo.resize = resizeGeo;

                geo.resize(mapSeries[0], api);

                zrUtil.each(mapSeries, function (singleMapSeries) {
                    singleMapSeries.coordinateSystem = geo;

                    setGeoCoords(geo, singleMapSeries);
                });
            });

            return geoList;
        },

        /**
         * @param {string} mapName
         * @param {Object|string} geoJson
         * @param {Object} [specialAreas]
         *
         * @example
         *     $.get('USA.json', function (geoJson) {
         *         echarts.registerMap('USA', geoJson);
         *         // Or
         *         echarts.registerMap('USA', {
         *             geoJson: geoJson,
         *             specialAreas: {}
         *         })
         *     });
         */
        registerMap: function (mapName, geoJson, specialAreas) {
            if (geoJson.geoJson && !geoJson.features) {
                specialAreas = geoJson.specialAreas;
                geoJson = geoJson.geoJson;
            }
            if (typeof geoJson === 'string') {
                geoJson = (typeof JSON !== 'undefined' && JSON.parse)
                    ? JSON.parse(geoJson) : (new Function('return (' + geoJson + ');'))();
            }
            mapDataStores[mapName] = {
                geoJson: geoJson,
                specialAreas: specialAreas
            };
        },

        /**
         * @param {string} mapName
         * @return {Object}
         */
        getMap: function (mapName) {
            return mapDataStores[mapName];
        }
    };

    // Inject methods into echarts
    var echarts = require('../../echarts');

    echarts.registerMap = geoCreator.registerMap;

    echarts.getMap = geoCreator.getMap;

    // TODO
    echarts.loadMap = function () {};

    echarts.registerCoordinateSystem('geo', geoCreator);
});