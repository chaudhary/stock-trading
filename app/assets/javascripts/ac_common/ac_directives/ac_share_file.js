angular.module('ac').run(['$rootScope', '$http', function($rootScope, $http) {
  setAngularCSRFToken($http);
  $rootScope.upload_metadata = {};

//  re-fetching upload metadata evertime from backend to avoid problems for file being uploaded with same name
  $rootScope.fetchFileUploadMetadata = function(asset_type){
    return $http({
      url: "/file_upload/upload_metadata",
      method: "POST",
      data: {asset_types: asset_type}
    }).success(function(response){
      $rootScope.upload_metadata = Object.assign($rootScope.upload_metadata, response);
    });
  };
}]);

/*
<div ac-file-upload class="file_upload_box" jfu-model="currentUser.data.image"
  data-opts="{only_image: true, single_file: true, afterFileUpload: afterImageUpload, beforeFileUpload: beforeFileUpload,
    params: {type: 'profile_image', profile_id: currentUser.data.id}}">
  <div class="ac_button">Upload Picture</div>
</div>
*/
angular.module('ac.directives').directive('acFileUpload', ['$timeout','$parse', '$http', function($timeout, $parse, $http) {
  return {
    restrict : 'A',
    require : '?jfuModel',
    link : function(scope, elem, attrs) {

      var sharedFileIds = function(){
        var shared_files = model(scope);
        if(opts.single_file){
          if(shared_files){
            return shared_files.id;
          }else{
            return null;
          }
        }
        var shared_file_ids = [];
        angular.forEach(shared_files, function(shared_file){
          shared_file_ids.push(shared_file.id);
        });
        return shared_file_ids;
      };

      var removeSharedFile = function(shared_file){
        if(shared_file.instance) shared_file.instance.abort();
        if(opts.single_file){
          model.assign(scope, null);
        }else{
          var shared_files = model(scope);
          var index = -1;
          angular.forEach(shared_files, function(sf, sf_index){
            if(sf.original_filename == shared_file.original_filename){
              index = sf_index;
            }
          });
          if(index != -1){
            shared_files.splice(index, 1);
          }
          model.assign(scope, shared_files);
        }
        shared_file_id_model.assign(scope, sharedFileIds());
      };

      var setSharedFile = function(shared_file){
        var shared_files = model(scope) || [];
        shared_file.remove = function(){
          removeSharedFile(this);
        };
        if(opts.single_file){
          shared_files = shared_file;
        }else{
          shared_files.push(shared_file);
        }
        model.assign(scope, shared_files);
        shared_file_id_model.assign(scope, sharedFileIds());
        $timeout(function(){
          $.colorbox.resize();
        });
      };

      var setFileId = function(shared_file, file_id, file_url){
        shared_file.uploaded = true;
        shared_file.id = file_id;
        shared_file.file_url = file_url;
        delete shared_file['instance'];
        var shared_files = model(scope);
        if(shared_files instanceof Array){
          var uploadingFiles = false;
          angular.forEach(shared_files, function(shared_file){
            if(!(shared_file.uploaded)){
              uploadingFiles = true;
            }
          });
          scope.uploadingFiles = uploadingFiles;
        }else{
          scope.uploadingFiles = false;
        }
        shared_file_id_model.assign(scope, sharedFileIds());
      };


      var onAdd = function(e, data){
        var total_files = data.originalFiles.length;
        var file_count = data.originalFiles.indexOf(data.files[0]);

        var shared_file = {original_filename: data.files[0].name, progress: 0, uploaded: false, id: null, instance: null};
        data.shared_file = shared_file;

        scope.uploadingFiles = true;
        scope.$apply();

        if(opts.beforeFileUpload){
          opts.beforeFileUpload();
        }

        var promise = scope.fetchFileUploadMetadata(opts.params.type);
        promise.success(function(){
          instance = data.submit();
          shared_file.instance = instance;
          setSharedFile(shared_file);
        });
      };

      var onProgress = function(e, data) {
        var file_count = data.originalFiles.indexOf(data.files[0]);
        var progress = parseInt(data.loaded / data.total * 100, 10);

        data.shared_file.progress = progress;
      };

      var onDone = function(e, data) {
        var file_count = data.originalFiles.indexOf(data.files[0]);
        if (data.textStatus == "success") {
          var xmldoc = $.parseXML(data.result);
          var $xml = $(xmldoc);
          var bucketText = $xml.find("Bucket").text();
          var keyText = $xml.find("Key").text();
          var file_url = document.location.protocol + "//" + bucketText + ".s3.amazonaws.com/" + keyText;

          var params = angular.copy(opts.params);
          params.bucket = bucketText;
          params.key = keyText;

          var promise = $http({
            url: "/file_upload/upload_asset.js",
            method: "GET",
            params: params
          });

          promise.success(function(response){
            setFileId(data.shared_file, response, file_url);
            if(opts.afterFileUpload){
              opts.afterFileUpload();
            }
          });
        } else {
          alert("Could not upload shared file.");
        }
      };

      var formData = function(form){
        var params = [];
        angular.forEach(scope.upload_metadata[opts.params.type].params, function(value, key){
          params.push({name: key, value: value});
        });
        return params;
      };

      var environment = $('meta[name="environment"]').attr('content');
      var form_url = "https://ac-development.s3.amazonaws.com";
      if(environment == 'production'){
        form_url = "https://alma-connect.s3.amazonaws.com";
      }

      var defaults = {
        type : "POST",
        autoUpload : true,
        dataType : 'text',
        formData: formData,
        url: form_url,
        add : onAdd,
        progress: onProgress,
        done: onDone,
      };

      var opts = angular.extend({}, defaults, scope.$eval(attrs.opts));
      if(opts.only_image){
        opts.acceptFileTypes = /(\.|\/)(gif|jpe?g|png)$/i;
      }
      if(opts.only_csv){
        opts.acceptFileTypes = /(\.|\/)(csv)$/i;
      }

      var model = $parse(attrs.jfuModel);
      var shared_file_id_model = null;
      if(opts.single_file){
        shared_file_id_model = $parse(attrs.jfuModel + '_id');
      }else{
        shared_file_id_model = $parse(attrs.jfuModel.slice(0, attrs.jfuModel.length-1)+'_ids');
      }

      var prepopulates = angular.copy(scope.$eval(attrs.jfuModel));

      if(opts.single_file && prepopulates){
        setSharedFile(prepopulates);
      }else if(!(opts.single_file)){
        model.assign(scope, []);
        shared_file_id_model.assign(scope, []);
        if(prepopulates){
          angular.forEach(prepopulates, function(prepopulate){
            setSharedFile(prepopulate);
          });
        }
      }

      $(elem).prepend('<input name="file" type="file" multiple="'+!(opts.single_file)+'" />');

      elem.bind("click", function() {
        if (!$(this).hasClass("initialized")) {
          $(this).addClass("initialized");
          var elem = $(this).find("input");
          $(elem).fileupload(opts);
        }
      });

    }
  };
}]);

/*
<div ac-shared-file="shared_file"></div>
*/
angular.module('ac.directives').directive('acSharedFile', ['$animate', '$sce', function($animate, $sce) {
  return {
    restrict: 'A',
    transclude: 'element',
    controller: angular.noop,
    link: function(scope, $element, $attr, ctrl, $transclude) {
      var block, $scope, previousElements;
      $scope = scope.$new();
      $transclude($scope, function (clone) {
        clone[clone.length++] = document.createComment(' end acSharedFile: ' + $attr.acSharedFile + ' ');
        block = {
          clone: clone
        };
        $animate.enter(clone, null, $element);
      });
      scope.$watch($attr.acSharedFile, function watchAction(shared_files) {
        if(!shared_files){
          $scope.shared_files = [];
        }else if(shared_files instanceof Array){
          $scope.shared_files = shared_files;
        }else{
          $scope.shared_files = [shared_files];
        }
      });
    }
  };
}]);

angular.module('ac.directives').directive('acSharedFile', ['$compile', '$sce',
function($compile, $sce) {
  return {
    restrict: 'ECA',
    priority: -400,
    require: 'acSharedFile',
    templateUrl: $sce.trustAsResourceUrl('common/templates/shared_file'),
    link: function(scope, $element, $attr, ctrl) {
      $compile($element.contents())(scope);
    }
  };
}]);
