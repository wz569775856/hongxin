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
    $cmn["file"].saveUploadFile(req,function(errcode,objDonation){
        if(errcode!=0){
            funcCallback(errcode,null)
        }else{
            objDonation["img_logo"]=objDonation["img_logo"] && objDonation["img_logo"][0]
            objDonation["type"]=parseInt(objDonation["type"])
            objDonation["dt_end"]=parseInt(objDonation["dt_end"])
            objDonation["target_amount"]=Number(objDonation["target_amount"])
            var dtNow=new Date()
            var intNow=dtNow.getTime()
            if(objDonation["dt_end"]<=intNow){
                funcCallback(11000,null)
            }else{
                if(objDonation["type"]==0){
                    objDonation["state"]=3
                }else{
                    objDonation["state"]=0
                }
                objDonation["dt_publish"]=new Date()
                objDonation["dt_sync"]=new Date()
                objDonationColl.insertOne(objDonation,function(err,objResult){
                    if(err){
                        funcCallback(1000,null)
                    }else{
                        funcCallback(0,{_id:objResult["insertedId"].toHexString()})
                    }
                })
            }
        }
    })
}

$dao["donation"]["update"]=function(req,objDonationID,funcCb){
    async.waterfall([
        function(cb){
            $cmn["file"].saveUploadFile(req,function(errcode,objDonation){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    objDonation["img_logo"]=objDonation["img_logo"] && objDonation["img_logo"][0]
                    objDonation["type"]=parseInt(objDonation["type"])
                    objDonation["dt_end"]=parseInt(objDonation["dt_end"])
                    objDonation["target_amount"]=Number(objDonation["target_amount"])
                    var dtNow=new Date()
                    var intNow=dtNow.getTime()
                    objDonation["dt_sync"]=new Date()
                    cb(null,objDonation)
                }
            })
        },
        function(objNew,cb){
            var objResult={expired:false}
            objDonationColl.findOne({_id:objDonationID},function(err,objOrigin){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var dtNow=new Date()
                    var intNow=dtNow.getTime()
                    if(objOrigin["state"]==4 || objOrigin["dt_end"].getTime()<intNow){
                        objResult["expired"]=true
                    }
                    objResult["deletedFiles"]=[objOrigin["img_logo"]]
                    for(var i in objOrigin["img_posters"]){
                        objResult["deletedFiles"].push(objOrigin["img_posters"][i])
                    }
                    cb(null,objNew,objOrigin,objResult)
                }
            })
        },
        function(objNew,objOrigin,objResult,cb){
            var objTmp=objNew
            if(objResult["expired"]){
                objTmp={state:4}
            }else{
                objNew["state"]=objOrigin["state"]
                $cmn["file"].delete(objResult["deletedFiles"],function(err,obj1){
                    if(err!=0){
                        cb({errcode:err},null)
                    }else{
                        cb(null,objTmp)
                    }
                })
            }
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"])
        }else{
            objDonationColl.updateOne({_id:objDonationID},{$set:objResult},function(err,objUpdated){
                if(err){
                    funcCb(1002)
                }else{
                    funcCb(0)
                }
            })
        }
    })
}

$dao["donation"]["detail"]=function(objDonationID,funcCb){
    objDonationColl.findOne({_id:objDonationID},function(err,objSearched){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(null,$cmn["myutil"]["parseJsonToRes"](objSearched))
        }
    })
}

$dao["donation"]["donate"]=function(objDonationID,objUserID,dbMoney,intPayType,funcCb){
    var objInserted={_id_donation:objDonationID,_id_user:objUserID,money:Number(dbMoney),type:parseInt(intPayType),dt_donation:new Date()}

}

