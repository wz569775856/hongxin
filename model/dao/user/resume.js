/**
 * Created by doucharles1 on 16/3/14.
 */
var _=require("underscore")
var util=require("util")
var async=require("async")
var ObjectID=require("mongodb").ObjectID

$dao["resume"]={}

var objResumeColl=$objMongoColls["maindb"]["resume"]

$dao["resume"]["updateResumeImg"]=function(req,objImgHeadportrait,funcCb){
    var _id=req.cid
    objImgHeadportrait["img_headportrait"]=objImgHeadportrait["img_headportrait"][0]

    var objUpdate={"$set":objImgHeadportrait}
    objResumeColl.updateOne({_id:_id},objUpdate,{upsert:true},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["updateSelfDescription"]=function(req,objSelfDescription,funcCb){
    var _id=req.cid
    objResumeColl.updateOne({_id:_id},{$set:objSelfDescription},{upsert:true},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["updateExpectation"]=function(req,objWorkExpect,funcCb){
    objResumeColl.updateOne({_id:req.cid},{$set:{expectation:objWorkExpect}},{upsert:true},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["insertArrayAttrbute"]=function(req,objInsert,funcCb){
    var id=new ObjectID()
    objInsert["id"]=id

    var objUpdate={$push:{}}
    objUpdate["$push"][req.params.attribute]=objInsert

    objResumeColl.updateOne({_id:req.cid},objUpdate,function(err,objResult){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,id)
        }
    })
}

$dao["resume"]["updateArrayAttribute"]=function(req,objUpdate,funcCb){
    var strFieldName=req.params["attribute"]
    var id=req.params["id"]
    objUpdate["id"]=new ObjectID(id)
    var objFilter={_id:req.cid}
    objFilter[util.format("%s.id",strFieldName)]=new ObjectID(id)

    var objUpdate1={$set:{}}
    objUpdate1["$set"][util.format("%s.$",strFieldName)]=objUpdate
    objResumeColl.updateOne(objFilter,objUpdate1,function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["deleteArrayAttribute"]=function(req,funcCb){
    var strFildName=req.params["attribute"]
    var id=new ObjectID(req.params["id"])

    var objDelete={$pull:{}}
    objDelete["$pull"][strFildName]={}
    objDelete["$pull"][strFildName]["id"]=id

    objResumeColl.updateOne({_id:req.user._id},objDelete,function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["queryResumeInfo"]=function(userid,funcCb){
    var id=userid

    objResumeColl.findOne({_id:id},{_id:0},function(err,objResult){
        if(err){
            funcCb(100)
        }else{
            funcCb(0,objResult)
        }
    })
}