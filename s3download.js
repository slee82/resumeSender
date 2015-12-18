var AWS = require('aws-sdk');
var fs = require('fs');
 
var s3client = new AWS.S3();
 
var filename = "Assignment2.docx";

var params = {
    Bucket: "cloud2015project",        //required 
    Key: "info.pdf"           //required 
}
var sessionParams = {
    maxPartSize: 20971520,//default 20MB 
    concurrentStreams: 5,//default 5 
    maxRetries: 3,//default 3 
    totalObjectSize: 20971520//required size of object being downloaded 
}
var downloader = require('s3-download')(s3client);
 
var d = downloader.download(params,sessionParams);
d.on('error',function(err){
    console.log(err);
});
// dat = size_of_part_downloaded 
d.on('part',function(dat){
    console.log(dat);
});
d.on('downloaded',function(dat){
    console.log(dat);
});
 
var w = fs.createWriteStream("temp/123.pdf");
d.pipe(w);