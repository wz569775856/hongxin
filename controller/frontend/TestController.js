var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form",test]
]

function TestController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(TestController,Controller)

function test(req,res,next){
    res.json(req.form)
}

module.exports=new TestController(arrRoutes,"test","test","")