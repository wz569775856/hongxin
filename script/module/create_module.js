/**
 * Created by doucharles1 on 16/4/14.
 */
var argv = require('minimist')(process.argv.slice(2))
var create=require("./create.js")

for(var i in argv["_"]){
    var name=argv["_"][i]
    create.controller(name,true,true)
    create.dao(name)
    create.view(name,true,true)
}