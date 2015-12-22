var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var s3bucket = new AWS.S3({params: {Bucket: 'cloud2015project'}});
// console.log(s3bucket)

var s3 = new AWS.S3();


s3.listBuckets(function(err, data) {
  if (err) { console.log("Error:", err); }
  else {
    for (var index in data.Buckets) {
      var bucket = data.Buckets[index];
      console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
      if(bucket.Name === 'cloud2015project'){
      	 console.log("yes!!")
      }
    }
  }
});


function searchS3(bucketName, fileName){
	var params = {Bucket: bucketName, Key: fileName};
	s3.getSignedUrl('getObject', params, function (err, url) {
	  console.log("The URL is", url);
	});
}

searchS3('cloud2015project','info')