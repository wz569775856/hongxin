/**
 * Created by doucharles1 on 16/3/10.
 */
var path=require("path")
var fs=require("fs")
var arrStrFileName=fs.readdirSync(__dirname)


for(var i in arrStrFileName){
    var strName=arrStrFileName[i]
    var strPath=path.join(__dirname,strName)
    require(strPath)
}

