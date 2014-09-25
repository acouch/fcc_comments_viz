'use strict';

angular.module('fccViz.controllers', ['ngTable'])
  .controller('USAMapCtrl', ['$scope', 'ngTableParams', 'countyName', 'countyCount', function($scope, ngTableParams, countyName, countyCount) {

  var countWidth = $(window).width()
  var countScale = d3.scale.linear()
    .domain([0, 19000])
    .range([10, countWidth * .66]);
  var percentScale = d3.scale.linear()
    .domain([0, .04])
    .range([10, countWidth * .66]);

  $scope.CountTable = new ngTableParams({
      page: 1,
      count: 10
    },
    {
    total: 2826,
    getData: function($defer, params) {
      countyCount.events('count', 'desc', params.page() - 1, params.count())
        .success(function(data, status, headers) {
          var results = data.result.records;
          angular.forEach(results, function(value, key) {
            value.width = d3.round(countScale(value.count));
            results[key] = value;
          });
          $defer.resolve(results);
        });
      }
  });
  $scope.PercentTable = new ngTableParams({
      page: 1,
      count: 10
    },
   {
    total: 2826,
    getData: function($defer, params) {
      countyCount.events('percent', 'desc', params.page() - 1, params.count())
        .success(function(data, status, headers) {
          params.total(data.result.total);
          var results = data.result.records;
            angular.forEach(results, function(value, key) {
            value.width = d3.round(percentScale(value.percent));
            results[key] = value;
          });
          $defer.resolve(results);
        });
    }
  });

  var width = 960,
    height = 600,
    centered;

  var rateById = d3.map();
  var percentById = d3.map();
  var percentRankById = d3.map();
  var rateRankById = d3.map();

  $scope.quantize = d3.scale.threshold()
    .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 20000])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    var projection = d3.geo.albersUsa()
        .scale(1280)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    $scope.svg = d3.select("div#usamap").append("svg")
        .attr("width", width)
        .attr("height", height);

    $scope.g = $scope.svg.append("g");

    $scope.ctyByNumber = function() {
            console.log('wtf');

      $("#count-table").show();
      $("#percent-table").hide();
      $("#count-by-percent").removeClass("active");
      $("#count-by-number").addClass("active");
    }
    $scope.ctyByPercent = function() {
            console.log('wtf');
      $("#count-table").hide();
      $("#percent-table").show();
      $("#count-by-percent").addClass("active");
      $("#count-by-number").removeClass("active");
    }

    $scope.byNumber = function() {
      $("#usamap svg").remove();
      $("#usamap").removeClass("zoomed");


      $scope.svg = d3.select("div#usamap").append("svg")
        .attr("width", width)
        .attr("height", height);

      $scope.g = $scope.svg.append("g");
      $scope.quantize = d3.scale.threshold()
        .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 11000])
        .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

      $scope.quantFunc = rateById;

      $scope.us.await(ready);
    }


    $scope.byPercent = function() {
      $("#usamap svg").remove();
      $("#usamap").removeClass("zoomed");

      $scope.svg = d3.select("div#usamap").append("svg")
        .attr("width", width)
        .attr("height", height);

      $scope.g = $scope.svg.append("g");
      $scope.quantize = d3.scale.threshold()
        .domain([0.0001,0.0003,0.0009, 0.001,0.0024,0.0045,0.008,0.01])
        .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

      $scope.quantFunc = percentById;

      $scope.us.await(ready);
    }

    $("#by-number").click(function(c) {
      $("#by-percent").removeClass("active");
      $(this).addClass("active");

    });
    $("#by-percent").click(function(c) {
      $("#by-number").removeClass("active");
      $(this).addClass("active");
    });
    $("#tooltip").hover(function(){
      $(this).toggle();
    });
    // This isn't working yet. Binds too late.
    $(".county-link").hover(function() {
      var id = $(this).attr('county-id');
      var rate =  rateById.get(id) ? rateById.get(id) : 0;
      var percent =  percentById.get(id) ? percentById.get(id) : 0;
      var percentRank =  percentRankById.get(id) ? percentRankById.get(id) : 0;
      var rateRank =  rateRankById.get(id) ? rateRankById.get(id) : 0;
      var linkBound = $(this).offset();
      var top =  linkBound.top - 50;

      popup(countyBound.left, top, d, rate, percent, rateRank, percentRank);
    });


    $scope.quantFunc = rateById;

    $scope.us = queue()
      .defer(d3.json, "data/us.json")
      .defer(d3.csv, "data/county_data.csv", function(d) {
        percentById.set(d.id, + d.percent);
        rateById.set(d.id, + d.rate);
        rateRankById.set(d.id, + d.rate_rank);
        percentRankById.set(d.id, + d.percent_rank);
      })
      .await(ready);

    function popup(left, top, data, rate, percent, rateRank, percentRank) {
      var id = data.id;

      if ($("#usamap").hasClass("zoomed")) {
        left = left + 50;
        if (left > 800) {
          left = left - 500;
        }
      }
      else if (left > 800) {
        left = left - 450;
      }

      d3.select("#tooltip")
        .style("left", (left) + "px")
        .style("top", (top) + "px")
        .style("display", "block")
        .html('<div class="popover fade right in"><button onclick="this.parentNode.parentNode.style.display = \'none\';" type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><div class="popover-content"><div class="popover-inner"><h4><div id="county-name">loading...</div></h4><strong><span id="rate">' + rate + '</span></strong> responses<br/><strong>' + rateRank + '</strong> rank by comment count</br><strong>' +  percent + '</strong>  % of population</br><strong>' + percentRank + '</strong> rank by % of population <p class="help">Click once to zoom.<br/>Click twice to see full results.</p></div></div></div>');

      countyName.events(id)
        .success(function(data, status, headers) {
          angular.forEach(data.result.records[0], function(value, key) {
            if (key == ' County Name') {
              d3.select("#county-name")
                .html(value);
            }
        });
      });

      var cpath = path(data);
      var svgToolTip = d3.select("div#tooltip .popover-content").append("svg")
        .attr("width", 100)
        .attr("class", function(e) { return $scope.quantize($scope.quantFunc.get(id)); })
        .attr("height", 100);

      var gToolTip = svgToolTip.append("g");
      gToolTip.append("path")
        .attr('d', cpath);

      var bounds = path.bounds(data),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 1 / Math.max(dx / 100, dy / 100),
        translate = [100 / 2 - scale * x, 100 / 2 - scale * y];

      gToolTip.transition()
        .style("stroke-width", 1.5 / scale + "px")
        .duration(1)
          .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    }

    function hover(d) {
      var mapBound = $("#usamap").offset();
      var countyBound = $(this).offset();
      var top =  countyBound.top - mapBound.top  - 50;
      var rate =  rateById.get(d.id) ? rateById.get(d.id) : 0;
      var percent =  percentById.get(d.id) ? percentById.get(d.id) : 0;
      var percentRank =  percentRankById.get(d.id) ? percentRankById.get(d.id) : 0;
      var rateRank =  rateRankById.get(d.id) ? rateRankById.get(d.id) : 0;

      d3.select(this)
        .attr('style', 'fill: rgb(219, 87, 87)');

      popup(countyBound.left, top, d, rate, percent, rateRank, percentRank);
    }

    function ready(error, us) {

      $scope.g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
          .enter().append("path")
          .attr("d", path)
          .on("click", stateClick);

      $scope.g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
          .enter().append("path")
            .attr("class", function(d) { return $scope.quantize($scope.quantFunc.get(d.id)); })
            .attr("county", function(d) { return d.id; })
            .attr("rate", function(d){ return rateById.get(d.id);})
            .attr("d", path)
            .on("mouseover", hover)
            .on("click", stateClick)
            .on("mouseleave", function(d) {
              d3.select(this)
                .transition()
                .attr("style", "");
            });
      $scope.g.append("path")
       .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", path);

      $("#counties path").click(function(f) {
        if ($(this).is(".active")) {
        }
        else {
          var county = $(this).attr("county");
          window.location = '#/county/' + county;
        }
      });
    }

    function stateClick(d) {
        var x, y, k;

        if (d && centered !== d) {
          var centroid = path.centroid(d);
          x = centroid[0];
          y = centroid[1];
          k = 4;
          centered = d;
        } else {
          x = width / 2;
          y = height / 2;
          k = 1;
          centered = null;
        }
        $("#usamap").addClass("zoomed");

        $scope.g.selectAll("path")
          .classed("active", centered && function(d) { return d === centered; });

        $scope.g.transition()
          .duration(750)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
          .style("stroke-width", 1.5 / k + "px");
    }

    d3.select(self.frameElement).style("height", height + "px");


  }])
  .controller('CountyCtrl', ['$scope', '$routeParams', '$location', '$filter', 'countyName', 'responses', 'ngTableParams', function($scope, $routeParams, $location, $filter, countyName, responses, ngTableParams) {
    countyName.events($routeParams.countyId)
      .success(function(data, status, headers) {
        angular.forEach(data.result.records[0], function(value, key) {
          if (key == ' County Name') {
            $scope.name = value;
           }
      });
    });

    $scope.DkanTable = new ngTableParams(
        angular.extend({
            page: 0,
            count: 10,
            query: "",
        },
        $location.search()), {
          total: 0, // length of data
          getData: function($defer, params) {
            var url = params.url();
            url.query = url.query ? decodeURIComponent(url.query) : url.query;

            if ($scope.query) {
              url.query = $scope.query;
            }
            if (url.query && !$scope.query) {
              $scope.query = url.query;
            }
           $location.search(url);
            responses.events($routeParams.countyId, params.page(), params.count(), $scope.query)
              .success(function(data, status, headers) {
                params.total(data.result.total);
                $scope.total = data.result.total;
                $scope.limit = data.result.limit;

                $defer.resolve(data.result.records);
              });
          }
    });



  }]);
