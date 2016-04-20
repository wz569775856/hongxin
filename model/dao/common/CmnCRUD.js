/**
 * Created by doucharles1 on 16/3/10.
 */
var _=require("underscore")
var async=require("async")

var ObjectID=require("mongodb").ObjectID
$dao["cmn"]={}

$dao["cmn"]["sync"]=function(strDbName,strCollectionName,dtSync,arrSynced,syncCount,objField,funcCb){
    var arrObjId=[]
    for(var i in arrSynced){
        arrObjId[i]=new ObjectID(arrSynced[i])
    }
    var objFilter={"dt_Sync":{"$lte":dtSync},_id:{"$nin":arrSynced}}
    var objChain=$objMongoColls[strDbName][strCollectionName].find(objFilter)
    if(objField) {
        objChain=objChain.project(objField)
    }
    objChain.sort({"dt_Sync":-1}).limit(syncCount).toArray(function(err,arrResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(null,arrResult)
        }
    })
}

$dao["cmn"]["onepage"]=function(strDbName,strCollectionName,perPage,page,objFilter,objField,objSort,funcCb){
    async.waterfall([
        function(cb){
            $objMongoColls[strDbName][strCollectionName].count(objFilter,function(err,totalRecords){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var intTotalPages=(((totalRecords%perPage)!=0) ? parseInt(totalRecords/perPage)+1 : parseInt(totalRecords/perPage))
                    cb(null,intTotalPages)
                }
            })
        },
        function(intTotalPage,cb){
            if(!objFilter){
                objFilter={}
            }
            var intSkip=(page-1)*perPage
            var objChain=$objMongoColls[strDbName][strCollectionName].find(objFilter)
            if(objField){
                objChain=objChain.project(objField)
            }
            objChain.sort(objSort).skip(intSkip).limit(perPage).toArray(function(err,results){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var objResult={
                        totalPage:intTotalPage,
                        data:results
                    }
                    cb(null,objResult)
                }
            })
        }
    ],function(err,result){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,result)
        }
    })
}

$dao["cmn"].insertOne=function(strDbName,strCollName,objInserted,funcCb){
    $objMongoColls[strDbName][strCollName].insertOne(objInserted,function(err,objResult){
        if(err){
            funcCb(1000,null)
        }else{
            funcCb(0,{_id:objResult["insertedId"].toHexString()})
        }
    })
}

$dao["cmn"].queryByID=function(strDbName,strCollName,id,objProject,funcCb){
    var objID=new ObjectID(id)

    $objMongoColls[strDbName][strCollName].findOne({_id:objID},objProject,function(err,objResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["cmn"].updateByID=function(strDbName,strCollName,id,objUpdated,dySync,funcCb){
    var objID=new ObjectID(id)

    var updated={$set:objUpdated}
    if(dySync==true) {
        updated["$currentDate"]={dt_Sync:true}
    }
    delete objUpdated["_id"]
    $objMongoColls[strDbName][strCollName].updateOne({_id:objID},updated,function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["cmn"].deleteByID=function(strDbName,strCollName,id,funcCb){
    var objID=new ObjectID(id)

    $objMongoColls[strDbName][strCollName].deleteOne({_id:objID},function(err,objResult){
        if(err){
            funcCb(1003)
        }else{
            funcCb(0)
        }
    })
}