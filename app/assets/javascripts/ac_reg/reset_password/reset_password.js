angular.module('ResetPassword', ['ngSanitize', 'ac']);

angular.module('ResetPassword').controller('ResetPasswordController',['$scope','$http','$timeout',
function ($scope, $http, $timeout) {
  setAngularCSRFToken($http);

  var resetPasswordForm = function(){
    $scope.passwordForm = angular.copy(passwordForm);
  };

  var validPasswordForm = function(){
    if(timeOut) $timeout.cancel(timeOut);
    $scope.errors = {};

    if(!($scope.passwordForm.password)) $scope.errors['password'] = "Please enter your new password.";
    if($scope.passwordForm.password && $scope.passwordForm.password.length < 6) $scope.errors['password'] = "Password should be atleast of 6 characters";
    if($scope.passwordForm.password && !($scope.passwordForm.confirm_password)) $scope.errors['confirm_password'] = "Please confirm your new password.";
    if($scope.passwordForm.password && $scope.passwordForm.confirm_password && $scope.passwordForm.confirm_password != $scope.passwordForm.password){
      $scope.errors['confirm_password'] = "Password does not matches the confirm password.";
    }

    var error_keys = Object.keys($scope.errors);
    timeOut = $timeout(function(){
      $scope.errors = null;
    }, 5000);
    if(error_keys && error_keys.length > 0){
      return false;
    }
    return true;
  };

  $scope.submitPasswordForm = function(){
    if($scope.loadingPasswordSubmit || !(validPasswordForm())){
      return false;
    }
    $scope.loadingPasswordSubmit = true;
    $http({
      method: 'POST',
      url: '/password/'+token,
      data: {user: $scope.passwordForm}
    }).success(function(response){
      resetPasswordForm();
      $scope.loadingPasswordSubmit = false;
      $scope.success_message = response.server_message + " Redirecting to network page...";
      $timeout(function () {
        window.location = response.redirect_url;
      }, 5000);
      recordAnalyticsEvent("Password", "Password Changed");
    }).error(function(response){
      $scope.loadingPasswordSubmit = false;
      $scope.error_message = response.server_message;
      $timeout(function () {
        $scope.error_message = "";
      }, 5000);
    });
  };


  var token = $(".js_reset_password").data('token');

  var passwordForm = {
    password: null,
    confirm_password: null
  };
  var timeOut = null;
  resetPasswordForm();

}]);