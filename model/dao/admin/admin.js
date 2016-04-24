/**
 * Created by doucharles1 on 16/3/10.
 */
var async=require("async")
var util=require("util")
var objAdminColl=$objMongoColls[$objConfig["mongodb_maindb"]]["admin"]


$dao["admin"]["registration"]=function(req,cbFunc){
    var errcode=0
    var id=req.body._id
    var password=req.body.password
    async.waterfall([
        function(cb){
            objAdminColl.count({_id:id},function(err,count){
                if(err){
                    errcode=1001
                    cb({errcode:errcode},null)
                }else{
                    cb(null,count)
                }
            })
        },
        function(count,cb){
            if(count==0){
                var objNow=new Date()
                var objAdmin={_id:id,password:password,dt_registration:objNow,dt_lastLogin:objNow,img_headportrait:util.format("%s/img/backstage/backstage_administrator.jpg",$objConfig["static_server_url"])}
                objAdminColl.insertOne(objAdmin,function(err,result){
                    if(err){
                        errcode=1000
                        cb({errcode:errcode},null)
                    }else{
                        errcode=0
                        var objNow=new Date()
                        objAdmin["dt_registration"]=objNow.getTime()
                        objAdmin["dt_lastLogin"]=objNow.getTime()
                        req.session.user=objAdmin
                        req.user=objAdmin
                        cb(null,null)
                    }
                })
            }else{
                errcode=1009
                cb({errcode:1009},null)
            }
        },
        function(objResult,cb){
            var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],req.user._id)
            $redisClient.get(strSessionKey,function(err,strSessionID){
                if(err){
                    cb({errcode:1004},null)
                }else{
                    var objMulti=$redisClient.multi()
                    if(strSessionID){
                        objMulti.del(strSessionID)
                    }
                    objMulti.set(strSessionKey,req.sessionID)
                    objMulti.exec(function(err,replies){
                        if(err){
                            cb({errcode:1018},null)
                        }else{
                            cb(null,null)
                        }
                    })
                }
            })
        }
    ],function(err,result){
        if(err){
            cbFunc(err["errcode"])
        }else{
            cbFunc(0)
        }
    })
}

$dao["admin"]["login"]=function(req,cbFunc){
    var id=req.body._id
    var password=req.body.password
    var errcode=0
    objAdminColl.findOne({_id:id},function(err,obj){
        if(err){
            errocde=1001
            cbFunc(errcode)
        }else{
            if(!obj){
                errcode=1010
                cbFunc(errcode)
            }else{
                if(password!=obj["password"]){
                    errcode=1011
                    cbFunc(errcode)
                }
                else{
                    errcode=0
                    obj["dt_registration"]=obj["dt_registration"].getTime()
                    obj["dt_lastLogin"]=obj["dt_lastLogin"].getTime()
                    req.session.user=obj
                    req.user=obj
                    var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],req.user._id)
                    $redisClient.get(strSessionKey,function(err,strSessionID){
                        if(err){
                            cbFunc(1004)
                        }else{
                            var objMulti=$redisClient.multi()
                            if(strSessionID){
                                objMulti.del(strSessionID)
                            }
                            objMulti.set(strSessionKey,req.sessionID)
                            objMulti.exec(function(err,replies){
                                if(err){
                                    cbFunc(1018)
                                }else{
                                    cbFunc(0)
                                }
                            })
                        }
                    })
                }
            }
        }
    })
}

$dao["admin"]["resetPassword"]=function(req,cbFunc){
    var id=req.body._id
    var old=req.body.oldpassword
    var password=req.body.password
    var errcode=0

    if(old!=req.user.password){
        cbFunc(1011)
    }else{
        objAdminColl.updateOne({_id:id},{$set:{password:password}},function(err,result){
            if(err){
                errcode=1002
                cbFunc(errcode)
            }else{
                var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],id)
                $redisClient.del(strSessionKey,function(err,reply){
                    if(err){
                        cbFunc(1006)
                    }else{
                        req.session.destroy()
                        req.session=null
                        cbFunc(0)
                    }
                })
            }
        })
    }
}

$dao["admin"]["resetPassword1"]=function(req,cbFunc){
    var id=req.params._id
    var password=req.body.password
    var errcode=0

    objAdminColl.updateOne({_id:id},{$set:{password:password}},function(err,result){
        if(err){
            errcode=1002
            cbFunc(errcode)
        }else{
            var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],id)
            $redisClient.get(strSessionKey,function(err,reply){
                if(reply){
                    var objMulti=$redisClient.multi()
                    objMulti.del(reply)
                    objMulti.del(strSessionKey)
                    objMulti.exec(function(err,replies){
                        if(err){
                            cbFunc(1018)
                        }else{
                            cbFunc(0)
                        }
                    })
                }else{
                    cbFunc(0)
                }
            })
        }
    })
}

$dao["admin"]["logout"]=function(req,cbFunc){
    var userid=req.session.user._id
    var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],userid)
    $redisClient.del(strSessionKey,function(err,reply){
        if(err){
            cbFunc(1006)
        }else{
            req.session.destroy()
            req.session=null
            cbFunc(0)
        }
    })
}

$dao["admin"]["deregistration"]=function(req,cbFunc){
    var id=req.params.id
    objAdminColl.updateOne({_id:id},{$set:{off:true}},function(err,result){
        if(err){
            cbFunc(1002)
        }else{
            var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],id)
            $redisClient.del(strSessionKey,function(err,reply){
                if(err){
                    cbFunc(1006)
                }else{
                    var strSessionKey=util.format("%s%s",$objConfig["session_prefix"],id)
                    $redisClient.get(strSessionKey,function(err,reply){
                        if(reply){
                            var objMulti=$redisClient.multi()
                            objMulti.del(reply)
                            objMulti.del(strSessionKey)
                            objMulti.exec(function(err,replies){
                                if(err){
                                    cbFunc(1018)
                                }else{
                                    cbFunc(0)
                                }
                            })
                        }else{
                            cbFunc(0)
                        }
                    })
                }
            })
        }
    })
}