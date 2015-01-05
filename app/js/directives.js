'use strict';

/* Directives */


angular.module('fccViz.directives', []).
  directive('countyChoroMap', ['$window', function($window) {
      return {
        restrict: 'AE',
        scope: {
          height: '@',
          width: '@'
        },
        template: '<svg height={{height}} width={{width}}></svg>',
        link: function(scope, element, attr) {
          console.log(element)

          var w = angular.element($window);
          scope.$watch(function () {

          }, true);
          w.bind('resize', function () {
              scope.$apply();
          });

          var g = d3.select("svg").append("g");


        }
      }
    }]
  );
