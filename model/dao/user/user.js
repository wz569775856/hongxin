/**
 * Created by doucharles1 on 16/3/11.
 */
var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp

var objUserColl=$objMongoColls["maindb"]["user"]

$dao["user"]["updateProfile"]=function(req,objUserInfo,funcCb){
    var intSex=parseInt(req.body.sex)
    var intBirthday=parseInt(req.body.birthday)

    objUserInfo["birthday"]=intBirthday
    objUserInfo["sex"]=intSex

    intBirthday=objUserInfo["birthday"]
    var intYear=parseInt(intBirthday/10000)
    var objDateNow=new Date()
    var intYearNow=objDateNow.getFullYear()
    objUserInfo["age"]=intYearNow-intYear

    objUserInfo["img_headportrait"]=objUserInfo["img_headportrait"] && objUserInfo["img_headportrait"][0]
    objUserInfo["permission_level"]=parseInt(objUserInfo["permission_level"])
    objUserInfo["degree"]=parseInt(objUserInfo["degree"])

    async.series([
        function(cb){
           objUserColl.count({_id:{$ne:req.user._id},nickname:req.user.nickname},function(err,intCount){
               if(err){
                   cb({errcode:1002},null)
               }else{
                   if(intCount!=0){
                       cb({errcode:10005},null)
                   }else{
                       cb(null,null)
                   }
               }
           })
        },
        function(cb){
            objUserColl.updateOne({_id:req.user._id},{$set:objUserInfo},function(err,objResult){
                if(err){
                    cb({errcode:1002})
                }else{
                    cb(null,null)
                }
            })
        },
        function(cb){
            var newObjCache= _.extend(req.user,objUserInfo)
            $dao["cmn"]["updateUserProfileByID"](req.cid,objUserInfo,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,results){
        if(err){
            funcCb(err["errcode"])
        }else{
            funcCb(0)
        }
    })
}

$dao["user"]["authentication"]=function(req,objAuthInfo,funcCb){
    if(!objAuthInfo["img_identification_card1"]){
        funcCb(10001)
        return
    }
    if(!objAuthInfo["img_identification_card2"]){
        funcCb(10002)
        return
    }
    objAuthInfo["img_identification_card1"]=objAuthInfo["img_identification_card1"] && objAuthInfo["img_identification_card1"][0]
    objAuthInfo["img_identification_card2"]=objAuthInfo["img_identification_card2"] && objAuthInfo["img_identification_card2"][0]

    //0:待验证 1:验证通过 2:验证未通过
    objAuthInfo["authentication_state"]=0


    objUserColl.updateOne({_id:req.user._id},{$set:objAuthInfo},function(err,objResult){
        if(err){
            funcCb(1002,null)
        }else{
            var newCacheObj= _.extend(req.user,objAuthInfo)
            $dao["cmn"]["updateUserProfileByID"](req.cid,objAuthInfo,function(errcode){
                funcCb(errcode)
            })
        }
    })
}

$dao["user"]["authPass"]=function(req,funcCb){
    var objUpdate={}
    var objTmp={}
    var adminid=req.cid

    if(req.body.pass==true){
        objUpdate["$set"]={"authentication_state":1,"permission_level":1}
        objTmp={"authentication_state":1,"permission_level":1}
        objUpdate["$unset"]={auth_failure_reason:""}
    }else{
        if(!req.body.reason){
            funcCb(10004)
            return
        }
        objUpdate["$set"]={"authentication_state":2,"permission_level":0}
        objTmp={"authentication_state":2,"permission_level":0}
        objUpdate["$set"]={"auth_failure_reason":req.body.reason}
        objTmp["auth_failure_reason"]=req.body.reason
    }
    objUpdate["$set"]["check_administrator"]=adminid
    objUserColl.findOneAndUpdate(
        {
            _id:req.params.id,
            $or:[{check_administrator:{$exists:false}},{check_administrator:adminid}]
        },
        objUpdate,
        {
            returnOriginal:false
        },
        function(err,objUpdated){
            if(err){
                funcCb(1002)
            }else{
                $dao["cmn"]["updateUserProfileByID"](req.params.id,objUpdated,function(errcode){
                    funcCb(errcode)
                })
            }
        }
    )
}

$dao["user"]["grantIntegral"]=function(strUserID,integral,funcCb){
    objUserColl.findOneAndUpdate({_id:strUserID},{$inc:{integral:integral}},{returnOriginal:false},function(err,objUser){
        if(err){
            funcCb(1001)
        }else{
            $dao["cmn"]["updateUserProfileByID"](strUserID,objUser,function(errcode){
                funcCb(errcode)
            })
        }
    })
}

$dao["user"]["grantBadge"]=function(strUserID,objBadgeID,funcCb){
    var objNow=new Date()
    objUserColl.updateOne({_id:strUserID},{$push:{badges:{id:objBadgeID,dt_achieve:objNow}}},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}