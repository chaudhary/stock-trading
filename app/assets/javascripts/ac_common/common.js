function ac_bootstrap(elem, modules){
  if(elem){
    angular.bootstrap(elem, modules);
  }
}

function populateTime(startVar, endVar, additionalArray) {
  var newArray = [];
  for (var i = startVar; i <= endVar; i++) {
    var data = {};
    if (additionalArray) {
      data.id = i;
      data.name = additionalArray[i - 1];
    } else {
      data.id = i;
      data.name = i;
    }
    newArray.push(data);
  }
  return newArray;
}

function getValue(obj, key){
  if(obj) return obj[key];
  return null;
}

function getBrowserInfo(){
  var ua = navigator.userAgent.toLowerCase();
  var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
    /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
    /(msie) ([\w.]+)/.exec( ua ) ||
    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
    [];

  var matched = {
      browser: match[ 1 ] || "",
      version: match[ 2 ] || "0"
  };

  var browser = {};

  if ( matched.browser ) {
    browser[ matched.browser ] = true;
    browser.version = matched.version;
  }

  // Chrome is Webkit, but Webkit is also Safari.
  if ( browser.chrome ) {
    browser.webkit = true;
  } else if ( browser.webkit ) {
    browser.safari = true;
  }

  $.browser = browser;
}

head.ready(function () {
  getBrowserInfo();
  if (($.browser.msie && parseInt($.browser.version)<9) && window.location.host.indexOf('staging')==-1) {
//  if (($.browser.msie) && window.location.host.indexOf('staging')==-1) {
    window.location.replace('/no_ie.html');
  }

  setTimeAgo();
  $('.dropdownlistbox .option-list label').click(function () {
    $('.dropdownlistbox').removeClass('active');
  });

  $(document).click(function (event) {
    if (!($(event.target).closest(".dropdown_wrapper_designation").length)) {
      if($('.dropdown_wrapper_designation .filter_dropdown').scope()){
        $('.dropdown_wrapper_designation .filter_dropdown').scope().$apply(function () {
          $('.dropdown_wrapper_designation .filter_dropdown').scope().showDesignationDropDown = false;
        });
      }
    }
  });

  $(".notifications-dropdown").click(function (event) {
    event.stopPropagation();
  });


  $(document).bind('cbox_open', function() {
    $('html').css({
      overflow: 'hidden'
    });
  }).bind('cbox_closed', function() {
    $('html').css({
      overflow: 'auto'
    });
  });


  // add csrf token to non-angular forms
  $('.csrf-token').val($('meta[name=csrf-token]').attr('content'));
});



function setTimeAgo(){
  if($("abbr.timeago").timeago){
    $("abbr.timeago").timeago();
  }
}

$(document).bind('profile_sync_success', function (event) {
  var response = angular.copy(event.originalEvent.jsonData);
  var provider = response.authentication.provider;
  if(response.key == 'get_started'){
    if(provider == "facebook"){
      shareOnFacebook('GetStarted');
    }else{
      var scope = $("[ng-controller='BatchmatesController']").scope();
      scope.$apply(function(){
        scope.fetchContacts();
      });
    }
  }else if(response.key == 'import_profile'){
    var scope = $("[ng-controller='ProfilesController']").scope();
    if(provider == "facebook"){
      scope.$apply(function(){
        scope.fetchAndUpdateFb();
      });
    }else if(provider == "linkedin"){
      scope.$apply(function(){
        scope.fetchAndUpdateLn();
      });
    }
  }else if(response.key == 'import_picture'){
    var scope = $("[ng-controller='ProfilesController']").scope();
    if(!(scope)) scope = $("[ng-controller='ProfileImageController']").scope();
    if(provider == "facebook"){
      scope.$apply(function(){
        scope.importFacebookPicture();
      });
    }else if(provider == "linkedin"){
      scope.$apply(function(){
        scope.importLinkedinPicture();
      });
    }
  }else if(response.key == 'import_pictures'){
    if(provider == "facebook"){
      var scope = $("[ng-controller='FbImportController']").scope();
      scope.$apply(function(){
        scope.importFacebookPictures();
      });
    }
    if(provider == 'instagram'){
      var scope = $("[ng-controller='InstaImportController']").scope();
      scope.$apply(function(){
        scope.importInstagramPictures();
      });
    }
  }else if(response.key == 'account_settings'){
    window.location.reload();
  }else if(response.key == 'verification'){
    var scope = $("[ng-controller='VerifyBioletController']").scope();
    scope.addAuthentication(response.authentication);
    scope.$apply();
  }else if(response.key == 'analytics'){
    window.location.reload();
  }
});

$(document).bind('profile_sync_failure', function (event) {
  var response = angular.copy(event.originalEvent.jsonData);
  setTimeout(function(){
    alert(response.message);
  }, 0);
});

jQuery.fn.log = function (msg) {
  if (window.console) {
    if (msg == undefined) {
      msg = 'log';
    }
    console.log("%s: %o", msg, this);
  }
  return this;
};

var setRegistrationMenuHeight = function() {
  $('.js_reg_menu').css('padding-bottom', $('.js_reg_menu_fixed').height());
}

head.ready( function(){
  $('textarea').not('.non-flexible').flexible();
  $(window).load(function(){
    setRegistrationMenuHeight();
  });
});

/*flexslider*/
head.ready(function () {
  var start_at = 1;
  if($(window).width() > 600){
    var directionNav = true;
    if($('.slider ul.slides').children('li').length == 1){
      directionNav = false;
    }

    $('.slider').glide({
      autoplay: false,
      keyboard: false,
      arrows: directionNav,
      nav: false,
      arrowRightText: '',
      arrowLeftText: '',
      animationTime: 2000,
      afterInit: function(){
        setBannerHeight();
      }
    });
  }

});

banner_height = 0;
header_height = 0;

function setBannerHeightWithoutScroll() {
  header_height = $('.js_main_menu').height();

  var dashboard_visible = ($('.js_fix_dashboard').is(':visible'));
  if(dashboard_visible){
    banner_height = $('.js_fix_dashboard').height();
  }else{
    banner_height = 0;
  }
  $('.js_fix_dashboard').siblings('.movable_header').css('height', banner_height+'px');
}

function setBannerHeight() {
  setBannerHeightWithoutScroll();
  $(window).scroll();
}


/*
<div style="position: relative;">
  <div class="movable"></div>
  <div class="js_to_be_fixed"></div>
</div>
*/


function moveProfile(element){
  var jqElement = $(element);
  if(!(jqElement.is(':visible'))) return true;
  var scroll_top = $(document).scrollTop();

  if(jqElement.offset()){
    var flag = (scroll_top + $(window).height() > jqElement.outerHeight() + jqElement.parent().offset().top);
    var value = ( $(window).height() - jqElement.outerHeight());

    if (scroll_top >= banner_height && flag) {
      var actual_height = jqElement.parent().offset().top - banner_height;

      jqElement.css('position', 'fixed');
      if (value > actual_height) {
        jqElement.css('top', actual_height + 'px');
      } else {
        jqElement.css('top', value + 'px');
      }
      jqElement.css('width', jqElement.parent().outerWidth() + 'px');
      jqElement.siblings('.movable').css('height', jqElement.outerHeight() + 'px');
    } else {
      jqElement.css('position', '');
      jqElement.css('top', '');
      jqElement.css('width', '');
      jqElement.siblings('.movable').css('height', '');
    }
  }
}

function moveMenuDirectory() {
  moveProfile('.js_search_headers');
  moveProfile('.js_left_filters');
};

var safeApply = function(scope, fn) {
  if (!scope) return;
  var phase = scope.$root.$$phase;
  if(phase == '$apply' || phase == '$digest') {
    if(fn && (typeof(fn) === 'function')) {
      fn();
    }
  } else {
    scope.$apply(fn);
  }
};


head.ready(function () {
  $(window).load(function () {
    $.colorbox.resize();
  });
});

function displayDate(date) {
  var DAYS = 3;
  var now = moment();
  var mDate = moment(date);
  var units = ['days', 'hours', 'minutes', 'seconds'];
  var unitHash = {
    days: ['day', 'days'],
    hours: ['hour', 'hours'],
    minutes: ['min', 'mins'],
    seconds: ['sec', 'secs']
  };
  var count, unit;

  var duration = moment.duration(now - mDate);
  if (duration.asDays() > DAYS) {
    return convertFormat(date);
  } else {
    var processed = false;
    angular.forEach(units, function(u) {
      if (!processed) {
        var c = duration.as(u);
        if (c > 1) {
          unit = u;
          count = Math.round(c);
          processed = true;
        }
      }
    });

    if (!count) count = 1;
    if (!unit) unit = 'seconds';

    var index = count == 1 ? 0 : 1;

    return {date: count, day: unitHash[unit][index] + " ago"};
  }
}

function commentDate(date) {
  if(!($.timeago)){
    return null;
  }
  var DAYS = 3;
  var get_date = $.timeago(date);
  if (get_date == undefined) {
    get_date = '1 second ago';
  }
  var date_arr = get_date.split(" ");
  if (date_arr[1] != 'minute' && date_arr[1] != 'minutes' && date_arr[1] != 'hour' && date_arr[1] != 'hours' &&
    date_arr[1] != 'seconds' && date_arr[1] != 'second') {
    if ((date_arr[0] > DAYS && date_arr[1] == 'days') || (date_arr[1] != 'days')) {
      return convertFormat(date);
    } else {
      if (date_arr[1] == 'minute' || date_arr[1] == 'minutes') {
        var type = 'm';
      } else if (date_arr[1] == 'hour' || date_arr[1] == 'hours') {
        var type = 'h';
      } else if (date_arr[1] == 'day' || date_arr[1] == 'days') {
        var type = 'd';
      }
      return {"date": date_arr[0], "day": type + " " + date_arr[2]};
    }
  } else {
    if (date_arr[1] == 'second' || date_arr[1] == 'seconds') {
      var type = 's';
    }else if (date_arr[1] == 'minute' || date_arr[1] == 'minutes') {
      var type = 'm';
    } else if (date_arr[1] == 'hour' || date_arr[1] == 'hours') {
      var type = 'h';
    } else if (date_arr[1] == 'day' || date_arr[1] == 'days') {
      var type = 'd';
    }
    return {"date": date_arr[0], "day": type + " " + date_arr[2]};
  }
};

function convertFormat(date) {
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
  var new_date = new Date(date);
  var month_no = new_date.getMonth();
  return {"date": new_date.getDate(), "day": monthNames[parseInt(month_no)] + " " + new_date.getFullYear()};
}

function convertSearchStringtoObject(params, coerce) {
  var obj = {}, coerce_types = {
    'true' : !0,
    'false' : !1,
    'null' : null
  };

  $.each(params.replace(/\+/g, ' ').split('&'), function(j, v) {
    var param = v.split('='), key = decodeURIComponent(param[0]), val, cur = obj, i = 0,

    keys = key.split(']['), keys_last = keys.length - 1;

    if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
      keys[keys_last] = keys[keys_last].replace(/\]$/, '');

      keys = keys.shift().split('[').concat(keys);

      keys_last = keys.length - 1;
    } else {
      keys_last = 0;
    }

    if (param.length === 2) {
      val = decodeURIComponent(param[1]);

      if (coerce) {
        val = val && !isNaN(val) ? +val// number
        : val === 'undefined' ? undefined// undefined
        : coerce_types[val] !== undefined ? coerce_types[val]// true, false, null
        : val;
      }

      if (keys_last) {
        for (; i <= keys_last; i++) {
          key = keys[i] === '' ? cur.length : keys[i];
          cur = cur[key] = i < keys_last ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [] ) : val;
        }

      } else {
        if ($.isArray(obj[key])) {
          obj[key].push(val);
        } else if (obj[key] !== undefined) {
          obj[key] = [obj[key], val];

        } else {
          obj[key] = val;
        }
      }

    } else if (key) {
      obj[key] = coerce ? undefined : '';
    }
  });

  return obj;
};

function getSearchString(){
  var search_string = window.location.search.substring(1);
  if(!search_string){
    var temp = window.location.hash.split("?");
    if(temp.length != 1){
      search_string =  temp[1];
    }
  }
  return search_string;
};

function videoIframeURL(url){
  var youtube_regex = /(https?:\/\/)?(www.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/watch\?feature=player_embedded&v=)([A-Za-z0-9_-]*)(\&\S+)?(\S)*/;
  var vimeo_regex = /(https?:\/\/)?(www.)?vimeo\.com\/([A-Za-z0-9._%-]*)((\?|#)\S+)?/;

  var youtube_params = youtube_regex.exec(url);
  var vimeo_params = vimeo_regex.exec(url);

  if(youtube_params && youtube_params[4]){
    return "//www.youtube.com/embed/"+ youtube_params[4];
  }else if(vimeo_params && vimeo_params[3]){
    return "//player.vimeo.com/video/" + vimeo_params[3];
  }
};


function isMobileOrTab(){
  // if(navigator.userAgent.match(/iPad/i)){
    // return true;
  // }

  if(navigator.userAgent.match(/iPhone/i)){
    return true;
  }

  if(navigator.userAgent.match(/Android/i)){
    return true;
  }

  if(navigator.userAgent.match(/BlackBerry/i)){
    return true;
  }

  // if(navigator.userAgent.match(/webOS/i)){
    // return true;
  // }
  return false;
}

function get_page_range (page, total_pages, size) {
  if(!size) size = 3;
  var start = 1;
  var end = total_pages;
  end = page+size > end ? end : page+size;
  start = page-size < start ? start : page-size;
  if(end-start < (2*size)){
    end = (start==1) ? (start+(2*size) > total_pages ? total_pages : start+(2*size)) : end;
    start = end==total_pages ? (end-(2*size) < 1 ? 1 : end-(2*size)) : start;
  }

  var ret = [];
  if (!end) {
    end = start;
    start = 0;
  }
  for (var i = start; i <= end; i++) {
    ret.push(i);
  }
  return ret;
};


function recordRegAnalytics(is_network, action, via, callback){
  var local_action = null;
  if(is_network){
    local_action = "Network/";
  }else{
    local_action = "Website/";
  }
  var is_signup = (window.location.pathname.indexOf('signup') != -1);
  if(is_signup){
    local_action = local_action + "Signup/";
  }
  local_action = local_action + action;
  if(via) via = "via: " + via;
  recordAnalyticsEvent("Registration", local_action, via, null, {hitCallback: callback});
}

function resetSharedFiles(shared_files){
  if(!(shared_files)) return false;
  if(shared_files instanceof Array){
    var shared_files = shared_files.slice();
    angular.forEach(shared_files, function(shared_file, index){
      shared_file.remove();
    });
  }else{
    shared_files.remove();
  }
  return true;
}


