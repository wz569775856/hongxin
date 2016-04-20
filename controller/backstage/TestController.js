/**
 * Created by doucharles1 on 16/4/11.
 */
var util=require("util")
var path=require("path")
var async=require("async")
var _=require("underscore")

var arrRoutes=[
    ["get","","$filter",returnFilter]
]

function TestController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(TestController,Controller)

function returnFilter(req,res,next){
    res.json(req.filter)
}

module.exports=new TestController(arrRoutes,"test","")