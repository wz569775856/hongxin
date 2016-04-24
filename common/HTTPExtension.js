/**
 * Created by doucharles1 on 16/3/8.
 */
var _=require("underscore")
var util=require("util")
var http=require("http")


http.ServerResponse.prototype.err=function(errcode){
    this.statusCode=errcode
    this.statusMessage=$objConfig["errcode"][errcode.toString()]
    this.end()
}

http.ServerResponse.prototype.jsonerr=function(objErrorJson){
    this.statusCode=objErrorJson["errcode"]
    this.statusMessage=$objConfig["errcode"][this.statusCode.toString()]
    delete objErrorJson["errcode"]
    this.json(objErrorJson)
}