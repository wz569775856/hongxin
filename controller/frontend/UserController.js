/**
 * Created by doucharles1 on 16/3/14.
 */
var util=require("util")
var async=require("async")
var path=require("path")
$load("FileManager.js")

var arrRoutes=[
    ["put","profile","$auth","$user",updateProfile],
    ["put","authentication","$auth","$user",userAuthentication],
    ["put","authentication/verify/:id","$auth","$user",userAuthVerify],
    ["get","details","$auth","$user",userDetails]
]

function UserController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(UserController,Controller)


function updateProfile(req,res,next){
    var strUrlOldImg=req.user.img_headportrait

    async.waterfall([
        function(cb){
            $cmn["file"].saveUploadFile(req,function(errcode,objResult){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,objResult)
                }
            })
        },
        function(objUserInfo,cb){
            $dao["user"]["updateProfile"](req,objUserInfo,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(objResult,cb){
            if(strUrlOldImg){
                $cmn["file"].delete([strUrlOldImg],function(err){
                    if(err!=0){
                        cb({errcode:err},null)
                    }else{
                        cb(null,null)
                    }
                })
            }else{
                cb(null,null)
            }
        }
    ],function(err,results){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json()
        }
    })
}

function userAuthentication(req,res,next){
    if(!req.user.firstname || !req.user.lastname){
        res.err(10000)
        return
    }else{
        var strFullName=req.user.firstname+req.user.lastname
        req.userFullName=strFullName
    }

    var arrDeletedFiles=[]
    if(req.user.img_identification_card1){
        arrDeletedFiles.push(req.user.img_identification_card1)
    }
    if(req.user.img_identification_card2){
        arrDeletedFiles.push(req.user.img_identification_card2)
    }

    async.waterfall([
        function(cb){
            $cmn["file"].saveUploadFile(req,function(errcode,objResult){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,objResult)
                }
            })
        },
        function(objResult,cb){
            $dao["user"]["authentication"](req,objResult,function(intErr,objResult){
                if(intErr!=0){
                    cb({errcode:intErr},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(result,cb){
            if(arrDeletedFiles.length!=0){
                $cmn["file"].delete(arrDeletedFiles,function(intErr){
                    if(intErr==0){
                        cb(null,null)
                    }else{
                        cb({errcode:intErr},null)
                    }
                })
            }else{
                cb(null,null)
            }
        }
    ],function(err,results){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json()
        }
    })
}

function userAuthVerify(req,res,next){
    if(req.user.authentication_state==1){
        res.err(10003)
    }else{
        $dao["user"]["authPass"](req,function(errcode){
            if(errcode!=0){
                res.err(errcode)
            }else{
                res.json()
            }
        })
    }
}

function userDetails(req,res,next){
    res.json(req.user)
}

module.exports=new UserController(arrRoutes,"user","user")