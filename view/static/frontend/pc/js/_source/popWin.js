(function($){    
  $.fn.extend({
    showPopWinPlugin:function(){
      var _this = $(this);
      _this.parent(".popMask").css("left","0px");
      _this.show();
      $(window).bind("resize",function(){
        setMarginTop();
      });
      _this.find(".popClose").bind("click",function(){
        _this.parent(".popMask").css("left","100%");
        _this.hide();
      });
      if(!-[1,]&&!window.XMLHttpRequest){
        _this.parent(".popMask").css({"height": $("body").height() - $(window).height() > 0 ? parseInt($("body").height()) : parseInt($(window).height())});
        setMarginTopIE6();
        $(window).bind("scroll",function(){
          setMarginTopIE6();
        });  
      }else{
        setMarginTop();
      }
      function setMarginTop(){
        _this.css("margin-top",($(window).height() - _this.height())/2);
      }
      function setMarginTopIE6(){
        _this.css("margin-top", document.body.scrollTop || document.documentElement.scrollTop  + ($(window).height() - _this.height())/2);
      }
    }
  })    
})(jQuery);