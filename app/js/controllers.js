'use strict';

angular.module('fccViz.controllers', ['ngTable', 'd3ChoroMap'])
  .controller('USAMapCtrl', ['$scope', 'ngTableParams', 'countyName', 'countyCount', function($scope, ngTableParams, countyName, countyCount) {

  var countWidth = $(window).width()
  var countScale = d3.scale.linear()
    .domain([0, 19000])
    .range([10, countWidth * .66]);
  var percentScale = d3.scale.linear()
    .domain([0, .04])
    .range([10, countWidth * .66]);
  var stateCountScale = d3.scale.linear()
    .domain([0, 70169])
    .range([20, countWidth * .66]);

  $scope.transition = 750;
  $scope.k = 5;


  d3.csv("data/state_count.csv", function(data) {
    var result = {};
    angular.forEach(data, function(value, key) {
      value.width = d3.round(stateCountScale(value.rate));
      result[key] = value;
    });
    $scope.stateCountTable = new ngTableParams({
      page: 1,
      count: 10
    },
    {
      total: 58,
      getData: function($defer, params) {
        var data = {};
        var page = params.page() - 1;
        var start = params.count() * page;
        var length = params.count() + start;
        angular.forEach(result, function(value, key) {
          value.width = d3.round(stateCountScale(value.rate));
          if (key >= start && key < length)
          data[key] = value;
        });
        $defer.resolve(data);
      }
    });
  });

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

  $scope.rateById = d3.map();
  $scope.percentById = d3.map();
  $scope.percentRankById = d3.map();
  $scope.rateRankById = d3.map();

  $scope.quantize = d3.scale.threshold()
    .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 20000])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

  var projection = d3.geo.albersUsa()
    .scale(1280)
    .translate([width / 2, height / 2]);

  $scope.path = d3.geo.path()
    .projection(projection);

  $scope.svg = d3.select("div#usamap").append("svg")
    .attr("width", width)
    .attr("height", height);

  $scope.g = $scope.svg.append("g");

  $scope.ctyByNumber = function() {
    $("#count-table").show();
    $("#percent-table").hide();
    $("#count-by-percent").removeClass("active");
    $("#count-by-number").addClass("active");
  }
  $scope.ctyByPercent = function() {
    $("#count-table").hide();
    $("#percent-table").show();
    $("#count-by-percent").addClass("active");
    $("#count-by-number").removeClass("active");
  }

  countyChoroMap($scope, countyName, width, height);

  $("#by-number").click(function(c) {
    $("#by-percent").removeClass("active");
    $(this).addClass("active");
  });

  $("#by-percent").click(function(c) {
    $("#by-number").removeClass("active");
    $(this).addClass("active");
  });
  // This isn't working yet. Binds too late.
  $("#tables").on("mouseenter", "td.comment a .chart", function(event) {
    var id = $(this).parent().attr('county-id');
    var rate =  $scope.rateById.get(id) ? $scope.rateById.get(id) : 0;
    var percent =  $scope.percentById.get(id) ? $scope.percentById.get(id) : 0;
    var percentRank =  $scope.percentRankById.get(id) ? $scope.percentRankById.get(id) : 0;
    var rateRank =  $scope.rateRankById.get(id) ? $scope.rateRankById.get(id) : 0;
    var top =  event.pageY - $("#tables").offset().top;

    var selectedCounty = $scope.counties.filter(function(county) { if (county.id == id) {return county};})
    var left = $(window).width() - event.pageX > 500 ? event.pageX : event.pageX - 500;

    popupTable($scope, countyName, left, top, selectedCounty[0], rate, percent, rateRank, percentRank);
  });

  $("#tables").on("mouseleave", "table", function(event) {
    $(".tool").hide();
  });


  d3.select(self.frameElement).style("height", height + "px");

}])
.controller('CountyCtrl', ['$scope', '$routeParams', '$location', '$filter', 'countyData', 'countyName', 'responses', 'd3ChoroMapParams', 'ngTableParams', function($scope, $routeParams, $location, $filter, countyData, countyName, responses, d3ChoroMapParams, ngTableParams) {
  countyName.events($routeParams.countyId)
    .success(function(data, status, headers) {
      angular.forEach(data.result.records[0], function(value, key) {
        if (key == ' County Name') {
          $scope.name = value;
         }
    });
  });

  countyData.events($routeParams.countyId)
    .success(function(data, status, headers) {
      angular.forEach(data.result.records[0], function(value, key) {
        if (key == 'rate') {
          $scope.responses = value;
        }
        else if (key == 'percent') {
          $scope.percent = value;
        }
        else if (key == 'percent_rank') {
          $scope.percent_rank = value;
        }
        else if (key == 'rate_rank') {
          $scope.rank = value;
        }
    });
  });
  var width = 660,
    height = 300,
    centered;

  $scope.rateById = d3.map();
  $scope.percentById = d3.map();
  $scope.percentRankById = d3.map();
  $scope.rateRankById = d3.map();

  $scope.quantize = d3.scale.threshold()
    .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 20000])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

  $scope.transition = 0;
  $scope.k = 7;


  var projection = d3.geo.albersUsa()
    .scale(1280)
    .translate([width / 2, height / 2]);

  $scope.path = d3.geo.path()
    .projection(projection);

  $scope.svg = d3.select("div#usamap").append("svg")
    .attr("width", width)
    .attr("height", height);

  $scope.g = $scope.svg.append("g");

  var hash = window.location.hash.split('/');
  var hashId = hash[2].split('?')
  var countyId = hashId[0];

  countyChoroMap($scope, countyName, width, height, countyId);

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


}])
.controller('StateCtrl', ['$scope', '$routeParams', '$location', '$filter', 'countyData', 'countyName', 'stateResponses', 'd3ChoroMapParams', 'ngTableParams', function($scope, $routeParams, $location, $filter, countyData, countyName, stateResponses, d3ChoroMapParams, ngTableParams) {

  var width = 560,
    height = 350,
    centered;

  $scope.rateById = d3.map();
  $scope.percentById = d3.map();
  $scope.percentRankById = d3.map();
  $scope.rateRankById = d3.map();

  $scope.quantize = d3.scale.threshold()
    .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 20000])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

  $scope.transition = 0;
  $scope.k = 2.95;

  var projection = d3.geo.albersUsa()
    .scale(1280)
    .translate([width / 2, height / 2]);

  $scope.path = d3.geo.path()
    .projection(projection);

  $scope.svg = d3.select("div#usamap").append("svg")
    .attr("width", width)
    .attr("height", height);

  $scope.g = $scope.svg.append("g");

  var hash = window.location.hash.split('/');
  var hashId = hash[2].split('?')
  var stateCd = hashId[0];

  countyChoroMap($scope, countyName, width, height, null, stateCd);

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

        if (params.count() != 10 && params.page() != 0) {
          $location.search(url);
        }

        if ($scope.query) {
          url.query = $scope.query;
          $location.search(url);
        }
        if (url.query && !$scope.query) {
          $scope.query = url.query;
        }

        stateResponses.events($routeParams.stateId, params.page(), params.count(), $scope.query)
          .success(function(data, status, headers) {
            params.total(data.result.total);
            $scope.total = data.result.total;
            $scope.limit = data.result.limit;

            $defer.resolve(data.result.records);
          });
      }
  });

}]);
function countyChoroMap($scope, countyName, width, height, countyId, stateId) {
  var centered;

  $scope.quantFunc = $scope.rateById;
  $scope.us = queue()
    .defer(d3.json, "data/us.json")
    .await(ready);

  if (countyId) {
    $scope.countyId = countyId;
  }
  if (stateId) {
    $scope.stateId = stateId;
  }

  $scope.us.defer(d3.csv, "data/county_data.csv", function(d) {
    $scope.percentById.set(d.id, + d.percent);
    $scope.rateById.set(d.id, + d.rate);
    $scope.rateRankById.set(d.id, + d.rate_rank);
    $scope.percentRankById.set(d.id, + d.percent_rank);
  })

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

    $scope.quantFunc = $scope.rateById;

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

    $scope.quantFunc = $scope.percentById;

    $scope.us.await(ready);
  }

  function hover(d) {
    var that = this;

    var mapBound = $("#usamap").offset();

    var countyBound = $(that).offset();
    var top = countyBound.top - mapBound.top > 0 ? countyBound.top - mapBound.top : 0;
    var top = top - $(that)[0].getBBox().height - 50;
    var rate =  $scope.rateById.get(d.id) ? $scope.rateById.get(d.id) : 0;
    var percent =  $scope.percentById.get(d.id) ? $scope.percentById.get(d.id) : 0;
    var percentRank =  $scope.percentRankById.get(d.id) ? $scope.percentRankById.get(d.id) : 0;
    var rateRank =  $scope.rateRankById.get(d.id) ? $scope.rateRankById.get(d.id) : 0;

    d3.select(that)
      .attr('style', 'fill: rgb(219, 87, 87)');

    var left = countyBound.left + $(that)[0].getBBox().width + $(that)[0].getBBox().width;
    var middle = $(that)[0].getBBox().y + $(that)[0].getBBox().height;

    popup($scope, countyName, left, top, d, rate, percent, rateRank, percentRank);
  }

  function ready(error, us) {
    $scope.counties = topojson.feature(us, us.objects.counties).features;

    if ($scope.stateId) {
      var states = topojson.feature(us, us.objects.states).features;
      var stateNum = stateLookUp.filter(function(state) { if (state[2] == $scope.stateId) { return state[0];}});
      var selectedState = states.filter(function(state) { if (state.id == stateNum[0][0]) {return true};});
      $scope.selectedState = selectedState;
      $scope.name = stateNum[0][1];

      if (stateNum[0][3]) {
        $scope.k = stateNum[0][3];
      }
      if (stateNum[0][4]) {
        width = stateNum[0][4];
        $scope.svg.attr("width", stateNum[0][4]);
      }
      if (stateNum[0][5]) {
        height = stateNum[0][5];
        $scope.svg.attr("height", stateNum[0][5]);
      }
      $('body').addClass("state");
      $scope.g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data($scope.counties)
          .enter().append("path")
            .attr("class", function(d) { return $scope.quantize($scope.quantFunc.get(d.id)); })
            .attr("county", function(d) { return d.id; })
            .attr("rate", function(d){ return $scope.rateById.get(d.id);})
            .attr("d", $scope.path)
            .on("mouseover", hover)
            .on("mouseleave", function(d) {
              d3.select(this)
                .transition()
                .attr("style", "");
            })
            .call(function() {if (selectedCounty) { stateClick(selectedCounty[0]); }});


      $scope.g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
          .enter().append("path")
          .attr("state", function(d) { return d.id})
          .attr("d", $scope.path)
          .on("click", function(d) {
            $scope.selectedState = states.filter(function(state) { if (state.id == d.id) {return true};});
            stateClick(d);
          })
          .call(function() {if (selectedState) { stateClick(selectedState[0]);}});

    }
    else {

      $scope.g.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("state", function(d) { return d.id})
        .attr("d", $scope.path)
        .on("click", stateClick)
        .call(function() {if (selectedState) { stateClick(selectedState[0]);}});

      $('body').addClass("county");
      var selectedCounty = $scope.counties.filter(function(county) { if (county.id == countyId) {return county};});
      $scope.g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
          .enter().append("path")
            .attr("class", function(d) { return $scope.quantize($scope.quantFunc.get(d.id)); })
            .attr("county", function(d) { return d.id; })
            .attr("rate", function(d){ return $scope.rateById.get(d.id);})
            .attr("d", $scope.path)
            .on("mouseover", hover)
            .on("click", function(d) {
              $("#counties .active").click(function(f) {
                 var county = $(this).attr("county");
                  window.location = '#/county/' + county;
              });
              $scope.countyId = d.id;
              stateClick(d)})
            .on("mouseleave", function(d) {
              d3.select(this)
                .transition()
                .attr("style", "");
            })
            .call(function() {if (selectedCounty[0]) { stateClick(selectedCounty[0]); }});
    }

    $scope.g.append("path")
       .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("id", "state-borders")
        .attr("d", $scope.path);

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

    $('#tooltip').toggle();

    if (d) {
      var centroid = $scope.path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }
    $("#usamap").addClass("zoomed");

    $scope.g.selectAll("path")
      .classed("active", centered && function(d) { return d.id === centered.id; });

    $scope.g.transition()
      .duration($scope.transition)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + $scope.k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / $scope.k + "px");
  }

  $("#navigate #zoom-in").click(function(el) {
    $scope.k = +$scope.k + 2 < 10 ? +$scope.k + 2 : 10;
    if ($scope.countyId) {
      var selectedCounty = $scope.counties.filter(function(county) { if (county.id == $scope.countyId) {return county};});
      if (selectedCounty) { stateClick(selectedCounty[0]); };
    }
    else {
      stateClick($scope.selectedState[0]);
    }
  });

  $("#navigate #zoom-out").click(function(el) {
    $scope.k = +$scope.k - 2 > 1 ? +$scope.k - 2 : 1;
    if ($scope.countyId) {
      var selectedCounty = $scope.counties.filter(function(county) { if (county.id == $scope.countyId) {return county};});
      if (selectedCounty) { stateClick(selectedCounty[0]); };
    }
    else {
      stateClick($scope.selectedState[0]);
    }
  });

  return $scope;
}

function popupTable($scope, countyName, left, top, data, rate, percent, rateRank, percentRank) {
  var id = data.id;

  d3.select("#tables .tool")
    .style("left", (left) + "px")
    .style("top", (top) + "px")
    .style("display", "block")
    .html('<div class="popover fade right in"><button onclick="this.parentNode.parentNode.style.display = \'none\';" type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><div class="popover-content"><div class="popover-inner"><h4><div id="county-name">loading...</div></h4><strong><span id="rate">' + rate + '</span></strong> responses<br/><strong>' + rateRank + '</strong> rank by comment count</br><strong>' +  percent + '</strong>  % of population</br><strong>' + percentRank + '</strong> rank by % of population <p class="help">Click once to zoom.<br/>Click twice to see full results.</p></div></div></div>');

  if (countyName) {
    countyName.events(id)
      .success(function(data, status, headers) {
        angular.forEach(data.result.records[0], function(value, key) {
          if (key == ' County Name') {
            d3.select("#county-name")
              .html(value);
          }
      });
    });
  }

  var cpath = $scope.path(data);
  var svgToolTip = d3.select("#tables .tool .popover-content").append("svg")
    .attr("width", 100)
    .attr("class", function(e) { return $scope.quantize($scope.quantFunc.get(id)); })
    .attr("height", 100);

  var gToolTip = svgToolTip.append("g");

  gToolTip.append("path")
    .attr('d', cpath);

  var bounds = $scope.path.bounds(data),
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

function popup($scope, countyName, left, top, data, rate, percent, rateRank, percentRank) {
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

  if (countyName) {
    countyName.events(id)
      .success(function(data, status, headers) {
        angular.forEach(data.result.records[0], function(value, key) {
          if (key == ' County Name') {
            d3.select("#county-name")
              .html(value);
          }
      });
    });
  }

  var cpath = $scope.path(data);
  var svgToolTip = d3.select("div#tooltip .popover-content").append("svg")
    .attr("width", 100)
    .attr("class", function(e) { return $scope.quantize($scope.quantFunc.get(id)); })
    .attr("height", 100);

  var gToolTip = svgToolTip.append("g");

  gToolTip.append("path")
    .attr('d', cpath);

  var bounds = $scope.path.bounds(data),
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

var stateLookUp = [
["1","Alabama","AL"],
["2","Alaska","AK", "2.2"],
["4","Arizona","AZ"],
["5","Arkansas","AR"],
["6","California","CA", "2", "300", "520"],
["8","Colorado","CO"],
["9","Connecticut","CT"],
["10","Delaware","DE"],
["12","Florida","FL","2.1", "570", "280"],
["13","Georgia","GA"],
["15","Hawaii","HI"],
["16","Idaho","ID"],
["17","Illinois","IL"],
["18","Indiana","IN"],
["19","Iowa","IA"],
["20","Kansas","KS"],
["21","Kentucky","KY"],
["22","Louisiana","LA"],
["23","Maine","ME"],
["24","Maryland","MD"],
["25","Massachusetts","MA"],
["26","Michigan","MI"],
["27","Minnesota","MN"],
["28","Mississippi","MS"],
["29","Missouri","MO"],
["30","Montana","MT"],
["31","Nebraska","NE"],
["32","Nevada","NV"],
["33","New Hampshire","NH"],
["34","New Jersey","NJ"],
["35","New Mexico","NM"],
["36","New York","NY"],
["37","North Carolina","NC"],
["38","North Dakota","ND"],
["39","Ohio","OH", "4"],
["40","Oklahoma","OK"],
["41","Oregon","OR"],
["42","Pennsylvania","PA", "4"],
["43","Rhode Island","RI"],
["44","South Carolina","SC"],
["45","South Dakota","SD"],
["47","Tennessee","TN"],
["48","Texas","TX","1.5", "360", "380"],
["49","Utah","UT"],
["50","Vermont","VT"],
["51","Virginia","VA"],
["53","Washington","WA"],
["54","West Virginia","WV"],
["55","Wisconsin","WI"],
["56","Wyoming","WY"],
];
