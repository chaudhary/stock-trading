angular.module('ac.directives').directive('acGooglePlaces', ['$parse', '$http', '$rootScope', function($parse, $http, $rootScope) {
  return {
    compile : function(tElem, tAttrs) {
      return function(scope, element, attrs, controller) {
        var options = angular.extend({}, scope.$eval(attrs.opts));
        var api = new google.maps.places.Autocomplete(element[0], options);

        google.maps.event.addListener(api, 'place_changed', function(){
          var selected_place = api.getPlace();
          var place = {id: selected_place.place_id, name: selected_place.name, address: selected_place.formatted_address, raw_data: selected_place};
          if(attrs.gpModel){
            $parse(attrs.gpModel).assign(scope, place);
          }

          $http({
            method: 'POST',
            url: '/directory/gplace',
            data: {place: place}
          });

          // Broadcast event
          $rootScope.$broadcast('google_place_changed', place);
        });
      };
    }
  };

}]);
