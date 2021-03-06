define(function (require) {

    'use strict';

    var SeriesModel = require('../../model/Series');
    var List = require('../../data/List');
    var zrUtil = require('zrender/core/util');

    return SeriesModel.extend({

        type: 'series.geoLine',

        dependencies: ['grid', 'polar'],

        getInitialData: function (option, ecModel) {
            var fromDataArr = [];
            var toDataArr = [];
            var lineDataArr = [];
            zrUtil.each(option.data, function (opt) {
                fromDataArr.push(opt[0]);
                toDataArr.push(opt[1]);
                lineDataArr.push(zrUtil.extend(
                    zrUtil.extend({}, zrUtil.isArray(opt[0]) ? null : opt[0]),
                    zrUtil.isArray(opt[1]) ? null : opt[1]
                ));
            });

            var fromData = new List(['lng', 'lat'], this);
            var toData = new List(['lng', 'lat'], this);
            var lineData = new List(['value'], this);

            function geoCoordGetter(item, dim, dataIndex, dimIndex) {
                return item.geoCoord && item.geoCoord[dimIndex];
            }

            fromData.initData(fromDataArr, null, geoCoordGetter);
            toData.initData(toDataArr, null, geoCoordGetter);
            lineData.initData(lineDataArr);

            this.fromData = fromData;
            this.toData = toData;

            return lineData;
        },

        defaultOption: {
            coordinateSystem: 'geo',
            zlevel: 0,
            z: 2,
            legendHoverLink: true,

            hoverAnimation: true,
            // Cartesian coordinate system
            xAxisIndex: 0,
            yAxisIndex: 0,

            // Polar coordinate system
            polarIndex: 0,

            // Geo coordinate system
            geoIndex: 0,

            // symbol: null,
            symbolSize: 10,
            // symbolRotate: null,

            effect: {
                show: false,
                period: 4,
                symbol: 'circle',
                symbolSize: 3,
                // Length of trail, 0 - 1
                trailLength: 0.2
                // Same with lineStyle.normal.color
                // color
            },

            large: false,
            // Available when large is true
            largeThreshold: 2000,

            // label: {
                // normal: {
                    // show: false
                    // distance: 5,
                    // formatter: 标签文本格式器，同Tooltip.formatter，不支持异步回调
                    // position: 默认自适应，水平布局为'top'，垂直布局为'right'，可选为
                    //           'inside'|'left'|'right'|'top'|'bottom'
                    // textStyle: null      // 默认使用全局文本样式，详见TEXTSTYLE
            //     }
            // },
            // itemStyle: {
            //     normal: {
            //     }
            // },
            lineStyle: {
                normal: {
                    opacity: 0.5
                }
            }
        }
    });
});