'use strict';

angular.module('fccViz.controllers', [])
  .controller('USAMapCtrl', ['$scope', 'githubService', 'countyName', function($scope, githubService, countyName) {
  var width = 960,
    height = 600,
    centered;

    var rateById = d3.map();
    var percentById = d3.map();
    var percentRankById = d3.map();
    var rateRankById = d3.map();

    $scope.quantize = d3.scale.threshold()
        .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 11000])
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
        .domain([0.0001,0.0003,0.0005,0.0008,0.001,0.0024,0.0045,0.008,0.0413])
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
        left = left - 400;
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
      console.log(us);

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
  .controller('CountyCtrl', ['$scope', '$routeParams', 'countyName', 'responses', function($scope, $routeParams, countyName, responses) {
    countyName.events($routeParams.countyId)
      .success(function(data, status, headers) {
        angular.forEach(data.result.records[0], function(value, key) {
          if (key == ' County Name') {
            $scope.name = value;
           }
      });
    });
    d3.tsv("data/county_count.csv", function(data) {
      data.map(function(county) {
        if (county.id == $routeParams.countyId) {
          $scope.count = county.rate;
        }
      });
    });
    responses.events($routeParams.countyId)
      .success(function(data, status, headers) {
        $scope.records = data.result.records;
      });
  }]);
