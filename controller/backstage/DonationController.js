/**
 * Created by doucharles1 on 16/4/9.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")
$load("MyUtil.js")

var arrRoutes=[
    ["post","",submitDonation],
    ["put",":id",updateDonation],
    ["post",":id/badge",insertDonationBadge],
    ["put",":id/badge/:bid",updateDonationBadge],
    ["get",":id",queryOneDetail],
    ["get",":id/badge",queryDonationBadge],
    ["put",":id/check",checkDonation]
]

function DonationController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(DonationController,Controller)


function submitDonation(req,res,next){
}

function updateDonation(req,res,next){

}

function insertDonationBadge(req,res,next){

}

function updateDonationBadge(req,res,next){

}

function queryOneDetail(req,res,next){

}

function queryDonationBadge(req,res,next){

}

function checkDonation(req,res,next){

}

module.exports=new DonationController(arrRoutes,"donation","donation")
