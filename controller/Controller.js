/**
 * Created by dou on 15-5-25.
 */
var util=require("util")
var _=require("underscore")
var path=require("path")
var url=require("url")
$load("FileManager.js")
$load("MyUtil.js")

function Controller(arrRoutes,routePrefix,viewPrefix,subapp){
    this.routePrefix=routePrefix || ""
    this.viewPrefix=viewPrefix || ""
    this.subApp=subapp || ""

    for(var i in arrRoutes){
        var arrRoute=arrRoutes[i]
        var intNum=parseInt(i)+1

        if(arrRoute.length<3){
            console.log(util.format("Route%d is invalid",intNum))
            process.exit(1)
        }

        var arrMethods=arrRoute[0].split(",")
        var prePath=path.join("/",this.routePrefix,arrRoute[1])
        if(!subapp){
            prePath=path.join($objConfig["apppath"],prePath)
        }

        var arrFuncHandlers=arrRoute.slice(2)
        for(var j in arrFuncHandlers){
            var func=arrFuncHandlers[j]
           if(typeof(func)=="function"){
               arrFuncHandlers[j]= _.bind(func,this)
           }else if(typeof(func)=="string"){
               arrFuncHandlers[j]= _.bind(this[func],this)
           }else{
               console.log(util.format("argument %d is invalid, they are only be function or string!",(parseInt(j)+1)))
               process.exit(1)
           }
        }
        arrFuncHandlers.unshift(prePath)
        for(var z in arrMethods){
            var strMethod=arrMethods[z]
            if(subapp){
                $routes[subapp][strMethod].apply($routes[subapp],arrFuncHandlers)
            }else{
                $app[strMethod].apply($app,arrFuncHandlers)
            }
        }
    }
}

function _produceMapForAction_Name(req){
    var objAcl=$objConfig["acl"]
    var objMapForAction_Name={}
    for(var strKey in objAcl){
        var objGroup=objAcl[strKey]
        for(var strName in objGroup){
            var strAction=objGroup[strName]
            objMapForAction_Name[strAction]=strName
        }
    }
    req["mapForAction_Name"]=objMapForAction_Name
}


Controller.prototype.show=function(res,filename,objOption){
    var strViewPrefix=""
    if(!$isBackstage){
        if(res.req.isPC){
            strViewPrefix="pc"
        }else if(res.req.isApp){
            strViewPrefix="app"
        }else{
            strViewPrefix="m"
        }
    }
    strViewPrefix=path.join(strViewPrefix,this.viewPrefix)
    var path1=path.join(strViewPrefix,filename)
    var objContext=res.locals
    if(objOption){
        objContext= _.extend(res.locals,objOption)
    }
    res.render(path1,objContext)
}

Controller.prototype.showerr=function(res,filename,errcode){
    var strViewPrefix=""
    if(!$isBackstage){
        if(res.req.isPC){
            strViewPrefix="pc"
        }else if(res.req.isApp){
            strViewPrefix="app"
        }else{
            strViewPrefix="m"
        }
    }
    strViewPrefix=path.join(strViewPrefix,this.viewPrefix)
    var path1=path.join(strViewPrefix,filename)
    var objContext=res.locals
    objContext= _.extend(objContext,{errmsg:$objConfig["errcode"][errcode.toString()]})
    res.render(path1,objContext)
}

var identifyingcodeColl=$objMongoColls[$objConfig["mongodb_maindb"]]["identifyingcode"]
Controller.prototype.$isIdentifyingCodeValid=function(req,res,next){
    var userid=req.body.id
    var identifyingcode=req.body.identifyingcode
    var purpose=parseInt(req.body.purpose)

    var objFilter={_id:userid}
    var strFields=util.format("codes.%d",purpose)
    var objField={_id:0}
    objField[strFields]=1

    if(req.isBrowser){
        if(req.session.web_identifying_code==identifyingcode) {
            next()
        }else{
            res.err(1000)
        }
    }else{
        identifyingcodeColl.findOne(objFilter,objField,function(err,objResult){
            if(err){
                res.err(1001)
                return
            }else{
                if(!objResult){
                    res.err(1010)
                    return
                }
                var arrObjCodes=objResult["codes"][purpose.toString()]
                var isFound=false
                for(var i in arrObjCodes){
                    var objTmp=arrObjCodes[i]
                    var strCode=objTmp["code"]
                    var ts=objTmp["datetime"]
                    var objDtNow=new Date()
                    var intNowTs=objDtNow.getTime()
                    var intDiff=intNowTs-ts
                    if(strCode==identifyingcode){
                        if(intDiff<=$objConfig["subapp"]["sms"]["code_expires"]){
                            isFound=true
                            break
                        }else{
                            res.err(1001)
                            return
                        }
                    }
                }
                if(!isFound){
                    res.err(1012)
                    return
                }else{
                    var strFilter=util.format("codes.%s",req.body.purpose)
                    var objFilter={"$set":{}}
                    objFilter["$set"][strFilter]=[]
                    identifyingcodeColl.updateOne({_id:req.body.id},objFilter,function(err,objResult){
                        if(err){
                            res.err(1003)
                            return
                        }else{
                            next()
                        }
                    })
                }
            }
        })
    }
}

Controller.prototype.$mobileValidate=function(req,res,next){
    if(!req.get("x-ua")){
        res.err("该接口必须提供http头x-ua.")
    }else{
        next()
    }
}

Controller.prototype.$auth=function(req,res,next){
    req.sessionID=req.get("x-sid")
    if(req.isBrowser){
        if($isBackstage){
            res.locals.user=req.user= req.session && req.session.user
            if(req.user){
                res.locals.user=req.user
                req.cid=req.user._id
                next()
            }else{
                res.redirect("/sso/login")
            }
        }else{
            req.cid=req.session.cid
            next()
        }
    }else{
        $redisClient.hget(req.sessionID,"cid",function(err,strUserID){
            if(err){
                res.err(1004)
            }else{
                req.cid=strUserID
                next()
            }
        })
    }
}

Controller.prototype.$lefttree=function(req,res,next){
    res.locals.hasLeftTree=true
    res.locals.lefttree=$objConfig["lefttree"]
    res.locals.currentPath=req.path
    next()
}

Controller.prototype.$user=function(req,res,next){
    var strSessionKey=util.format("%s%s.userprofile",$objConfig["session_prefix"],req.cid)
    $redisClient.get(strSessionKey,function(err,objUserProfile){
        if(err){
            res.err(1004)
        }else{
            req.user=JSON.parse(objUserProfile)
            next()
        }
    })
}

function _produceFilterObj(objQuery){
    var filterObj=undefined
    for(var strKey in objQuery){
        var value=objQuery[strKey]
        var intSplitUnderline=strKey.indexOf("_")
        var strPrefix=""
        var strMainField=""
        if(intSplitUnderline==-1 || strKey.indexOf("dt_")==0){
            strMainField=strKey
        }else{
            strPrefix="$"+strKey.substr(0,intSplitUnderline)
            strMainField=strKey.substr(intSplitUnderline+1)
        }
        if(strMainField.indexOf("dt_")==0){
            var tmp=new Date()
            value=tmp.setTime(value)
        }
        if(strPrefix!=""){
            if(!filterObj){
                filterObj={}
            }
            if(!filterObj[strMainField]){
                filterObj[strMainField]={}
            }
            filterObj[strMainField][strPrefix]=value
            if(strPrefix=="$regex"){
                filterObj[strMainField]["$options"]="mi"
            }
        }else{
            filterObj[strMainField]=value
        }
    }
    return filterObj
}

Controller.prototype.$filter=function(req,res,next){
    var objQuery=req.query
    req.filter={}
    req.sort={}
    for(var strKey in objQuery){
        if(strKey=="$or"){
            if(!req.filter){
                req.filter={}
            }
            if(!req.filter["$or"]){
                req.filter["$or"]=[]
            }
            for(var i in objQuery["$or"]){
                var obj=objQuery["$or"][i]
                req.filter["$or"].push(_produceFilterObj(obj))
            }
            continue
        }
        var value=objQuery[strKey]
        var intSplitUnderline=strKey.indexOf("_")
        var strPrefix=""
        var strMainField=""
        if(intSplitUnderline==-1 || strKey.indexOf("dt_")==0){
            strMainField=strKey
        }else{
            strPrefix="$"+strKey.substr(0,intSplitUnderline)
            strMainField=strKey.substr(intSplitUnderline+1)
        }
        if(strMainField.indexOf("dt_")==0){
            var tmp=new Date()
            value=tmp.setTime(value)
        }
        if(strPrefix!=""){
            if(strPrefix=="$sort"){
                if(!req.sort){
                    req.sort={}
                }
                if(!req.sort[strMainField]){
                    req.sort[strMainField]={}
                }
                req.sort[strMainField]=value
            }else{
                if(!req.filter){
                    req.filter={}
                }
                if(!req.filter[strMainField]){
                    req.filter[strMainField]={}
                }
                req.filter[strMainField][strPrefix]=value
                if(strPrefix=="$regex"){
                    req.filter[strMainField]["$options"]="mi"
                }
            }
        }else{
            req.filter[strMainField]=value
        }
    }
    next()
}

Controller.prototype.$form=function(req,res,next){
    $cmn["file"].saveUploadFile(req,function(errcode,objForm){
        if(errcode!=0){
            res.err(errcode)
        }else{
            objForm=$cmn["myutil"]["parseJsonFromForm"](objForm)
            req.form=objForm
            next()
        }
    })
}

Controller.prototype.$body=function(req,res,next){
    var objHttpReqBody=req.body
    if(objHttpReqBody){
        objHttpReqBody=$cmn["myutil"]["parseJsonFromReq"](objHttpReqBody)
    }
    next()
}

global.Controller=Controller
