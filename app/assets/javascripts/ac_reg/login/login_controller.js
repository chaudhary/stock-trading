angular.module('AcLogin', ['ngSanitize', 'ac']);

angular.module('AcLogin').controller('LoginController', ['$scope', '$http', '$timeout','$window', function ($scope, $http, $timeout, $window) {

  setAngularCSRFToken($http);

  // *********************************Private functions***********************************************
  var resetPasswordForm = function () {
    $scope.passwordForm = angular.copy(passwordForm);
  };

  var resetLoginForm = function () {
    $scope.loginForm = angular.copy(loginForm);
  };

  var validLoginForm = function(){
    if(timeOut) $timeout.cancel(timeOut);
    var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
    $scope.errors = {};

    if(!($scope.loginForm.email)) $scope.errors['email'] = "Please enter your email.";
    if($scope.loginForm.email && !(email_regex.test($scope.loginForm.email))) $scope.errors['email'] = "Please enter valid email.";

    if(!($scope.loginForm.password)) $scope.errors['password'] = "Please enter your password.";

    var error_keys = Object.keys($scope.errors);
    timeOut = $timeout(function(){
      $scope.errors = null;
    }, 5000);
    if(error_keys && error_keys.length > 0){
      return false;
    }
    return true;
  };

  var validPasswordForm = function(){
    if(timeOut) $timeout.cancel(timeOut);
    var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
    $scope.errors = {};

    if(!($scope.passwordForm.email)) $scope.errors['email'] = "Please enter your email.";
    if($scope.passwordForm.email && !(email_regex.test($scope.passwordForm.email))) $scope.errors['email'] = "Please enter valid email.";

    var error_keys = Object.keys($scope.errors);
    timeOut = $timeout(function(){
      $scope.errors = null;
    }, 5000);
    if(error_keys && error_keys.length > 0){
      return false;
    }
    return true;
  };


  // *********************************Public functions***********************************************
  $scope.showPasswordForm = function() {
    $scope.show_password_form = true;
  };

  $scope.submitPasswordForm = function () {
    if($scope.loadingPasswordSubmit || !(validPasswordForm())){
      return false;
    }
    $scope.errorMsgPassword = null;
    $scope.loadingPasswordSubmit = true;

    $http({
      method: 'POST',
      url: '/password',
      data: $scope.passwordForm
    }).success(function(response){
      $scope.loadingPasswordSubmit = false;
      $scope.successMsgPassword = response.server_message;
      recordAnalyticsEvent("Password", "Forgot Password");
      $timeout(function () {
        $scope.loadingPasswordSubmit = null;
      }, 10000);
    }).error(function(response){
      $scope.errorMsgPassword = response.server_message;
      $scope.loadingPasswordSubmit = false;
      $timeout(function () {
        $scope.errorMsgPassword = null;
      }, 10000);
    });
  };

  $scope.submitLoginForm = function () {
    if($scope.loadingLoginSubmit || !(validLoginForm())){
      return false;
    }

    $scope.loadingLoginSubmit = true;
    var csrf_token = $('meta[name=csrf-token]').attr('content');
    if($scope.fb_auth_hash){
      $scope.loginForm.authentication = JSON.stringify($scope.fb_auth_hash);
    }

    $http({
      method: 'POST',
      url: '/signin',
      data: {user: $scope.loginForm, authenticity_token: csrf_token}
    }).success(function(response){
      $scope.successMsgLogin = "Successfully logged in";
      $window.location.href = response.redirect_url;
    }).error(function (response) {
      $scope.loadingLoginSubmit = false;
      $scope.loginForm.password = null;
      $scope.passwordForm.email = $scope.loginForm.email;
      $scope.errorMsgLogin = response.server_message;
      $timeout(function(){
        $scope.errorMsgLogin = "";
      }, 5000);
    });
  };


  // *********************************Initialization Code***********************************************
  $scope.facebook_enabled = $('meta[name=facebook_enabled]').attr('content') == "true";
  $scope.linkedin_enabled = $('meta[name=linkedin_enabled]').attr('content') == "true";

  $scope.error_message = $('.js_ac_login').data('error');
  $timeout(function(){
    $scope.error_message = null;
  }, 10000);

  $scope.hide_login_button = true;
  $scope.hide_signup_button = false;
  var timeOut = null;

  $scope.show_password_form = false;
  var params = convertSearchStringtoObject(getSearchString());
  if(params['show'] == 'forgot_password'){
    $scope.show_password_form = true;
  };

  var passwordForm = {
    email: null
  };

  var loginForm = {
    email: null,
    password: null
  };

  resetPasswordForm();
  resetLoginForm();

}]);

