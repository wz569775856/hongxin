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
    ["get","mobile/identifyingcode",_identifyingcodeValidate,"$mobileValidate",getIdentifyingCode],
    ["post","mobile/registration","$mobileValidate","$isIdentifyingCodeValid",userRegistration],
    ["post","mobile/login","$mobileValidate",login],
    ["put","mobile/password1","$mobileValidate","$isIdentifyingCodeValid",_isOldPasswordValid,resetPassword],
    ["put","mobile/password2","$mobileValidate","$isIdentifyingCodeValid",resetPassword],
    ["get","web/identifyingcode",getWebIdentifyingCode],
    ["delete","logout","$mobileValidate",logout]
]

function SSOController(arrRoute,strRoutePrefix,strViewPrefix,strSubAppName){
    Controller.call(this,arrRoute,strRoutePrefix,strViewPrefix,strSubAppName)
}

util.inherits(SSOController,Controller)

var identifyingcodeColl=$objMongoColls[$objConfig["mongodb_maindb"]]["identifyingcode"]
var usersColl=$objMongoColls[$objConfig["mongodb_maindb"]]["user"]

function _identifyingcodeValidate(req,res,next){
    if(!req.query || !req.query.purpose){
        res.err("该接口必须提供purpose查询选项.")
    }else{
        next()
    }
}

function getIdentifyingCode(req,res,next){
    req.query.id=req.query.id.toString()
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
                    cb({errcode:1001},null)
                }else{
                    if(!objResult || !objResult["codes"] || !objResult["codes"][req.query.purpose.toString()]){
                        cb(null,null)
                    }else{
                        var arrCodes=objResult["codes"][req.query.purpose.toString()]
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
                            cb({errcode:10000},null)
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
                        var objResult={errcode:obj["error"]}
                        cb(objResult,null)
                    }
                })
            }else if(parseInt(req.query.logintype)==1){
                $cmn["mailer"]["sendIdentifyingCode"](req.query.id,strCode,$objConfig["identifyingcode_purpose"][req.query.purpose.toString()],function(err,result){
                    if(err){
                        cb({errcode:1008},null)
                    }else{
                        cb(null,null)
                    }
                })
            }else{
                cb(null,null)
            }
        },
        function(cb){
            var objNewIdCode={code:req.query.identifyingcode,datetime:new Date()}
            req.query.arrDtTodayCodes.push(objNewIdCode)
            var strUpdateKey=util.format("codes.%s",req.query.purpose)
            var objUpdate={"$set":{}}
            objUpdate["$set"][strUpdateKey]=req.query.arrDtTodayCodes
            identifyingcodeColl.updateOne({_id:req.query.id},objUpdate,{upsert:true},function(err,objResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,results){
        if(err){
            res.err(err["errcode"])
        }else{
            res.send(req.query.identifyingcode)
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

    if(!userid){
        res.err("用户id必须给出.")
        return
    }
    if(!strPassword){
        res.err("用户密码必须给出.")
        return
    }

    var dtNow=new Date()
    var objInsert={_id:userid,password:strPassword,dt_lastLogin:dtNow,dt_registration:dtNow,logintype:req.body.logintype}

    usersColl.count({_id:userid},function(err,intCount){
        if(err){
            res.err(1003)
        }else if(intCount!=0){
            res.err(1004)
        }else{
            usersColl.insertOne(objInsert,function(err,objResult){
                if(err){
                    res.err(1005)
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

    if(!userid){
        res.err("用户id必须给出.")
        return
    }
    if(!password){
        res.err("用户密码必须给出.")
        return
    }

    usersColl.findOne({_id:userid},function(err,objUser){
        if(!objUser){
            res.err(1010)
        }else{
            if(password!=objUser["password"]){
                res.err(1011)
            }else{
                var objDate=new Date()
                objUser["dt_lastLogin"]=objDate.getTime()
                objUser["dt_registration"]=objUser["dt_registration"].getTime()
                usersColl.updateOne({_id:userid},{$currentDate:{dt_lastLogin:true}},function(err,objResult){
                    if(err){
                        res.err(1002)
                    }else{
                        $dao["cmn"]["insertUserSession"](req,userid,objUser,function(errcode,strSessionID){
                            if(errcode!=0){
                                res.err(errcode)
                            }else{
                                objUser["sessionid"]=strSessionID
                                res.json(objUser)
                            }
                        })
                    }
                })
            }
        }
    })
}

function _isOldPasswordValid(req,res,next){
    var oldPassword=req.body.oldpassword
    var userid=req.body.id

    usersColl.findOne({_id:userid},{_id:0,password:1},function(err,objUser){
        if(err){
            res.err(1001)
        }else{
            if(objUser["password"]!=oldPassword){
                res.err(1002)
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

function _logoutValidate(req,res,next){
    var sid=req.get("x-sid")
    if(!sid){
        res.err("该接口必须提供http header:x-sid")
    }else{
        next()
    }
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