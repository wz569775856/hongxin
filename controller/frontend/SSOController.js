/**
 * Created by doucharles1 on 16/1/27.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")
$load("MyUtil.js")
$load("Luosimao.js")
$load("Mailer.js")
var uuid=require("uuid")

var arrRoutes=[
    ["get","mobile/identifyingcode",getIdentifyingCode],
    ["post","mobile/registration","$isIdentifyingCodeValid",userRegistration],
    ["post","mobile/login",login],
    ["put","mobile/password1","$isIdentifyingCodeValid",_isOldPasswordValid,resetPassword],
    ["put","mobile/password2","$isIdentifyingCodeValid",resetPassword],
    ["get","web/identifyingcode",getWebIdentifyingCode],
    ["delete","logout",logout]
]

function SSOController(arrRoute,strRoutePrefix,strViewPrefix,strSubAppName){
    Controller.call(this,arrRoute,strRoutePrefix,strViewPrefix,strSubAppName)
}

util.inherits(SSOController,Controller)

var identifyingcodeColl=$objMongoColls[$objConfig["mongodb_maindb"]]["identifyingcode"]
var usersColl=$objMongoColls[$objConfig["mongodb_maindb"]]["user"]


function getIdentifyingCode(req,res,next){
    async.series([
        function(cb){
            if(req.query.id.indexOf("@")==-1){
                req.query.logintype=0
            }else{
                req.query.logintype=1
            }
            req.query.arrDtTodayCodes=[]
            identifyingcodeColl.findOne({_id:req.query.id},function(err,objResult){
                if(err){
                    cb(err)
                }else{
                    if(!objResult || !objResult["codes"] || !objResult["codes"][req.query.purpose]){
                        cb(null,null)
                    }else{
                        var arrCodes=objResult["codes"][req.query.purpose]
                        var intTodayCount=0
                        for(var i in arrCodes){
                            var oneCode=arrCodes[i]
                            var dtTime=oneCode["datetime"]
                            if($cmn["myutil"]["istoday"](dtTime)){
                                intTodayCount++
                                req.query.arrDtTodayCodes.push(oneCode)
                            }
                        }
                        if(intTodayCount>=$objConfig["subapp"]["sms"]["max_authcode_everyday"]){
                            cb({code:10000},null)
                        }else{
                            cb(null,null)
                        }
                    }
                }
            })
        },
        function(cb){
            var id=req.query.id
            var strCode=$cmn["myutil"]["identifyingcode"]({
                bitnum:6,
                end:9
            })
            req.query.identifyingcode=strCode
            var strMsg=$objConfig["subapp"]["sms"]["msg_template"].replace("{%verification_code%}",strCode)
            if(parseInt(req.query.logintype)==0){
                $cmn["sms"]["sendMsg"](id,strMsg,function(obj){
                    if(obj["error"]==0){
                       cb(null,null)
                    }else{
                        var objResult={code:obj["error"]}
                        cb(objResult,null)
                    }
                })
            }else if(parseInt(req.query.logintype)==1){
                $cmn["mailer"]["sendIdentifyingCode"](req.query.id,strCode,$objConfig["identifyingcode_purpose"][req.query.purpose.toString()],function(err,result){
                    if(err){
                        cb(err,null)
                    }else{
                        cb(null,null)
                    }
                })
            }else{
                cb(null,null)
            }
        },
        function(cb){
            var now=new Date()
            var strUpdateKey=util.format("codes.%s",req.query.purpose)
            var objUpdate={"$push":{}}
            objUpdate["$push"][strUpdateKey]={code:req.query.identifyingcode,datetime:now}
            identifyingcodeColl.updateOne({_id:req.query.id},objUpdate,{upsert:true},function(err,objResult){
                if(err){
                    cb(err,null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,results){
        if(err){
            res.json(err)
        }else{
            res.send("")
            if(req.query.arrDtTodayCodes.length>0){
                var strUpdateKey=util.format("codes.%s",req.query.purpose)
                var objUpdate={"$set":{}}
                objUpdate["$set"][strUpdateKey]=req.query.arrDtTodayCodes
                identifyingcodeColl.updateOne({_id:req.query.id},objUpdate,{upsert:true},function(err,objResult){
                    if(err){
                        console.log(err)
                    }
                })
            }
        }
    })
}

function getWebIdentifyingCode(req,res,next){
    var strCode=$cmn["myutil"]["identifyingcode"]()
    req.session["web_identifying_code"]=strCode
    res.json({imgcode:strCode})
}

function userRegistration(req,res,next){
    if(req.body.id.indexOf("@")==-1){
        req.body.logintype=0
    }else{
        req.body.logintype=1
    }

    var userid=req.body.id
    var strPassword=req.body.password
    var dtNow=new Date()
    var objInsert={_id:userid,password:strPassword,dt_lastLogin:dtNow,dt_registration:dtNow,logintype:req.body.logintype}

    usersColl.count({_id:userid},function(err,intCount){
        if(err){
            res.status(1003).send("")
        }else if(intCount!=0){
            res.status(1004).send("")
        }else{
            usersColl.insertOne(objInsert,function(err,objResult){
                if(err){
                    res.status(1005).send("")
                }else{
                    objInsert["dt_lastLogin"]=objInsert["dt_lastLogin"].getTime()
                    objInsert["dt_registration"]=objInsert["dt_registration"].getTime()
                    $dao["cmn"]["insertUserSession"](req,userid,objInsert,function(errcode,sessionid){
                        if(errcode!=0){
                            res.err(errcode)
                        }else{
                            objInsert["sessionid"]=sessionid
                            res.json(objInsert)
                        }
                    })
                }
            })
        }
    })
}

function login(req,res,next){
    var userid=req.body.id
    var password=req.body.password

    usersColl.findOne({_id:userid},function(err,objUser){
        if(password!=objUser["password"]){
            res.err(1010)
        }else{
            objUser["dt_lastLogin"]=objUser["dt_lastLogin"].getTime()
            objUser["dt_registration"]=objUser["dt_registration"].getTime()
            $dao["cmn"]["insertUserSession"](req,userid,objUser,function(errcode,sessionid){
                if(errcode!=0){
                    res.err(errcode)
                }else{
                    objUser["sessionid"]=sessionid
                    res.json(objUser)
                }
            })
        }
    })
}

function _isOldPasswordValid(req,res,next){
    var oldPassword=req.body.oldpassword
    var userid=req.body.id

    usersColl.findOne({_id:userid},{_id:0,password:1},function(err,objUser){
        if(err){
            res.status(1001).send("")
        }else{
            if(objUser["password"]!=oldPassword){
                res.status(1002).send("")
            }else{
                next()
            }
        }
    })
}

function resetPassword(req,res,next){
    var password=req.body.password
    var userid=req.body.id
    usersColl.updateOne({_id:userid},{"$set":{"password":password}},function(err,objResult){
        if(err){
           res.err(1002)
        }else{
           $dao["cmn"]["deleteUserSessionByID"](req,userid,function(errcode){
               if(errcode!=0){
                   res.err(errcode)
               }else{
                   res.json()
               }
           })
        }
    })
}

function logout(req,res,next){
    if(!req.isBrowser){
        req.sessionID=req.get("x-sid")
    }
    $dao["cmn"]["deleteUserSessionBySID"](req,function(errcode){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json()
        }
    })
}

module.exports=new SSOController(arrRoutes,"sso","sso","")