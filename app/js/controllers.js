'use strict';

	/* Controllers */

angular.module('fccViz.controllers', [])
  .controller('USAMapCtrl', ['$scope', 'githubService', 'countyName', function($scope, githubService, countyName) {

	
			var width = 960,
			    height = 600;
			var rateById = d3.map();

			var quantize = d3.scale.threshold()
			    .domain([0, 5, 50, 100, 500, 1000, 3000, 5000, 11000])
			    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

			var projection = d3.geo.albersUsa()
			    .scale(1280)
			    .translate([width / 2, height / 2]);

			var path = d3.geo.path()
			    .projection(projection);

			var svg = d3.select("div#usamap").append("svg")
			    .attr("width", width)
			    .attr("height", height);

			queue()
			    .defer(d3.json, "data/us.json")
			    .defer(d3.tsv, "data/county_count.csv", function(d) { rateById.set(d.id, + d.rate); })
			    .await(ready);


			 function popup(bound, offset, top, countyName, d, rate) {
			 	var left = bound.left;
			 	if (left > 850) {
			 		left = 450 / left * left;
			 	}
			  
				d3.select("#tooltip")
					.style("left", (left) + offset + "px")
					.style("top", (top) + "px")
					.style("display", "block")
					.html('<div class="popover fade right in"><button onclick="this.parentNode.parentNode.style.display = \'none\';" type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><div class="popover-content"><div class="popover-inner"><h4>' + countyName + '</h4><strong>' + rate + '</strong> responses</div></div></div>');

				var cpath = path(d);
				var svgToolTip = d3.select("div#tooltip .popover-content").append("svg")
						.attr("width", 100)
						.attr("class", function(e) { return quantize(rateById.get(d.id)); })
			    	.attr("height", 100);

					var gToolTip = svgToolTip.append("g");
					gToolTip.append("path")
						.attr('d', cpath);

					var bounds = path.bounds(d),
				    dx = bounds[1][0] - bounds[0][0],
			      dy = bounds[1][1] - bounds[0][1],
			      x = (bounds[0][0] + bounds[1][0]) / 2,
			      y = (bounds[0][1] + bounds[1][1]) / 2,
			      scale = 1 / Math.max(dx / 100, dy / 100),
			      translate = [100 / 2 - scale * x, 100 / 2 - scale * y];

			    gToolTip.transition()
			     	.style("stroke-width", 1.5 / scale + "px")
						.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
			 }

			function hover(d) {
				var bound = this.getBoundingClientRect();
				var offset = bound.width;
				var top = bound.top - 100;
				var rate = rateById.get(d.id);
				var id = d.id;
								d3.select(this)
				  .attr('style', 'fill: red');

				
			 countyName.events(id)
			    .success(function(data, status, headers) {
				    angular.forEach(data.result.records[0], function(value, key) {
					   if (key == ' County Name') {
						   popup(bound, offset, top, value, d, rate);
					   }
						});
				});
			
			}

			function ready(error, us) {

			  svg.append("g")
			      .attr("class", "counties")
			    .selectAll("path")
			      .data(topojson.feature(us, us.objects.counties).features)
			    .enter().append("path")
			      .attr("class", function(d) { return quantize(rateById.get(d.id)); })
			      .attr("county", function(d) { return d.id; })
			      .attr("d", path)
			      .on("mouseover", hover)
			      .on("click", function (d) { window.location = '#/county/' + d.id;})
					  .on("mouseleave", function(d) {
			      	d3.select(this)
			      		.transition()
								.attr("style", "");
						});
			  svg.append("path")
			      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
			      .attr("class", "states")
			      .attr("d", path);
			 
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
