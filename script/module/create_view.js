/**
 * Created by doucharles1 on 16/4/14.
 */
var argv = require('minimist')(process.argv.slice(2))
var create=require("./create.js")
var boolIsFrontend=false
var boolAll=false

if(argv["all"]){
    boolAll=true
}

if(argv["frontend"]){
    boolIsFrontend=true
}

for(var i in argv["_"]){
    var strViewName=argv["_"][i]
    create.view(strViewName,boolIsFrontend,boolAll)
}
