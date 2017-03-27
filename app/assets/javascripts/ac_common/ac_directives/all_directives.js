angular.module('ac.services', []);
angular.module('ac.factories', []);
angular.module('ac.controllers', ['ngSanitize', 'ui']);

angular.module('ac.directives',['ac.services', , 'currentUser']);

angular.module('ac', ['ac.controllers', 'ac.directives', 'ac.services', 'ac.factories', 'pasvaz.bindonce', 'ng', 'seo', 'angular-timeago']).
    value('$anchorScroll', null).
    run(['$window', '$templateCache', function ($window, $templateCache) {
        var templates = $window.JST,
            fileName,
            fileContent;

        for (fileName in templates) {
            fileContent = templates[fileName];
            $templateCache.put(fileName, fileContent);
        }
    }]);


angular.module('ac').config(['timeAgoSettings', function (timeAgoSettings) {
  timeAgoSettings.fullDateAfterSeconds = 60*60*24*30;
}]);

angular.module('ac').config( ['$compileProvider', function($compileProvider){
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|sms|whatsapp|file):/);
}]);

angular.module('ac').factory('$exceptionHandler', ['$log', function ($log) {
    var airbrake = new airbrakeJs.Client({
        projectId: 121545,
        projectKey: "0fcfa2fedf7b0c9b7abd47ddd0ba14c7"
    });

    var environment = $('meta[name="environment"]').attr('content');
    airbrake.addFilter(function (notice) {
        notice.context.environment = environment;
        return notice;
    });

    return function (exception, cause) {
        $log.error(exception);
        if(environment == "production") airbrake.notify({error: exception, params: {angular_cause: cause}});
    };
}]);


angular.module('ac.directives').directive('ngCustomIf', ['$animate', function($animate) {
  function toBoolean(value) {
    if (typeof value === 'function') {
      value = true;
    } else if (value && value.length !== 0) {
      var v = angular.lowercase("" + value);
      value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
    } else {
      value = false;
    }
    return value;
  };

  function getBlockElements(nodes) {
    var startNode = nodes[0],
        endNode = nodes[nodes.length - 1];
    if (startNode === endNode) {
      return (startNode);
    }

    var element = startNode;
    var elements = [element];

    do {
      element = element.nextSibling;
      if (!element) break;
      elements.push(element);
    } while (element !== endNode);

    return (elements);
  }

  return {
    transclude: 'element',
    priority: 600,
    terminal: true,
    restrict: 'A',
    $$tlb: true,
    link: function ($scope, $element, $attr, ctrl, $transclude) {
        var block, previousElements;
        $scope.$watch($attr.ngCustomIf, function ngCustomIfWatchAction(newValue, oldValue) {

          if (toBoolean(newValue)) {
            if(!previousElements){
              $transclude($scope, function (clone) {
                clone[clone.length] = document.createComment(' end ngCustomIf: ' + $attr.ngCustomIf + ' ');
                clone.length = clone.length + 1;
                block = {
                  clone: clone
                };
                previousElements = clone;
                $animate.enter(clone, $element.parent(), $element);
              });
            }
          } else {
            if(previousElements) {
              $(previousElements).remove();
              previousElements = null;
            }
            if(block) {
              previousElements = getBlockElements(block.clone);
              $(previousElements).remove();
              block = null;
              previousElements = null;
            }
          }
        }, true);
    }
  };
}]);





/*
<div ac-fb-button data-opts="{text: 'Login With Facebook', disabled: true}"></div>
*/
angular.module('ac.directives').directive('acFbButton', ['$sce', function ($sce) {
  return {
    restrict: 'A',
    templateUrl: $sce.trustAsResourceUrl('common/templates/fb_button'),

    link: function (scope, elm, attrs) {
      scope.fb_opts = scope.$eval(attrs.opts);
    }
  };
}]);


/*
<div ac-ln-button data-opts="{text: 'Login With Linkedin', disabled: true}"></div>
*/
angular.module('ac.directives').directive('acLnButton', ['$sce', function ($sce) {
  return {
    restrict: 'A',
    templateUrl: $sce.trustAsResourceUrl('common/templates/ln_button'),

    link: function (scope, elm, attrs) {
      scope.ln_opts = scope.$eval(attrs.opts);
    }
  };
}]);

/*
<div ac-concat="[o1, s1, o2, s2, o3]"></div>
*/
angular.module('ac.directives').directive('acConcat', function() {
  return function(scope, element, attrs) {

    var prepareLink = function(value) {
      if (!value) return;
      if (typeof(value) != "object") return value.toString();
      if (!value.name) return;
      if (!value.url) return value.name;

      result = '<a href="' + value.url + '" class="ac_link">' + value.name + '</a>';
      return result;
    };

    var concat = function(v1, seperator, v2) {
      return [prepareLink(v1), prepareLink(v2)].filter(String).filter(Boolean).join(seperator);
    };

    var values = scope.$eval(attrs.acConcat);
    while(values.length > 1){
      var objects = values.splice(0, 3);
      var output = concat(objects[0], objects[1], objects[2]);
      values.splice(0, 0, output);
    }

    element.append(values[0]);
  };
});


