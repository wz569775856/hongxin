/**
 * Created by doucharles1 on 15/6/14.
 */
var util=require("util")
var path=require("path")
var needle=require("needle")
var moment=require("moment")
var pingpp=require("pingpp")($objConfig["subapp"]["payment"]["token"])

$cmn["payment"]=pingpp