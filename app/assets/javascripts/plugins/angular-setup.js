// TODO: move these functions to angular service

function setAngularCSRFToken($http) {
  var csrf_token = $('meta[name=csrf-token]').attr('content');
  if (csrf_token) {
    $http.defaults.headers.put['X-CSRF-Token'] = csrf_token;
    $http.defaults.headers.post['X-CSRF-Token'] = csrf_token;
    $http.defaults.headers.common['X-CSRF-Token'] = csrf_token;
    $http.defaults.headers.common['X-Requested-With'] = "XMLHttpRequest";
  }
}

function angularIsUnchanged(changed, original, attribute) {
  if (attribute) {
    return angular.equals(changed[attribute], original[attribute]);
  } else {
    return angular.equals(changed, original);
  }
}

function isUserAuthorized(userPermissions, action, currentUserId, resourceId) {
  var allowed = false;

  if ($.inArray('self', action.permissions) > -1) {
    if (currentUserId && resourceId) {
      if (currentUserId == resourceId) {
        allowed = true;
      }
    }
  }

  if (angular.equals(action.permissions, [])) {
    allowed = false;
  } else if (action.permissions == null) {
    allowed = true;
  } else {
    angular.forEach(action.permissions, function (permission) {
      if (($.inArray(permission, userPermissions) > -1)) {
        allowed = true;
      }
    });
  }

  return allowed;
}

