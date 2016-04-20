/**
 * Created by doucharles1 on 16/4/14.
 */
var argv = require('minimist')(process.argv.slice(2))
var create=require("./create.js")
var boolIsBackstage=false
var boolAll=false

if(argv["all"]){
    boolAll=true
}

if(argv["backstage"]){
    boolIsBackstage=true
}

for(var i in argv["_"]){
    var strControllerName=argv["_"][i]
    create.controller(strControllerName,boolIsBackstage,boolAll)
}