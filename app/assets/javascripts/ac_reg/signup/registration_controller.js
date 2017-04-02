angular.module('Registration', ['ngSanitize', 'ui', 'ac', 'AcLogin']);

angular.module('Registration').controller('RegistrationController',['$scope','$http','$timeout', function ($scope, $http, $timeout) {
  setAngularCSRFToken($http);

  var email_regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
  var validated = false;

  var validUser = function(){
    if(!(validated)) return false;
    $scope.errors = {};
    if(!($scope.userForm.name)) $scope.errors['name'] = "Please enter your name.";

    if(!($scope.userForm.email)) $scope.errors['email'] = "Please enter your email.";
    if($scope.userForm.email && !(email_regex.test($scope.userForm.email))) $scope.errors['email'] = "Please enter valid email.";

    if(!($scope.userForm.authentication)){
      if(!($scope.userForm.password)) $scope.errors['password'] = "Please enter your password.";
      if($scope.userForm.password && $scope.userForm.password.length < 6) $scope.errors['password'] = "Password must be of atleast 6 characters";
    }

    var error_keys = Object.keys($scope.errors);
    if(error_keys && error_keys.length > 0){
      return false;
    }
    return true;
  };

  $scope.createAccount = function(){
    if($scope.creating_user || $scope.success_message) return true;

    $scope.success_message = null;
    $scope.error_message = null;
    validated = true;
    if(!(validUser())){
      return false;
    }
    var user_params = angular.copy($scope.userForm);
    if($scope.fb_auth_hash && !(user_params.authentication)){
      user_params.authentication = $scope.fb_auth_hash;
    }
    $scope.creating_user = true;
    $http({
      url: '/signup',
      method: 'POST',
      data: {user: user_params}
    }).success(function(response){
      $scope.creating_user = false;
      $scope.success_message = response.server_message;

      if(response.redirect_url){
        $timeout(function(){
          window.location = response.redirect_url;
        }, 5000);
      }
    }).error(function(response){
      $scope.creating_user = false;
      $scope.error_message = response.server_message;
    });
  };

  $(document).bind('ac_signup_success', function(event){
    var response = angular.copy(event.originalEvent.jsonData);
    $scope.addAuthentication(response.authentication);
    if($scope.goToSignupPage){
      $scope.goToSignupPage();
    }
    $scope.$apply();
  });

  $(document).bind('ac_signup_failure', function(event){
    var response = event.originalEvent.jsonData;
    if(response.account_created){
      $timeout(function(){
        window.location = response.redirect_url;
      }, 5000);
    }else{
      window.location = response.redirect_url;
    }
  });

  $scope.addAuthentication = function(authentication){
    $scope.state.hidePrimaryOptions = true;

    $scope.provider_sync = authentication.provider;
    $scope.show_select_college = true;

    $scope.userForm.authentication = authentication;
    $scope.authentication = authentication;

    $scope.userForm.name = authentication.name;
    $scope.userForm.email = authentication.email;
    if(authentication.profile_title && !($scope.userForm.profile_title)){
      $scope.userForm.profile_title = authentication.profile_title;
    }
    if(authentication.currently_at && !($scope.userForm.currently_at)){
      $scope.userForm.currently_at = authentication.currently_at;
    }
    if(authentication.current_city && !($scope.userForm.current_city)){
      $scope.userForm.current_city = authentication.current_city;
    }
  };

  $scope.signupwithLinkedin = function(){
    window.open('/social_sync/linkedin/user_signup/', 'Linkedin permissions',
        'width=600,height=422,scrollbars,top=50,ScreenY=250,left=50,ScreenX=300');
    $scope.reg_via = "linkedin";
  };

  $scope.signupwithFacebook = function(){
    window.open('/social_sync/facebook/user_signup', 'Facebook permissions',
        'width=600,height=422,scrollbars,top=50,ScreenY=250,left=50,ScreenX=300');
    $scope.reg_via = "facebook";
  };

  $scope.signupwithEmail = function(){
    $scope.state.hidePrimaryOptions = true;
    $scope.reg_via = "email";
  };



  $scope.years = _.range($scope.currentYear-100, $scope.currentYear - 5).reverse();
  $scope.months = [{id: 1, name: "Jan"}, {id: 2, name: "Feb"}, {id: 3, name: "Mar"}, {id: 4, name: "Apr"}, {id: 5, name: "May"}, {id: 6, name: "June"},
                   {id: 7, name: "July"}, {id: 8, name: "Aug"}, {id: 9, name: "Sept"}, {id: 10, name: "Oct"}, {id: 11, name: "Nov"}, {id: 12, name: "Dec"}];
  $scope.days = _.range(1, 32);

  $scope.hide_signup_button = true;

  $scope.facebook_enabled = $('meta[name=facebook_enabled]').attr('content') == "true";
  $scope.linkedin_enabled = $('meta[name=linkedin_enabled]').attr('content') == "true";

  if(!($scope.state)){
    $scope.state = {};
  }
  $scope.userForm = {
    name: null,
    email: null,
    currently_at: null,
    current_city: null,
    profile_title: null,
    password: null,
    authentication: null
  };

  var content = $('.js_ac_signup').data('content');
  var user_request = null;
  if(content && content.data){
    user_request = content.data;
  }
  if(user_request){
    $scope.userForm.name = user_request.name;
    $scope.userForm.email = user_request.email;
    $scope.userForm.profile_title = user_request.profile_title;
    $scope.userForm.dob_day = user_request.dob_day;
    $scope.userForm.dob_month = user_request.dob_month;
    $scope.userForm.dob_year = user_request.dob_year;
    $scope.userForm.currently_at = user_request.currently_at;
    $scope.userForm.current_city = user_request.current_city;
    $scope.userForm.invite_token = user_request.invite_token;
    if(user_request.self_requested){
      $scope.state.hidePrimaryOptions = true;
    }
  }

  $scope.$watch("userForm", validUser, true);
}]);
