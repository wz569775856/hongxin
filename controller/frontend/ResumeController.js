/**
 * Created by doucharles1 on 16/3/18.
 */
var async=require("async")
var _=require("underscore")
var util=require("util")
$load("FileManager.js")

var arrRoutes=[
    ["put","headportrait","$auth",headImg],
    ["put","selfdescription","$auth",selfDescription],
    ["put","expectation","$auth",workexpectation],
    ["post",":attribute","$auth",insertOthers],
    ["put",":attribute/:id","$auth",updateOthers],
    ["delete",":attribute/:id","$auth",deleteOthers],
    ["get","details","$auth",queryDetails]
]

function ResumeController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(ResumeController,Controller)


function headImg(req,res,next){
    async.waterfall([
        function (cb) {
            $objMongoColls["maindb"]["resume"].findOne({_id:req.cid},{_id:0,img_headportrait:1},function(err,objResult) {
                if (err) {
                    cb(err, null)
                } else {
                    if (!objResult) {
                        cb(null, null)
                    } else {
                        cb(null, objResult["img_headportrait"])
                    }
                }
            })
        },
        function(strDeletedFile,cb){
            $cmn["file"].saveUploadFile(req,function(errcode,objFile){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,strDeletedFile,objFile)
                }
            })
        },
        function(strDeletedFile,objFile,cb){
            $dao["resume"]["updateResumeImg"](req,objFile,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode})
                }else{
                    cb(null,strDeletedFile)
                }
            })
        },
        function(strDeletedFile,cb){
            if(strDeletedFile){
                $cmn["file"].delete([strDeletedFile],function(errcode){
                    if(errcode!=0){
                        cb({errcode:errcode},null)
                    }else{
                        cb(null,null)
                    }
                })
            }else{
                cb(null,null)
            }
        }
    ],function(err,objResult){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json("")
        }
    })
}

function selfDescription(req,res,next){
    $dao["resume"]["updateSelfDescription"](req,req.body,function(errcode){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json("")
        }
    })
}

function insertOthers(req,res,next){
    $dao["resume"]["insertArrayAttrbute"](req,req.body,function(errcode,id){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json({_id:id})
        }
    })
}

function updateOthers(req,res,next){
    $dao["resume"]["updateArrayAttribute"](req,req.body,function(errcode){
        if(errcode==0){
            res.json()
        }else{
            res.err(errcode)
        }
    })
}

function deleteOthers(req,res,next){
    $dao["resume"]["deleteArrayAttribute"](req,function(errcode){
        if(errcode==0){
            res.json()
        }else{
            res.err(errcode)
        }
    })
}

function queryDetails(req,res,next){
    var userid=req.params.id || req.cid
    $dao["resume"]["queryResumeInfo"](userid,function(err,objResult){
        if(err==0){
            res.json(objResult)
        }else{
            res.err(err)
        }
    })
}

function workexpectation(req,res,next){
    $dao["resume"]["updateExpectation"](req,req.body,function(errcode){
        if(errcode==0){
            res.json()
        }else{
            res.err(errcode)
        }
    })
}

module.exports=new ResumeController(arrRoutes,"user/resume","user")






