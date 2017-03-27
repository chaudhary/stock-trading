/* Simple Image Panner and Zoomer (March 11th, 10)
* This notice must stay intact for usage
* Author: Dynamic Drive at http://www.dynamicdrive.com/
* Visit http://www.dynamicdrive.com/ for full source code
*/

// v1.1 (March 25th, 10): Updated with ability to zoom in/out of image
// v1.2 (Oct 1st, 14): Script now works on mobile devices, zoom in/out controls can be any arbitrary HTML (instead of images specifically).

//jQuery.noConflict()

var ddimagepanner={

	// set default HTML for "zoom in" and "zoom out" controls, respectively
	magnifyicons: ['<img src="/assets/magnify.gif" class="zoomcontrols" style="right:40px; bottom: 5px;" />', '<img src="/assets/magnify2.gif" class="zoomcontrols" style="right:5px; bottom: 5px;" />'],
	maxzoom: 4, //set maximum zoom level (from 1x)

	init:function($, $img, options){
		var s=options;

    var actual_img = $img.siblings('.js_actual_image')[0];
    var natural_height = actual_img.naturalHeight;
    var natural_width = actual_img.naturalWidth;

    var width = $img.width();
    var height = $img.height();

    var width_ratio = width / natural_width;
    var height_ratio = height / natural_height;
    if(width_ratio > height_ratio){
      width = height_ratio * natural_width;
    }else{
      height = width_ratio * natural_height;
    }

		s.imagesize=[width, height];
		s.oimagesize=[width, height]; //always remember image's original size
		s.pos=(s.pos=="center")? [-(s.imagesize[0]/2-s.wrappersize[0]/2), -(s.imagesize[1]/2-s.wrappersize[1]/2)] : [0, 0]; //initial coords of image
		s.pos=[Math.floor(s.pos[0]), Math.floor(s.pos[1])];
		$img.css({position:'absolute'});
		if (s.canzoom=="yes"){ //enable image zooming?
			s.dragcheck={h: (s.wrappersize[0]>s.imagesize[0])? false:true, v:(s.wrappersize[1]>s.imagesize[1])? false:true}; //check if image should be draggable horizon and vertically
			s.$statusdiv=$('<div style="position:absolute;color:white;background:#353535;padding:2px 10px;font-size:12px;visibility:hidden">1x Magnify</div>').appendTo(s.$pancontainer); //create DIV to show current magnify level
			s.$statusdiv.css({left:0, top:s.wrappersize[1]-s.$statusdiv.outerHeight(), display:'none', visibility:'visible'});
			this.zoomfunct($, $img, s);
		}
		this.dragimage($, $img, s);
	},

	dragimage:function($, $img, s){
		$img.bind('mousedown touchstart', function(e){
			var e = (e.type.indexOf('touch') != -1)? e.originalEvent.changedTouches[0] : e;
			s.pos=[parseInt($img.css('left')), parseInt($img.css('top'))];
			var xypos=[e.clientX, e.clientY];
			$img.bind('mousemove.dragstart touchmove.dragstart', function(e){
				var e = (e.type.indexOf('touch') != '-1')? e.originalEvent.changedTouches[0] : e;
				var pos=s.pos, imagesize=s.imagesize, wrappersize=s.wrappersize;
				var dx=e.clientX-xypos[0]; //distance to move horizontally
				var dy=e.clientY-xypos[1]; //vertically
				s.dragcheck={h: (wrappersize[0]>imagesize[0])? false:true, v:(wrappersize[1]>imagesize[1])? false:true};
				if (s.dragcheck.h==true) //allow dragging horizontally?
					var newx=(dx>0)? Math.min(0, pos[0]+dx) : Math.max(-imagesize[0]+wrappersize[0], pos[0]+dx); //Set horizonal bonds. dx>0 indicates drag right versus left
				if (s.dragcheck.v==true) //allow dragging vertically?
					var newy=(dy>0)? Math.min(0, s.pos[1]+dy) : Math.max(-imagesize[1]+wrappersize[1], pos[1]+dy); //Set vertical bonds. dy>0 indicates drag downwards versus up
				$img.css({left:(typeof newx!="undefined")? newx : pos[0], top:(typeof newy!="undefined")? newy : pos[1]});
				return false; //cancel default drag action
			});
			return false; //cancel default drag action
		});
		$(document).bind('mouseup touchend', function(e){
			var e = (e.type.indexOf('touch') != -1)? e.originalEvent.changedTouches[0] : e;
			$img.unbind('mousemove.dragstart touchmove.dragstart');
		});
	},
	zoom: function(s, zoomtype, $zoomimages, $img){
      var curzoom=s.curzoom; //get current zoom level
      if (zoomtype=="in" && s.curzoom==ddimagepanner.maxzoom || zoomtype=="out" && s.curzoom==1) //exit if user at either ends of magnify levels
        return;
      var basepos=[s.pos[0]/curzoom, s.pos[1]/curzoom];
      var newzoom=(zoomtype=="out")? Math.max(1, curzoom-1) : Math.min(ddimagepanner.maxzoom, curzoom+1); //get new zoom level
      $zoomimages.css("opacity", 1);
      if (newzoom==1) //if zoom level is 1x, dim "zoom out" image
        $zoomimages.eq(1).css("opacity", 0.7);
      else if (newzoom==ddimagepanner.maxzoom) //if zoom level is max level, dim "zoom in" image
        $zoomimages.eq(0).css("opacity", 0.7);
      clearTimeout(s.statustimer);
      s.$statusdiv.html(newzoom+"x Magnify").show(); //show current zoom status/level

      var nd=[s.oimagesize[0]*newzoom, s.oimagesize[1]*newzoom];
      var newpos=[basepos[0]*newzoom, basepos[1]*newzoom];
      newpos=[(zoomtype=="in" && s.wrappersize[0]>s.imagesize[0] || zoomtype=="out" && s.wrappersize[0]>nd[0])? s.wrappersize[0]/2-nd[0]/2 : Math.max(-nd[0]+s.wrappersize[0], newpos[0]),
        (zoomtype=="in" && s.wrappersize[1]>s.imagesize[1] || zoomtype=="out" && s.wrappersize[1]>nd[1])? s.wrappersize[1]/2-nd[1]/2 : Math.max(-nd[1]+s.wrappersize[1], newpos[1])];
      $img.animate({width:nd[0], height:nd[1], left:newpos[0], top:newpos[1]}, function(){
        s.statustimer=setTimeout(function(){s.$statusdiv.hide();}, 500);
      });
      s.imagesize=nd;
      s.curzoom=newzoom;
      s.pos=[newpos[0], newpos[1]];
	},

	zoomfunct:function($, $img, s){
		var magnifyicons=this.magnifyicons;
		var $zoomimages = $(magnifyicons.join(''))
			.css({zIndex:1000, cursor:'pointer', opacity:0.7})
			.attr("title", "Zoom Out")
			.appendTo(s.$pancontainer);
		$zoomimages.eq(0).css({opacity:1})
			.attr("title", "Zoom In");
    $this = this;
    $img.mousewheel(function(e){
      var $event = window.event || e;
      var zoomtype = "";
      if($event.wheelDelta > 0){
        zoomtype = "in";
      }else{
        zoomtype = "out";
      }
      $this.zoom(s, zoomtype, $zoomimages, $img);
    });
		$zoomimages.click(function(e){ //assign click behavior to zoom images
			var $zimg=$(this); //reference image clicked on
			var zoomtype=($zimg.attr("title").indexOf("In")!=-1)? "in" : "out";

			$this.zoom(s, zoomtype, $zoomimages, $img);
		});
	}

};


jQuery.fn.imgmover=function(options){
	var $=jQuery;
	return this.each(function(){ //return jQuery obj
		var $imgref=$(this);
    var actual_img = $imgref.siblings('.js_actual_image');
    if(actual_img.data('loaded') == 'loaded'){
      ddimagepanner.init($, $imgref, options);
    }else{
      actual_img.bind('load', function(){
        ddimagepanner.init($, $imgref, options);
      });
    }

		// if (parseInt(this.style.width)>0 && parseInt(this.style.height)>0) //if image has explicit CSS width/height defined
			// ddimagepanner.init($, $imgref, options);
		// else if (this.complete){ //account for IE not firing image.onload
			// ddimagepanner.init($, $imgref, options);
		// }
		// else{
      // var actual_img = $imgref.siblings('.js_actual_image');
			// actual_img.bind('load', function(){
				// ddimagepanner.init($, $imgref, options);
			// });
		// }
	});
};
