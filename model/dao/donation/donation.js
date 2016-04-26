/**
 * Created by doucharles1 on 16/4/9.
 */
var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var path=require("path")
$load("FileManager.js")
$load("MyUtil.js")

var objDonationColl=$objMongoColls["maindb"]["donation"]
var objBadgeColl=$objMongoColls["maindb"]["badge"]

$dao["donation"]["insert"]=function(req,funcCallback){

    if(objDonation["logo"] && objDonation["logo"][0]){
        objDonation["logo"]=objDonation["logo"][0]
    }
    objDonation["dt_publish"]=new Date()
    objDonation["dt_sync"]=new Date()
    $dao["cmn"]["insertOne"]("maindb","donation",objDonation,function(errcode,objID){
        funcCallback(errcode,objID)
    })
}

$dao["donation"]["queryDeletedFiles"]=function(donationID,funcCallback){
    objDonationColl.findOne({_id:new ObjectID(donationID)},{fields:{_id:0,fields:{logo:1,posters:1}}},function(err,doc){
        if(err){
            funcCallback(1001,null)
        }else{
            var arrDeleted=[]
            arrDeleted.push(doc["logo"])
            for(var i in doc["posters"]){
                arrDeleted.push(doc["posters"][i])
            }
            funcCallback(0,arrDeleted)
        }
    })
}

$dao["donation"]["update"]=function(id,objUpdated,funcCallback){
    $dao["cmn"]["updateByID"](id,objUpdated,true,function(errcode){
        funcCallback(errcode)
    })
}

$dao["donation"]["editBadge"]=function(donationID,objBadgeInfo,funcCallback){
    if(objBadgeInfo["_id"]){
        objBadgeInfo["_id"]=new ObjectID(objBadgeInfo["_id"])
    }else{
        objBadgeInfo["_id"]=new ObjectID()
    }
    var badgeID=objBadgeInfo["_id"]
    objBadgeInfo["logo"]= objBadgeInfo && objBadgeInfo["logo"] && objBadgeInfo["logo"][0]
    objBadgeInfo["dt_edit"]=new Date()
    delete objBadgeInfo["_id"]
    var objBadgeInfoUpdated={$set:{binding:{collection:"donation",id:donationID}},type:"募捐徽章"}
    async.series([
        function(cb){
            $objMongoColls["maindb"]["badge"].updateOne({_id:badgeID},objBadgeInfoUpdated,{upsert:true},function(err,objResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(cb){
            objBadgeInfo["_id"]=badgeID
            $objMongoColls["maindb"]["donation"].updateOne({_id:donationID},{$set:{badge:objBadgeInfo}},function(err,objResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCallback(err["errcode"])
        }else{
            funcCallback(0)
        }
    })
}

$dao["donation"]["deleteBadge"]=function(donationID,badgeID,funcCb){
    var objDonationID=new ObjectID(donationID)
    var objBadgeID=new ObjectID(badgeID)
    async.series([
        function(cb){
            $objMongoColls["maindb"]["badge"].deleteOne({_id:objBadgeID},function(err,objResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(cb){
            $objMongoColls["maindb"]["donation"].updateOne({_id:objDonationID},{$unset:"badge"},function(err,objResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"])
        }else{
            funcCb(0)
        }
    })
}

$dao["donation"]["queryBadgeDetail"]=function(donationID,funcCb){
   objDonationColl.findOne({_id:new ObjectID(donationID)},{fields:{badge:1}},function(err,obj){
       if(err){
           funcCb(1001,null)
       }else{
           obj["_id"]=obj["_id"].toHexString()
           obj["badge"]["_id"]=obj["badge"]["_id"].toHexString()
           obj["dt_publish"]=obj["dt_publish"].getTime()
           obj["dt_Sync"]=obj["dt_Sync"].getTime()
           obj["badge"]["dt_edit"]=obj["badge"]["dt_edit"].getTime()
           funcCb(0,obj)
       }
   })

}

$dao["donation"]["userDonate"]=function(donationID,userID,numMoney,funcCb){

}

$dao["donation"]["checkDonate"]=function(donationID,adminID,objCheckResult,funcCb){

}

