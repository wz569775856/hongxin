/**
 * Created by doucharles1 on 16/4/13.
 */
var util=require("util")
var _=require("underscore")
var _s=require("underscore.string")
var mkdirp=require("mkdirp")
var fs=require("fs")
var path=require("path")
var strBackstageControllerDir=path.join(__dirname,"../../controller/backstage")
var strFrontendControllerDir=path.join(__dirname,"../../controller/frontend")
var strDaoDir=path.join(__dirname,"../../model/dao")
var strBackstageViewDir=path.join(__dirname,"../../view/html/backstage")
var strFrontendViewDir=path.join(__dirname,"../../view/html/frontend")

function createController(strControllerName,boolBackStage,boolAll){
    var str1='\
var util=require("util")\n\
var async=require("async")\n\
var _=require("underscore")\n\
var _s=require("underscore.string")\n\
$load("MyUtil.js")\n\
var path=require("path")\n\
var arrRoutes=[\n\
    []\n\
]\n\n'
    var str2=util.format('\
function %sController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){\n\
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)\n\
}\n\
util.inherits(%sController,Controller)\n\n\n\n\
module.exports=new %sController(arrRoutes,"%s","%s","")\
',_s.capitalize(strControllerName),_s.capitalize(strControllerName),_s.capitalize(strControllerName),strControllerName,strControllerName)
    var finalContent=str1+str2


    var strPathNameBk=path.join(strBackstageControllerDir,_s.capitalize(strControllerName)+"Controller.js")
    var strPathNameFe=path.join(strFrontendControllerDir,_s.capitalize(strControllerName)+"Controller.js")

    if(boolAll){
        fs.writeFileSync(strPathNameBk,finalContent)
        fs.writeFileSync(strPathNameFe,finalContent)
    }else{
        if(boolBackStage){
            fs.writeFileSync(strPathNameBk,finalContent)
        }else{
            fs.writeFileSync(strPathNameFe,finalContent)
        }
    }
}

function createDao(strDaoName){
    var dirname=path.join(strDaoDir,strDaoName)
    mkdirp(dirname)

    var strIndexContent=util.format('\
var path=require("path")\n\
var fs=require("fs")\n\
var arrStrFileName=fs.readdirSync(__dirname)\n\n\
$dao["%s"]={}\n\
for(var i in arrStrFileName){\n\
    var strName=arrStrFileName[i]\n\
    var strPath=path.join(__dirname,strName)\n\
    require(strPath)\n\
}\
 ',strDaoName)

    var strDaoMain=util.format('\
var _=require("underscore")\n\
var async=require("async")\n\
var util=require("util")\n\
var ObjectID=require("mongodb").ObjectID\n\
var Timestamp=require("mongodb").Timestamp\n\
$load("FileManager.js")\n\
$load("MyUtil.js")\n\
var _s=require("underscore.string")\n\
var obj%sColl=$objMongoColls["maindb"]["%s"]\
 ', _s.capitalize(strDaoName),strDaoName)

    mkdirp.sync(dirname)
    var strIndexPath=path.join(dirname,"index.js")
    var strDaoPath=path.join(dirname,strDaoName+".js")

    fs.writeFileSync(strIndexPath,strIndexContent)
    fs.writeFileSync(strDaoPath,strDaoMain)
}

function createView(strViewName,boolFrontEnd,boolAll){
    var strDirBk=path.join(strBackstageViewDir,strViewName)
    var strDirFe=path.join(strFrontendViewDir,strViewName)
    var strFileBackStage=path.join(strDirBk,"index.html")
    var strContent='\
{% extends ../template/common.html %}\n\
{% block title %}{% endblock %}\n\
{% block  main %}\n\n\
{% endblock %}'
    if(boolAll){
        mkdirp.sync(strDirBk)
        fs.writeFileSync(strFileBackStage,strContent)
        mkdirp.sync(strDirFe)
    }else{
        if(boolFrontEnd){
            mkdirp(strDirFe)
        }else{
            mkdirp.sync(strDirBk)
            fs.writeFileSync(strFileBackStage,strContent)
        }
    }
}

module.exports.controller=createController
module.exports.dao=createDao
module.exports.view=createView