'use strict';

/* Services */

angular.module('fccViz.services', [])
	.value('version', '1.1')
	.factory('githubService', ['$http', function($http) {

    var doRequest = function(username, path) {
      return $http({
        method: 'JSONP',
        url: 'https://api.github.com/users/' + username + '/' + path + '?callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(username) { return doRequest(username, 'events'); },
    };
  }])
  .factory('responses', ['$http', function($http) {
    var doRequest = function(county, offset) {
      return $http({
        method: 'JSONP',
        url: 'http://test-fcc-comments.getnucivic.com/api/action/datastore/search.jsonp?resource_id=290873aa-b836-4e43-afb0-6181da87ed93&filters[countyId]=' + county + '&callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(county) { return doRequest(county, 'events'); },
    };
  }])
  .factory('countyName', ['$http', function($http) {
    var doRequest = function(county) {
      return $http({
        method: 'JSONP',
        url: 'http://test-fcc-comments.getnucivic.com/api/action/datastore/search.jsonp?resource_id=aba4778e-d303-4932-802f-109f807966e0&filters[county]=' + county + '&callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(county) { return doRequest(county, 'events'); },
    };
  }]);
