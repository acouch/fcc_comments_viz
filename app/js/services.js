'use strict';

/* Services */

angular.module('fccViz.services', [])
  .factory('responses', ['$http', function($http) {
    var doRequest = function(county, page, count, query, offset) {
      query = query ? "&query=" + query : query;
      return $http({
        method: 'JSONP',
        url: 'http://test-fcc-comments.getnucivic.com/api/action/datastore/search.jsonp?resource_id=290873aa-b836-4e43-afb0-6181da87ed93&offset=' + page + '&limit=' + count + '&filters[countyId]=' + county + query + '&callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(county, page, count, query) { return doRequest(county, page, count, query, 'events'); },
    };
  }])
  .factory('stateResponses', ['$http', function($http) {
    var doRequest = function(state, page, count, query, offset) {
      query = query ? "&query=" + query : '';
      console.log(query);
      return $http({
        method: 'JSONP',
        url: 'http://test-fcc-comments.getnucivic.com/api/action/datastore/search.jsonp?resource_id=290873aa-b836-4e43-afb0-6181da87ed93&offset=' + page + '&limit=' + count + '&filters[stateCd]=' + state + query + '&callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(state, page, count, query) { return doRequest(state, page, count, query, 'events'); },
    };
  }])
  .factory('countyCount', ['$http', function($http) {
    var resource_id = '6da7d4b5-b535-474e-8456-585c73dfe222';
    var doRequest = function(sortColumn, sort, page, count, offset) {
      return $http({
        method: 'JSONP',
        url: 'http://test-fcc-comments.getnucivic.com/api/action/datastore/search.jsonp?resource_id=' + resource_id + '&offset=' + page + '&limit=' + count + '&sort=' + sortColumn + ' ' + sort + '&callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(sortColumn, sort, page, count) { return doRequest(sortColumn, sort, page, count, 'events'); },
    };
  }])
  .factory('countyData', ['$http', function($http) {
    var resource_id = '787af039-d9f5-4caf-bbdc-1789a67bfc59';
    var doRequest = function(county) {
      return $http({
        method: 'JSONP',
        url: 'http://test-fcc-comments.getnucivic.com/api/action/datastore/search.jsonp?resource_id=' + resource_id + '&filters[id]=' + county + '&callback=JSON_CALLBACK'
      });
    }
    return {
      events: function(sortColumn, sort, page, count) { return doRequest(sortColumn, sort, page, count, 'events'); },
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
