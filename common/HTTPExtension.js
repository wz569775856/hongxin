/**
 * Created by doucharles1 on 16/3/8.
 */
var _=require("underscore")
var util=require("util")
var http=require("http")


http.ServerResponse.prototype.err=function(error){
    var obj=null
    if(typeof(error)=="string"){
        obj={errmsg:error}
    }else if(typeof(error)=="number"){
        obj={errmsg:$objConfig["errcode"][error.toString()]}
    }else if(_.isObject(error)){
        obj=error
    }else{
        obj={errmsg:"未知的错误"}
    }
    this.json(obj)
}

