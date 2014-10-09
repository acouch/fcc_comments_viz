'use strict';

var app = angular.module('d3ChoroMap', []);

app.factory('d3ChoroMapParams', ['$q', function ($q) {
  var isNumber = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
  var d3ChoroMapParams = function (baseParameters, baseSettings) {

        var self = this;

        this.data = [];

        this.parameters = function (newParameters, parseParamsFromUrl) {
            parseParamsFromUrl = parseParamsFromUrl || false;
            if (angular.isDefined(newParameters)) {
                for (var key in newParameters) {
                    var value = newParameters[key];
                    if (parseParamsFromUrl && key.indexOf('[') >= 0) {
                        var keys = key.split(/\[(.*)\]/).reverse()
                        var lastKey = '';
                        for (var i = 0, len = keys.length; i < len; i++) {
                            var name = keys[i];
                            if (name !== '') {
                                var v = value;
                                value = {};
                                value[lastKey = name] = (isNumber(v) ? parseFloat(v) : v);
                            }
                        }
                        if (lastKey === 'sorting') {
                            params[lastKey] = {};
                        }
                        params[lastKey] = angular.extend(params[lastKey] || {}, value[lastKey]);
                    } else {
                        params[key] = (isNumber(newParameters[key]) ? parseFloat(newParameters[key]) : newParameters[key]);
                    }
                }
                return this;
            }
            return params;
        };

        this.settings = function (newSettings) {
          if (angular.isDefined(newSettings)) {
            if (angular.isArray(newSettings.data)) {
              //auto-set the total from passed in data
              newSettings.total = newSettings.data.length;
            }
            settings = angular.extend(settings, newSettings);
            return this;
          }
          return settings;
        };

        this.page = function (page) {
            return angular.isDefined(page) ? this.parameters({'page': page}) : params.page;
        };

        this.filter = function (filter) {
          return angular.isDefined(filter) ? this.parameters({'filter': filter}) : params.filter;
        };


        this.total = function (total) {
            return angular.isDefined(total) ? this.settings({'total': total}) : settings.total;
        };

        this.getData = function ($defer, params) {
            if (angular.isArray(this.data) && angular.isObject(params)) {
                $defer.resolve(this.data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            } else {
                $defer.resolve([]);
            }
        };

        this.reload = function () {
            var $defer = $q.defer(),
                self = this;

            settings.$loading = true;
            if (settings.groupBy) {
                settings.getGroups($defer, settings.groupBy, this);
            } else {
                settings.getData($defer, this);
            }
            $defer.promise.then(function (data) {
                settings.$loading = false;
                if (settings.groupBy) {
      //              self.data = settings.$scope.$groups = data;
                } else {
        //            self.data = settings.$scope.$data = data;
                }
                //settings.$scope.pages = self.generatePagesArray(self.page(), self.total(), self.count());
                //settings.$scope.$emit('d3ChoroMapReload');
            });
        };

        var width = 600;
        var scale = width * 1.333;
        var height = 900;

        this.translate = function() {
          return this.width / 2, this.height / 2;
        }

        var params = this.$params = {
            page: 1,
            count: 1,
            filter: {},
            sorting: {},
            width: width,
            height: height,
            scale: scale,
        };
        var settings = {
            $scope: null, // set by ngTable controller
            $loading: false,
            data: null, //allows data to be set when table is initialized
            defaultSort: 'desc',
            filterDelay: 750,
            projection: d3.geo.albersUsa(),
            translate: this.translate,
            getData: this.getData
        };

        this.settings(baseSettings);
        this.parameters(baseParameters, true);
        console.log(this);
        return this;
  };
  return d3ChoroMapParams;
}]);

var d3ChoroMapController = ['$scope', 'd3ChoroMapParams', '$timeout', function ($scope, d3ChoroMapParams, $timeout) {
    $scope.$loading = false;

    if (!$scope.params) {
        $scope.params = new d3ChoroMapParams();
   }
  //  $scope.params.settings().$scope = $scope;

    var delayFilter = (function () {
        var timer = 0;
        return function (callback, ms) {
            $timeout.cancel(timer);
            timer = $timeout(callback, ms);
        };
    })();

    $scope.$watch('params.$params', function (newParams, oldParams) {
      //    $scope.params.settings().$scope = $scope;
      if (!angular.equals(newParams.filter, oldParams.filter)) {
        console.log('spload');
        delayFilter(function () {
          console.log('load');
          $scope.params.$params.page = 1;
          $scope.params.reload();
        }, $scope.params.settings().filterDelay);
      } else {
        console.log('reload');
        //$scope.params.reload();
        $scope.params.$params.height = 111;
      }
    }, true);

}];

app.directive('d3ChoroMap', ['$compile', '$q', '$parse',
  function ($compile, $q, $parse) {
    'use strict';

    return {
      restrict: 'AE',
      priority: 1001,
      controller: d3ChoroMapController,
      template: '<svg ng-attr-height="{{height}}" ng-attr-width="{{width}}"></svg>',
      compile: function (element, attr) {


        return function (scope, element, attrs) {


          scope.$watch(attrs.d3ChoroMap, (function (params) {
            if (angular.isUndefined(params)) {
                console.log(params);
                return;
            }
            scope.params = params;

            scope.height = params.$params.height;
            scope.width = params.$params.width;

            console.log(element);

            var height = params.$params.height;
            var width = params.$params.width;
            // TODO: Parameterize
            var centered;

            var projection = d3.geo.albersUsa()
              .scale(1280)
              .translate([width / 2, height / 2]);

            var path = d3.geo.path()
              .projection(projection);

            var svg = d3.select("div[d3-choro-map=" + attrs.d3ChoroMap + "] svg");
              var g = svg.append("g");

            var us = queue()
             .defer(d3.json, "data/us.json")
             .await(ready);

            function ready(error, us) {
              var counties = topojson.feature(us, us.objects.counties).features;
              var selectedCounty = counties.filter(function(county) { if (county.id == '31011') {return county};});

              g.append("g")
                .attr("id", "states")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                  .enter().append("path")
                    .attr("d", path)
                    .on("click", stateClick);

              g.append("g")
                .attr("id", "counties")
                .selectAll("path")
                .data(selectedCounty)
                  .enter().append("path")
                    .attr("d", path)
                    .attr("county", function(d) { return d.id; })
                    .on("click", stateClick);

              g.append("path")
               .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
                .attr("id", "state-borders")
                .attr("d", path);
            }

            function stateClick(d) {
              console.log(d);
              var x, y, k;

              if (d && centered !== d) {
                var centroid = path.centroid(d);
                x = centroid[0];
                y = centroid[1];
                k = 5;
                centered = d;
              } else {
                x = width / 2;
                y = height / 2;
                k = 1;
                centered = null;
              }

              g.selectAll("path")
                .classed("active", centered && function(d) { return d === centered; });

              g.transition()
                .duration(750)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                .style("stroke-width", 1.5 / k + "px");
              }
            }), true);
        };
      }
    }
  }
]);

//angular.module('ngTable').run(['$templateCache', function ($templateCache) {
  //$templateCache.put('ng-table/pager.html', '<div class="ng-cloak ng-table-pager"> <div ng-if="params.settings().counts.length" class="ng-table-counts btn-group pull-right"> <button ng-repeat="count in params.settings().counts" type="button" ng-class="{\'active\':params.count()==count}" ng-click="params.count(count)" class="btn btn-default"> <span ng-bind="count"></span> </button> </div> <ul class="pagination ng-table-pagination"> <li ng-class="{\'disabled\': !page.active}" ng-repeat="page in pages" ng-switch="page.type"> <a ng-switch-when="prev" ng-click="params.page(page.number)" href="">&laquo;</a> <a ng-switch-when="first" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> <a ng-switch-when="page" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> <a ng-switch-when="more" ng-click="params.page(page.number)" href="">&#8230;</a> <a ng-switch-when="last" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> <a ng-switch-when="next" ng-click="params.page(page.number)" href="">&raquo;</a> </li> </ul> </div> ');
//}]);

