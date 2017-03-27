angular.module('currentUser', []);

angular.module('currentUser').run(['$rootScope', function($rootScope) {
  $rootScope.currentUser = JSON.parse($('meta[name=current_user]').attr('content')).current_user;

  $rootScope.currentDate = new Date();
  $rootScope.currentYear = $rootScope.currentDate.getFullYear();
}]);


