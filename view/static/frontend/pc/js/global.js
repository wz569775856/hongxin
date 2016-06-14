$(function(){
	$(".header .headerRight li").hover(
		function(){
			$(this).addClass("cur");
		},
		function(){
			$(this).removeClass("cur");
		}
	)

	if($(".newsList .globalArrowBtn").length > 0){
		$(".newsList .globalArrowBtn").on("click",function(){
			if($(this).parents(".jobTxt").hasClass("cur")){
				$(this).parents(".jobTxt").removeClass("cur");
			}else{
				$(this).parents(".jobTxt").addClass("cur");
			}
		})
	}
	
	if($(".global_form .txt").length > 0){
		$(".global_form .txt").bind("focus",function(){
			$(this).parent(".global_form").addClass("global_form_focus");
		})
		$(".global_form .txt").bind("blur",function(){
			$(this).parent(".global_form").removeClass("global_form_focus");
		})
	}

	if($(".tab-plugin").length > 0){
		$(".tab-plugin").each(function(){
			var pluginTabArr = $(this).find(".tab-plugin-tab"),pluginConArr = $(this).find(".tab-plugin-con");
			pluginTabArr.bind("click",function(){
				pluginConArr.css({"display":"none"});
				pluginTabArr.removeClass("cur");
				pluginConArr.eq(pluginTabArr.index($(this))).css({"display":"block"});
				$(this).addClass("cur");
			})
		})
	}

})